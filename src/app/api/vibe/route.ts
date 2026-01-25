import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import type { VibeCheckResponse } from '@/types';
import { withRetry } from '@/lib/retry';
import { withTimeout, TIMEOUTS } from '@/lib/timeout';
import { gptCircuit } from '@/lib/circuit-breaker';
import { logger } from '@/lib/logger';
import { isEnabled } from '@/lib/feature-flags';

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

const FALLBACK_VIBE: VibeCheckResponse = {
  score: 72,
  rank: 'Vibe Achieved',
  compliment: "We couldn't fully analyze, but we trust you did great.",
  sticker: 'WE LOVE TO SEE IT',
  improvement: undefined,
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { photo, dinnerName, ingredients, rules } = await request.json();

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo is required' },
        { status: 400 }
      );
    }

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

    const systemPrompt = `You are the Vibe Judge for CharcuterME, a playful food styling app for "girl dinners."

CONTEXT:
The user named their dinner: "${dinnerName || 'The Spread'}"
Their ingredients: ${ingredients || 'various items'}
The plating rules they were given: ${rules?.join(', ') || 'general arrangement'}

YOUR JOB:
Analyze this photo and give them an encouraging "Vibe Score" with playful feedback.

SCORING PHILOSOPHY:
- Be GENEROUS. This is for fun, not competition.
- Find something genuine to compliment
- The goal is validation, not criticism
- Even a messy plate can score 60+

SCORING CRITERIA (total 100):
1. Flow/Movement (0-25): Do items create visual path?
2. Clustering (0-25): Are small items in odd groups (3, 5)?
3. Color Balance (0-25): Colors distributed, not clumped?
4. Overall Vibe (0-25): Does it look intentional and appetizing?

SCORING GUIDELINES:
- 90-100: Everything looks intentional and beautiful
- 75-89: Clearly put effort in, looks good
- 60-74: Got the spirit, room for improvement
- 40-59: Chaotic but charming
- <40: Just vibes, no rules (that's ok!)

MINIMUM SCORE: 35 (we don't go lower — that's mean)

RANKS BY SCORE:
- 90-100: "Graze Queen" or "Chef's Kiss"
- 75-89: "Casual Elegance" or "Main Character"
- 60-74: "Vibe Achieved" or "Solid Effort"
- 40-59: "Chaotic Good" or "Art is Subjective"
- <40: "Chaos Coordinator" or "Points for Trying"

STICKERS BY SCORE:
- 90+: "CHEF'S KISS", "GRAZE QUEEN", "100% THAT BOARD"
- 75-89: "NAILED IT!", "MAIN CHARACTER", "CASUAL ELEGANCE"
- 60-74: "WE LOVE TO SEE IT", "VIBE ACHIEVED", "EFFORT: APPRECIATED"
- 40-59: "CHAOTIC GOOD", "ART IS SUBJECTIVE", "IT'S GIVING... SOMETHING"
- <40: "I TRIED", "POINTS FOR TRYING", "FRIDGE TO FLOOR"

OUTPUT FORMAT (JSON only, no markdown):
{"score": 78, "rank": "Casual Elegance", "compliment": "The S-curve is giving main character energy. The grape placement? *Chef's kiss.*", "sticker": "NAILED IT!", "improvement": "Next time, fan those crackers just a bit more — but honestly, you crushed it."}`;

    // Use circuit breaker with retry and timeout
    const vibeResult = await gptCircuit.execute(
      async () => {
        return await withTimeout(
          withRetry(
            async () => {
              const openai = getOpenAIClient();
              const response = await openai.chat.completions.create({
                model: 'gpt-4o',
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
    if (vibeResult.score < 35) {
      vibeResult.score = 35;
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
