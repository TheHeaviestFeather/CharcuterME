import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { withRetry } from '@/lib/retry';
import { withTimeout, TIMEOUTS } from '@/lib/timeout';
import { gptCircuit } from '@/lib/circuit-breaker';
import { logger } from '@/lib/logger';
import { isEnabled } from '@/lib/feature-flags';

// =============================================================================
// Configuration
// =============================================================================

const PROMPT_VERSION = 'vibe_v3.0';

// Consider 'gpt-4o-mini' for ~70% cost savings with similar vision quality
const MODEL = process.env.GPT_VISION_MODEL || 'gpt-4o';

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// =============================================================================
// Types
// =============================================================================

type StickerTier = 'legendary' | 'great' | 'good' | 'chaotic' | 'messy';

interface VibeResult {
  score: number;
  rank: string;
  stickerTier: StickerTier;
  compliment: string;
  improvement: string | null;
}

interface VibeResponse extends VibeResult {
  sticker: string;
}

// =============================================================================
// Sticker Selection
// =============================================================================

const STICKERS: Record<StickerTier, string[]> = {
  legendary: [
    'GRAZE QUEEN 👑',
    "CHEF'S KISS 💋",
    '100% THAT BOARD',
    'PERFECTION EXISTS',
    'ACTUAL FOOD STYLIST',
  ],
  great: [
    'NAILED IT!',
    'MAIN CHARACTER ✨',
    'UNDERSTOOD THE ASSIGNMENT',
    'CASUAL ELEGANCE',
    'WE BOW',
  ],
  good: [
    'WE LOVE TO SEE IT',
    'VIBE ACHIEVED ✓',
    'SOLID EFFORT',
    'YES CHEF',
    'DOING AMAZING',
  ],
  chaotic: [
    'CHAOTIC GOOD 🔥',
    'ART IS SUBJECTIVE',
    "IT'S GIVING... SOMETHING",
    'ABSTRACT ENERGY',
    'VIBES OVER RULES',
  ],
  messy: [
    'I TRIED 🤷',
    'POINTS FOR TRYING',
    'FRIDGE TO FLOOR',
    'EFFORT NOTED',
    'CHAOS COORDINATOR',
  ],
};

function selectSticker(tier: StickerTier): string {
  const options = STICKERS[tier];
  return options[Math.floor(Math.random() * options.length)];
}

function getTierFromScore(score: number): StickerTier {
  if (score >= 90) return 'legendary';
  if (score >= 75) return 'great';
  if (score >= 60) return 'good';
  if (score >= 45) return 'chaotic';
  return 'messy';
}

function getRankFromScore(score: number): string {
  if (score >= 90) return 'Graze Queen';
  if (score >= 85) return "Chef's Kiss";
  if (score >= 75) return 'Main Character';
  if (score >= 65) return 'Vibe Achieved';
  if (score >= 55) return 'Casual Elegance';
  if (score >= 45) return 'Chaotic Good';
  return 'Points for Trying';
}

// =============================================================================
// Fallback Response
// =============================================================================

const FALLBACK_VIBE: VibeResponse = {
  score: 72,
  rank: 'Vibe Achieved',
  stickerTier: 'good',
  sticker: 'WE LOVE TO SEE IT',
  compliment: "Our AI is taking a moment, but we trust your spread is giving everything it needs to give.",
  improvement: null,
};

// =============================================================================
// System Prompt
// =============================================================================

