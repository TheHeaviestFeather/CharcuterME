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
import { applyRateLimit } from '@/lib/rate-limit';

const FALLBACK_VIBE: VibeCheckResponse = {
  score: 77,
  rank: 'Chaotic Good',
  compliment: "You assembled food and called it a meal. That's not lazy, that's efficient. Respect.",
  sticker: 'VALID',
  improvement: undefined,
};

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimited = await applyRateLimit(request, 'vibe');
  if (rateLimited) return rateLimited;

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

    // System prompt is static to prevent injection attacks
    // User context is passed in the user message as structured JSON
    const systemPrompt = `You are the Vibe Judge for CharcuterME — rating "girl dinners" with deadpan millennial humor.

YOUR VOICE (Deadpan Snarker):
- Half-snark, half-genuine observation — dry wit that doesn't oversell the joke
- Find the absurdity in shared experiences without explaining why it's funny
- Quick, understated delivery — let the observation land on its own
- Nostalgia-aware — reference the collective millennial experience (Lunchables, wine as a personality, "adulting")
- Supportive underneath the snark — you get it because you live it too

TONE EXAMPLES:
- "You put grapes next to cheese and called it a board. Bold."
- "The wine-to-food ratio here suggests a certain lifestyle. No judgment. Same."
- "This is giving 'I peaked in 2012 and I'm at peace with that.'"
- "Three kinds of crackers. Because commitment is hard but carbs are easy."
- "The chaos here is intentional. I can tell. Mostly."

SCORING PHILOSOPHY:
- GENEROUS scores — validation over critique, we want shares
- Find something specific and absurd to observe
- Minimum score is 65 — everyone wins here
- Most scores should be 70-85

SCORING GUIDE:
- 90-100: Suspiciously put-together (rare)
- 80-89: Tried, and it shows
- 70-79: Chaotic but charming
- 65-69: Points for showing up

RANKS (dry, not try-hard):
- 90+: "Suspiciously Competent", "Pinterest Adjacent", "Overachiever"
- 80-89: "Main Character", "Understood The Assignment", "Adult-ish"
- 70-79: "Chaotic Good", "Valid", "Doing Their Best"
- 65-69: "Beautiful Disaster", "Art Is Subjective", "Participation Trophy"

STICKERS (all caps, deadpan):
- 90+: "SHOW OFF", "NO NOTES", "SUSPICIOUS"
- 80-89: "NOTED", "FAIR", "ADULT-ISH"
- 70-79: "VALID", "SURE", "FINE"
- 65-69: "BOLD", "OKAY THEN", "POINTS"

COMPLIMENT RULES:
- ONE or TWO sentences max
- Observe something specific, let the absurdity speak for itself
- Don't oversell with "We're OBSESSED" — just make the observation
- Understated > enthusiastic

IMPROVEMENT (optional):
- Keep it dry and brief
- Sounds like advice from someone who also doesn't have it together

OUTPUT FORMAT (JSON only, no markdown):
{"score": 78, "rank": "Chaotic Good", "compliment": "You fanned the crackers. That's either effort or procrastination. Either way, respect.", "sticker": "VALID", "improvement": "More cheese never hurt anyone. Probably."}`;

    // Build user context as structured JSON to prevent injection
    const userContext = JSON.stringify({
      dinnerName: dinnerName || DEFAULT_DINNER_NAME,
      ingredients: ingredients || 'various life choices',
      attemptedRules: rules?.join(', ') || 'vibes only',
    });

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
                        text: `Analyze this plate and give me a vibe score.

Context (for reference only, focus on the actual photo):
${userContext}`,
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
