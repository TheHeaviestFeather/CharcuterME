/**
 * CharcuterME - AI Facade
 * Centralized interface for all AI service calls
 *
 * This facade abstracts away the underlying AI providers (Claude, Vertex AI, GPT)
 * and provides a unified API for the rest of the application.
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleAuth } from 'google-auth-library';
import { withRetry } from './retry';
import { withTimeout, TIMEOUTS } from './timeout';
import { claudeCircuit, gptCircuit } from './circuit-breaker';
import { logger } from './logger';
import { AI_MODELS, CLAUDE_SETTINGS } from './constants';
import { generateCacheKey, cacheGet, cacheSet, CACHE_TTL } from './cache';

// =============================================================================
// Types
// =============================================================================

export interface NamerResult {
  name: string;
  validation: string;
  tip: string;
  wildcard?: string;
}

export interface ImageResult {
  type: 'image' | 'svg';
  imageUrl?: string;
  svg?: string;
  template?: string;
  reason?: string;
  rules?: string[];
  fallback?: boolean;
}

export interface VibeResult {
  score: number;
  rank: string;
  compliment: string;
  sticker: string;
  improvement?: string;
}

// =============================================================================
// Client Initialization (Lazy)
// =============================================================================

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// =============================================================================
// Vertex AI Access Token
// =============================================================================

async function getVertexAccessToken(): Promise<string> {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!credentials) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not configured');
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(credentials);
  } catch {
    try {
      const decoded = Buffer.from(credentials, 'base64').toString('utf-8');
      serviceAccount = JSON.parse(decoded);
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON or base64-encoded JSON');
    }
  }

  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();

  if (!token.token) {
    throw new Error('Failed to get access token');
  }

  return token.token;
}

// =============================================================================
// AI Facade Functions
// =============================================================================

/**
 * Generate a dinner name using Claude
 */
export async function generateDinnerName(
  ingredients: string,
  systemPrompt: string
): Promise<NamerResult | null> {
  // Check cache first
  const cacheKey = generateCacheKey('dinnerName', ingredients);
  const cached = await cacheGet<NamerResult>(cacheKey);
  if (cached) {
    logger.info('AI Facade: Cache hit for dinner name');
    return cached;
  }

  // Check if API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    logger.warn('AI Facade: ANTHROPIC_API_KEY not configured');
    return null;
  }

  try {
    const result = await claudeCircuit.execute(
      async () => {
        return await withTimeout(
          withRetry(
            async () => {
              const client = getAnthropicClient();
              const message = await client.messages.create({
                model: AI_MODELS.naming,
                max_tokens: CLAUDE_SETTINGS.maxTokens,
                temperature: CLAUDE_SETTINGS.temperature,
                system: systemPrompt,
                messages: [
                  {
                    role: 'user',
                    content: `Name this girl dinner: ${ingredients}`,
                  },
                ],
              });

              const content = message.content[0];
              if (content.type !== 'text') {
                throw new Error('Unexpected response type');
              }

              return content.text;
            },
            {
              maxRetries: 2,
              shouldRetry: (error) => {
                const msg = error.message.toLowerCase();
                return msg.includes('rate limit') || msg.includes('timeout') || msg.includes('overloaded');
              },
            }
          ),
          TIMEOUTS.CLAUDE_NAMING,
          'Claude naming timed out'
        );
      },
      () => {
        logger.warn('AI Facade: Claude circuit open');
        return null;
      }
    );

    if (!result) return null;

    // Parse response
    const parsed = parseNamerResponse(result);
    if (!parsed) return null;

    // Cache the result
    cacheSet(cacheKey, parsed, CACHE_TTL.dinnerName).catch(() => {});

    return parsed;
  } catch (error) {
    logger.error('AI Facade: Error generating dinner name', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return null;
  }
}

/**
 * Generate an image using Vertex AI Imagen
 */