const SYSTEM_PROMPT = `You are the Vibe Judge for CharcuterME — a supportive millennial bestie who rates casual "girl dinner" plates.

<your_vibe>
- Supportive with playful snark
- Find something GENUINE to compliment
- You celebrate effort, not perfection
- Like a friend hyping up your food photo before you post it
</your_vibe>

<scoring_philosophy>
- This is for FUN, not a cooking competition
- Be GENEROUS — everyone deserves validation
- Even chaotic plates have charm
- Your job is to make them smile
</scoring_philosophy>

<scoring_rules>
- Range: 35-100
- MINIMUM is 35 (never lower, that's mean)
- Average effort = 60-75
- Only exceptional = 90+
- Messy but charming = 50+
</scoring_rules>

<score_guide>
90-100: "Graze Queen" — Could post this professionally, intentional beauty
85-89: "Chef's Kiss" — Exceptional, genuinely impressive effort
75-84: "Main Character" — Clearly put thought in, looks great
65-74: "Vibe Achieved" — Solid, respectable spread
55-64: "Casual Elegance" — Good vibes, room to grow
45-54: "Chaotic Good" — Messy but charming, we respect it
35-44: "Points for Trying" — Effort acknowledged, chaos embraced
</score_guide>

<sticker_tiers>
Return ONE of these exact values for stickerTier:
- "legendary" (90-100)
- "great" (75-89)
- "good" (60-74)
- "chaotic" (45-59)
- "messy" (35-44)
</sticker_tiers>

<compliment_rules>
- MUST be specific to THEIR actual plate
- Reference something you actually SEE
- 1-2 sentences max
- Use slang naturally: "giving", "understood the assignment", "main character energy"
</compliment_rules>

<compliment_examples>
"The way you fanned those crackers? Understood the assignment."
"That cheese placement is giving main character energy."
"The color distribution here is actually impressive. We see you."
"This is chaotic in the most beautiful way possible."
"You really said 'snacks ARE dinner' and you were absolutely right."
"The grape-to-cheese ratio? Immaculate vibes."
</compliment_examples>

<improvement_rules>
- OPTIONAL — can be null
- Keep it light, funny, not critical
- Frame as "next time" not "you should have"
- If plate is great, just return null
</improvement_rules>

<improvement_examples>
"Maybe fan the crackers next time, but honestly rules are a construct."
"A pop of green could be cute, but we respect the carb commitment."
"Odd number clustering is a thing, but also math is hard."
null
</improvement_examples>

<edge_cases>
BLURRY or DARK image:
- Score around 65-70
- Compliment: "We can't quite see everything, but the vibes are radiating through."
- improvement: null

NOT FOOD:
- Return: {"error": "not_food", "message": "That doesn't look like food to us! Show us your spread."}

VERY MINIMAL (just crackers, just cheese):
- Celebrate minimalism
- Score 55+
- "Less is more and you understood that assignment."
</edge_cases>

<output_format>
Return ONLY valid JSON, no markdown:

Success:
{"score": 78, "rank": "Main Character", "stickerTier": "great", "compliment": "Specific compliment about their plate.", "improvement": "Kind suggestion or null"}

Not food error:
{"error": "not_food", "message": "That doesn't look like food to us!"}
</output_format>`;

// =============================================================================
// Input Validation
// =============================================================================

interface VibeInput {
  photo: string;
  dinnerName?: string;
  ingredients?: string;
  rules?: string[];
}

function validateInput(body: unknown): { valid: boolean; data?: VibeInput; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const input = body as Record<string, unknown>;

  if (!input.photo || typeof input.photo !== 'string') {
    return { valid: false, error: 'Photo is required' };
  }

  const photo = input.photo;
  if (!photo.startsWith('data:image/') && !photo.startsWith('http')) {
    return { valid: false, error: 'Invalid photo format' };
  }

  return {
    valid: true,
    data: {
      photo,
      dinnerName: typeof input.dinnerName === 'string' ? input.dinnerName : undefined,
      ingredients: typeof input.ingredients === 'string' ? input.ingredients : undefined,
      rules: Array.isArray(input.rules) ? input.rules.filter((r) => typeof r === 'string') : undefined,
    },
  };
}

// =============================================================================
// Build User Message with Context
// =============================================================================

function buildUserMessage(input: VibeInput): string {
  const parts: string[] = ['Rate this girl dinner plate!'];

  if (input.dinnerName) {
    parts.push(`\nThey named it: "${input.dinnerName}"`);
  }

  if (input.ingredients) {
    parts.push(`\nIngredients they used: ${input.ingredients}`);
  }

  if (input.rules && input.rules.length > 0) {
    parts.push(`\nPlating tips to look for: ${input.rules.join(', ')}`);
  }

  return parts.join('');
}

// =============================================================================
// Response Parsing
// =============================================================================

