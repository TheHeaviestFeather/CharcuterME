import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { isEnabled } from '@/lib/feature-flags';

// =============================================================================
// Configuration
// =============================================================================

const PROMPT_VERSION = 'vibecheck_v1.0';
const MODEL = 'claude-3-5-haiku-20241022';

function getAnthropicClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

// =============================================================================
// System Prompt
// =============================================================================

const SYSTEM_PROMPT = `You're a supportive but sarcastic food critic specializing in "girl dinners" — those glorious low-effort meals eaten on the couch at 11pm.

Your job is to analyze someone's dinner photo and give them a fun, shareable "vibe check" result.

<your_vibe>
- Supportive but snarky
- Self-deprecating millennial humor
- You CELEBRATE chaos, never judge harshly
- Like a funny friend commenting on your food pic
</your_vibe>

<your_output>
Return ONLY valid JSON with these fields:
{
  "score": "A funny score (e.g., '94%', '107%', 'yes', '∞')",
  "category": "A funny category name (2-4 words)",
  "validation": "One sentence of validation (funny but kind)",
  "observation": "One sarcastic observation about the photo (not mean)"
}
</your_output>

<good_examples>
{"score": "97%", "category": "Unhinged Excellence", "validation": "Chaotic perfection. The algorithm is impressed.", "observation": "The lighting suggests you ate this in bed. Valid."}

{"score": "102%", "category": "Overachiever", "validation": "You've exceeded the vibe. This is technically illegal.", "observation": "Did you... garnish? In this economy?"}

{"score": "yes", "category": "Beyond Metrics", "validation": "Numbers cannot contain this energy.", "observation": "We're not sure what we're looking at but we respect it."}
</good_examples>

<rules>
- Always be kind underneath the snark
- Never criticize the food quality harshly
- Celebrate the chaos, don't judge it
- Keep it short and shareable
- No emojis
</rules>`;

// =============================================================================
// Fallback Responses
// =============================================================================

const FALLBACK_VERDICTS = [
  {
    score: "94%",
    category: "Certified Chaos",
    validation: "This is exactly what dinner should look like.",
    observation: "The arrangement says 'I have priorities and plating isn't one.'",
  },
  {
    score: "87%",
    category: "Couch Cuisine",
    validation: "Peak horizontal dining energy detected.",
    observation: "We can tell this was photographed one-handed.",
  },
  {
    score: "101%",
    category: "Overachiever Alert",
    validation: "You've somehow exceeded our expectations.",
    observation: "Suspiciously well-lit. Are you okay?",
  },
];

function getRandomFallback() {
  return FALLBACK_VERDICTS[Math.floor(Math.random() * FALLBACK_VERDICTS.length)];
}

// =============================================================================
// Response Parsing
// =============================================================================

interface VibeCheckResult {
  score: string;
  category: string;
  validation: string;
  observation: string;
}

function parseResponse(raw: string): VibeCheckResult | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.score && parsed.category && parsed.validation && parsed.observation) {
      return {
        score: String(parsed.score).slice(0, 20),
        category: String(parsed.category).slice(0, 40),
        validation: String(parsed.validation).slice(0, 150),
        observation: String(parsed.observation).slice(0, 150),
      };
    }
  } catch {}

  // Try extracting JSON from markdown
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.score && parsed.category && parsed.validation && parsed.observation) {
        return {
          score: String(parsed.score).slice(0, 20),
          category: String(parsed.category).slice(0, 40),
          validation: String(parsed.validation).slice(0, 150),
          observation: String(parsed.observation).slice(0, 150),
        };
      }
    } catch {}
  }

  return null;
}

// =============================================================================
// API Route
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { userPhoto, dinnerName } = body;

    if (!userPhoto) {
      return NextResponse.json({ error: 'Photo is required' }, { status: 400 });
    }

    // Check if AI vibe check is enabled
    if (!isEnabled('enableAIVibeCheck')) {
      logger.info('AI vibe check disabled, using fallback', { promptVersion: PROMPT_VERSION });
      return NextResponse.json(getRandomFallback());
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      logger.warn('ANTHROPIC_API_KEY not configured', { promptVersion: PROMPT_VERSION });
      return NextResponse.json(getRandomFallback());
    }

    // Extract base64 data from data URL
    const base64Data = userPhoto.replace(/^data:image\/\w+;base64,/, '');
    const mediaType = userPhoto.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

    const client = getAnthropicClient();

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      temperature: 0.9,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `Vibe check this girl dinner${dinnerName ? ` called "${dinnerName}"` : ''}. Give me the verdict.`,
            },
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const parsed = parseResponse(content.text);

    if (!parsed) {
      logger.warn('Failed to parse vibe check response', {
        promptVersion: PROMPT_VERSION,
        rawResponse: content.text.slice(0, 200),
      });
      return NextResponse.json(getRandomFallback());
    }

    logger.info('Vibe check completed', {
      promptVersion: PROMPT_VERSION,
      duration: Date.now() - startTime,
      score: parsed.score,
      category: parsed.category,
    });

    return NextResponse.json(parsed);

  } catch (error) {
    logger.error('Error in vibe check', {
      promptVersion: PROMPT_VERSION,
      error: error instanceof Error ? error.message : 'Unknown',
    });

    return NextResponse.json(getRandomFallback());
  }
}