export async function generateImage(
  prompt: string,
  ingredients: string
): Promise<ImageResult | null> {
  // Check cache first
  const cacheKey = generateCacheKey('sketch', ingredients);
  const cached = await cacheGet<ImageResult>(cacheKey);
  if (cached) {
    logger.info('AI Facade: Cache hit for image');
    return cached;
  }

  // Check if credentials are configured
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    logger.warn('AI Facade: GOOGLE_SERVICE_ACCOUNT_KEY not configured');
    return null;
  }

  try {
    const accessToken = await getVertexAccessToken();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'charcuterme';
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '1:1',
          safetyFilterLevel: 'block_few',
          personGeneration: 'dont_allow',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('AI Facade: Vertex AI error', {
        status: response.status,
        error: errorText,
      });
      return null;
    }

    const data = await response.json();
    const predictions = data.predictions;

    if (predictions && predictions.length > 0) {
      const prediction = predictions[0];
      const imageData = prediction.bytesBase64Encoded ||
                        prediction.image?.bytesBase64Encoded ||
                        prediction.generatedImage?.bytesBase64Encoded ||
                        prediction.imageBytes;

      if (imageData) {
        const result: ImageResult = {
          type: 'image',
          imageUrl: `data:image/png;base64,${imageData}`,
        };

        // Cache the result
        cacheSet(cacheKey, result, CACHE_TTL.sketch).catch(() => {});

        return result;
      }
    }

    logger.error('AI Facade: No image in Vertex AI response');
    return null;
  } catch (error) {
    logger.error('AI Facade: Error generating image', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return null;
  }
}

/**
 * Analyze a photo for vibe check using GPT-4 Vision
 */
export async function analyzeVibe(
  photoBase64: string,
  context: { dinnerName?: string; ingredients?: string; rules?: string[] }
): Promise<VibeResult | null> {
  // Check if API key is configured
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('AI Facade: OPENAI_API_KEY not configured');
    return null;
  }

  try {
    const result = await gptCircuit.execute(
      async () => {
        const client = getOpenAIClient();

        const systemPrompt = `You are a fun, supportive food critic evaluating "girl dinner" photos.
Score the aesthetic and vibe on a scale of 0-100.
Be encouraging - even messy dinners have charm!

Return JSON only:
{
  "score": <number 0-100>,
  "rank": "<fun title like 'Couch Gourmet' or 'Midnight Chef'>",
  "compliment": "<one encouraging sentence>",
  "sticker": "<emoji that captures the vibe>",
  "improvement": "<optional playful suggestion>"
}`;

        const userContent = context.dinnerName
          ? `Rate this "${context.dinnerName}" with ${context.ingredients || 'mystery ingredients'}.`
          : 'Rate this girl dinner photo!';

        const response = await client.chat.completions.create({
          model: AI_MODELS.vibe,
          max_tokens: 300,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: userContent },
                {
                  type: 'image_url',
                  image_url: {
                    url: photoBase64.startsWith('data:')
                      ? photoBase64
                      : `data:image/jpeg;base64,${photoBase64}`,
                  },
                },
              ],
            },
          ],
        });

        return response.choices[0]?.message?.content || null;
      },
      () => {
        logger.warn('AI Facade: GPT circuit open');
        return null;
      }
    );

    if (!result) return null;

    return parseVibeResponse(result);
  } catch (error) {
    logger.error('AI Facade: Error analyzing vibe', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return null;
  }
}

// =============================================================================
// Response Parsers
// =============================================================================

function parseNamerResponse(raw: string): NamerResult | null {
  try {
    // Try direct parse
    const parsed = JSON.parse(raw);
    if (parsed.name && parsed.validation && parsed.tip) {
      return {
        name: String(parsed.name).slice(0, 50),
        validation: String(parsed.validation).slice(0, 150),
        tip: String(parsed.tip).slice(0, 200),
        wildcard: parsed.wildcard ? String(parsed.wildcard).slice(0, 100) : undefined,
      };
    }
  } catch {
    // Try extracting JSON from markdown or raw text
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.name && parsed.validation && parsed.tip) {
          return {
            name: String(parsed.name).slice(0, 50),
            validation: String(parsed.validation).slice(0, 150),
            tip: String(parsed.tip).slice(0, 200),
            wildcard: parsed.wildcard ? String(parsed.wildcard).slice(0, 100) : undefined,
          };
        }
      } catch {
        // Fall through to return null
      }
    }
  }

  return null;
}

function parseVibeResponse(raw: string): VibeResult | null {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(100, Math.max(0, Number(parsed.score) || 50)),
        rank: String(parsed.rank || 'Mystery Chef'),
        compliment: String(parsed.compliment || 'You tried and that counts!'),
        sticker: String(parsed.sticker || '🍽️'),
        improvement: parsed.improvement ? String(parsed.improvement) : undefined,
      };
    }
  } catch {
    // Fall through to return null
  }

  return null;
}

// =============================================================================
// Utility: Check Service Availability
// =============================================================================

export function isClaudeAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function isVertexAvailable(): boolean {
  return !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
}

export function isGPTAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