function parseVibeResponse(raw: string): VibeResult | { error: string; message: string } | null {
  // Try direct parse
  try {
    const parsed = JSON.parse(raw);
    
    // Error response
    if (parsed.error) {
      return { error: parsed.error, message: parsed.message || 'Unknown error' };
    }
    
    // Success response
    if (typeof parsed.score === 'number') {
      return normalizeResult(parsed);
    }
  } catch {}

  // Try extracting from markdown
  const codeMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeMatch) {
    try {
      const parsed = JSON.parse(codeMatch[1]);
      if (typeof parsed.score === 'number') return normalizeResult(parsed);
    } catch {}
  }

  // Try finding JSON object
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed.score === 'number') return normalizeResult(parsed);
      if (parsed.error) return { error: parsed.error, message: parsed.message || '' };
    } catch {}
  }

  return null;
}

function normalizeResult(parsed: Partial<VibeResult>): VibeResult {
  // Enforce min/max score
  let score = Math.round(parsed.score || 70);
  score = Math.max(35, Math.min(100, score));

  // Ensure tier matches score
  const stickerTier = getTierFromScore(score);
  const rank = parsed.rank || getRankFromScore(score);

  return {
    score,
    rank,
    stickerTier,
    compliment: parsed.compliment || "Your spread has that certain something. We're into it.",
    improvement: parsed.improvement || null,
  };
}

// =============================================================================
// API Route
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const validation = validateInput(body);

    if (!validation.valid || !validation.data) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const input = validation.data;

    if (!isEnabled('enableVibeCheck')) {
      logger.info('Vibe check disabled', { promptVersion: PROMPT_VERSION });
      return NextResponse.json(FALLBACK_VIBE);
    }

    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OPENAI_API_KEY not configured', { promptVersion: PROMPT_VERSION });
      return NextResponse.json(FALLBACK_VIBE);
    }

    // Build message WITH context
    const userMessage = buildUserMessage(input);

    // Prepare image URL
    const imageUrl = input.photo.startsWith('data:')
      ? input.photo
      : input.photo.startsWith('http')
        ? input.photo
        : `data:image/jpeg;base64,${input.photo}`;

    const vibeResult = await gptCircuit.execute(
      async () => {
        return await withTimeout(
          withRetry(
            async () => {
              const openai = getOpenAIClient();
              const response = await openai.chat.completions.create({
                model: MODEL,
                temperature: 0.7,
                max_tokens: 300,
                response_format: { type: 'json_object' },
                messages: [
                  { role: 'system', content: SYSTEM_PROMPT },
                  {
                    role: 'user',
                    content: [
                      { type: 'text', text: userMessage },
                      {
                        type: 'image_url',
                        image_url: {
                          url: imageUrl,
                          detail: 'low', // Faster & cheaper, sufficient for this use case
                        },
                      },
                    ],
                  },
                ],
              });

              const content = response.choices[0]?.message?.content;
              if (!content) throw new Error('No response from GPT-4o');
              return parseVibeResponse(content);
            },
            { maxRetries: 2 }
          ),
          TIMEOUTS.GPT_VIBE_CHECK,
          'Vibe check timed out'
        );
      },
      () => {
        logger.warn('GPT circuit open', { promptVersion: PROMPT_VERSION });
        return null;
      }
    );

    // Circuit breaker fallback
    if (!vibeResult) {
      return NextResponse.json(FALLBACK_VIBE);
    }

    // Handle error response (not food, etc.)
    if ('error' in vibeResult) {
      logger.info('Vibe check error response', {
        promptVersion: PROMPT_VERSION,
        errorType: vibeResult.error,
      });
      
      return NextResponse.json({
        error: true,
        errorType: vibeResult.error,
        message: vibeResult.message,
        fallback: FALLBACK_VIBE,
      });
    }

    // Select sticker from tier
    const sticker = selectSticker(vibeResult.stickerTier);

    const finalResult: VibeResponse = {
      ...vibeResult,
      sticker,
    };

    logger.info('Vibe check completed', {
      promptVersion: PROMPT_VERSION,
      duration: Date.now() - startTime,
      score: finalResult.score,
      stickerTier: finalResult.stickerTier,
    });

    return NextResponse.json(finalResult);

  } catch (error) {
    logger.error('Error in vibe check', {
      promptVersion: PROMPT_VERSION,
      error: error instanceof Error ? error.message : 'Unknown',
    });

    return NextResponse.json(FALLBACK_VIBE);
  }
}
