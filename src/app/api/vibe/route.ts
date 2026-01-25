import { NextRequest, NextResponse } from 'next/server';
import type { VibeCheckResponse } from '@/types';
import { withRetry } from '@/lib/retry';
import { withTimeout, TIMEOUTS } from '@/lib/timeout';
import { gptCircuit } from '@/lib/circuit-breaker';
import { logger } from '@/lib/logger';
import { isEnabled } from '@/lib/feature-flags';
import { getOpenAIClient } from '@/lib/ai-clients';
import { MIN_VIBE_SCORE, DEFAULT_DINNER_NAME, AI_MODELS } from '@/lib/constants';
import { VibeRequestSchema, validateRequest } from '@/lib/validation';

const FALLBACK_VIBE: VibeCheckResponse = {
  score: 77,
  rank: 'Chaotic Good',
  compliment: "Our AI is napping but honestly? This gives 'main character energy' and we're here for it.",
  sticker: 'TRUST THE PROCESS',
  improvement: undefined,
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = validateRequest(VibeRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { photo, dinnerName, ingredients, rules } = validation.data!;

    // Check if vibe check is enabled
    if (!isEnabled('enableVibeCheck')) {
      logger.info('Vibe check disabled via feature flag');
      return NextResponse.json(FALLBACK_VIBE);
    }

    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OPENAI_API_KEY not configured, using fallback');
      return NextResponse.json(FALLBACK_VIBE);
    }

    const systemPrompt = `You are the Vibe Judge for CharcuterME — a chaotic millennial bestie who rates "girl dinners" with SNARKY but SUPPORTIVE humor.

CONTEXT:
Dinner name: "${dinnerName || DEFAULT_DINNER_NAME}"
Ingredients: ${ingredients || 'various life choices'}
They tried to follow: ${rules?.join(', ') || 'vibes only'}

YOUR PERSONALITY:
- Extremely online millennial/gen-z humor
- Supportive chaos energy — roast lovingly, never mean
- Reference therapy, wine, being tired, adulting struggles
- Use phrases like "this is giving...", "no notes", "main character energy", "understood the assignment"

SCORING PHILOSOPHY:
- GENEROUS scores — this is about validation, not MasterChef
- Find something genuinely funny to compliment
- Even chaos deserves recognition
- Minimum score is 40 because we're not monsters

SCORING GUIDE:
- 90-100: Influencer-ready, suspiciously good
- 75-89: Put in effort, it shows, we're proud
- 60-74: Got the spirit, chaos is charming
- 40-59: Chaotic but iconic honestly

RANKS (pick one that's FUNNY):
- 90+: "Graze Girlboss", "Pinterest Made Real", "Influencer Energy"
- 75-89: "Main Character", "Understood The Assignment", "Suspiciously Competent"
- 60-74: "Chaotic Good", "It's Giving Effort", "We See You Trying"
- 40-59: "Beautiful Disaster", "Chaos Coordinator", "Art Is Subjective Bestie"

STICKERS (all caps, snarky):
- 90+: "GRAZE QUEEN", "SLAY", "NO NOTES", "OBSESSED"
- 75-89: "ATE THAT UP", "MAIN CHARACTER", "UNDERSTOOD THE ASSIGNMENT"
- 60-74: "TRUST THE PROCESS", "IT'S THE EFFORT", "VALID"
- 40-59: "CHAOS IS ART", "POINTS FOR TRYING", "STILL ATE THO"

COMPLIMENT EXAMPLES (be THIS snarky but kind):
- "The way you scattered those grapes? Very 'I have my life together' energy."
- "This is giving 'I saw a Pinterest board once' and honestly? Iconic."
- "The chaos here is actually serving. Your therapist would be proud."
- "Not you understanding the S-curve better than most people understand their emotions."

IMPROVEMENT (optional, keep it funny):
- "Maybe fan the crackers next time but also, rules are a construct."
- "A little more symmetry could help but honestly who has time for that."

OUTPUT FORMAT (JSON only, no markdown):
{"score": 78, "rank": "Main Character", "compliment": "The grape placement is giving 'I read one article about plating.' We're obsessed.", "sticker": "UNDERSTOOD THE ASSIGNMENT", "improvement": "The crackers could use a fan but honestly you're thriving and we won't critique that."}`;

    // Use circuit breaker with retry and timeout
    const vibeResult = await gptCircuit.execute(
      async () => {
        return await withTimeout(
          withRetry(
            async () => {
              const openai = getOpenAIClient();
              const response = await openai.chat.completions.create({
                model: AI_MODELS.vibe,
                messages: [
                  {
                    role: 'system',
                    content: systemPrompt,
                  },
                  {
                    role: 'user',
                    content: [
                      {
                        type: 'text',
                        text: 'Analyze this plate and give me a vibe score:',
                      },
                      {
                        type: 'image_url',
                        image_url: {
                          url: photo.startsWith('data:') ? photo : `data:image/jpeg;base64,${photo}`,
                        },
                      },
                    ],
                  },
                ],
                max_tokens: 300,
                response_format: { type: 'json_object' },
              });

              const content = response.choices[0]?.message?.content;
              if (!content) {
                throw new Error('No response from GPT-4o');
              }

              return JSON.parse(content) as VibeCheckResponse;
            },
            { maxRetries: 2 }
          ),
          TIMEOUTS.GPT_VIBE_CHECK,
          'GPT-4o vibe check timed out'
        );
      },
      () => {
        logger.warn('GPT circuit open, using fallback');
        return FALLBACK_VIBE;
      }
    );

    // Ensure minimum score
    if (vibeResult.score < MIN_VIBE_SCORE) {
      vibeResult.score = MIN_VIBE_SCORE;
    }

    logger.info('Vibe check completed', {
      action: 'vibe_check',
      duration: Date.now() - startTime,
      score: vibeResult.score,
    });

    return NextResponse.json(vibeResult);
  } catch (error) {
    logger.error('Error analyzing vibe', {
      action: 'vibe_check',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(FALLBACK_VIBE);
  }
}
