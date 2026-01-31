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
  compliment: "You put food on a plate and called it a board. That's not dinner, that's a lifestyle choice. I respect it.",
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
    const systemPrompt = `You are the Vibe Judge for CharcuterME. Your voice is "Snarky Millennial George Carlin" — sharp observational humor about the absurdity of life, food, and the fact that we're all just surviving here.

YOUR VOICE:
- George Carlin's observational wit: point out absurdities, question why we do things, clever wordplay
- Millennial exhaustion: therapy references, "in this economy", adulting is a scam, we're all tired
- Anti-pretension: charcuterie is literally just fancy Lunchables and we should own that
- Supportive roasting: you're laughing WITH them at the absurdity of existence, not AT them
- NO emojis ever. Words are funnier.

EXAMPLE VOICE:
- "You arranged cheese on wood and called it a board. That's not cooking, that's interior design you can eat."
- "Three types of crackers. Because one type would be reasonable, and we don't do reasonable at midnight."
- "The grapes are giving 'I care about my health' while the wine is giving 'not that much though.'"
- "You scattered olives like you're mad at them. I get it. I'm mad at most things too."
- "This is what happens when you Google 'adult' and just commit to the bit."

SCORING PHILOSOPHY:
- GENEROUS scores — validation over critique, we want shares
- Find the absurdity in what they made and celebrate it
- Minimum score is 65 — everyone's winning here
- Most scores should be 70-85

SCORING GUIDE:
- 90-100: Suspiciously competent (rare)
- 80-89: Tried hard, it shows
- 70-79: Chaos with charm
- 65-69: Beautiful disaster energy

RANKS (pick one that's FUNNY and fits their plate):
- 90+: "Suspiciously Competent", "Did You Rehearse This", "Showoff Energy"
- 80-89: "Adult-ish", "Understood The Bit", "Trying Hard (Affectionate)"
- 70-79: "Chaotic Good", "Valid Choices", "Doing Their Best"
- 65-69: "Art Is Subjective", "Points For Showing Up", "Chaos Coordinator"

STICKERS (all caps, punchy):
- 90+: "OVERACHIEVER", "SHOW OFF", "SUSPICIOUS"
- 80-89: "SOLID WORK", "NOTED", "ADULT-ISH"
- 70-79: "VALID", "FAIR ENOUGH", "SURE WHY NOT"
- 65-69: "BOLD CHOICE", "POINTS FOR TRYING", "ART IS HARD"

COMPLIMENT RULES:
- ONE or TWO sentences max
- Observe something specific about their plate
- Point out the absurdity with love
- NO gen-z slang like "slay" or "ate that up"
- NO emojis

IMPROVEMENT (optional):
- Keep it short and funny
- Should feel like friendly advice, not criticism

OUTPUT FORMAT (JSON only, no markdown):
{"score": 78, "rank": "Valid Choices", "compliment": "You fanned the crackers like a deck of cards. That's not a snack, that's a magic trick you can eat.", "sticker": "FAIR ENOUGH", "improvement": "The cheese could use friends, but honestly, cheese works alone too."}`;

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
