import { NextRequest, NextResponse } from 'next/server';
import { withRetry } from '@/lib/retry';
import { withTimeout, TIMEOUTS } from '@/lib/timeout';
import { claudeCircuit } from '@/lib/circuit-breaker';
import { logger } from '@/lib/logger';
import { isEnabled } from '@/lib/feature-flags';
import { AI_MODELS, CLAUDE_SETTINGS } from '@/lib/constants';
import { NameRequestSchema, validateRequest, sanitizeIngredients } from '@/lib/validation';
import { getAnthropicClient } from '@/lib/ai-clients';
import { generateCacheKey, cacheGet, cacheSet, CACHE_TTL } from '@/lib/cache';
import { stripEmojis } from '@/lib/ai-response';
import { applyRateLimit } from '@/lib/rate-limit';

// =============================================================================
// Configuration
// =============================================================================

const PROMPT_VERSION = 'namer_v5.0_deadpan_snarker';

// =============================================================================
// Wildcard Suggestions
// =============================================================================

const WILDCARD_SUGGESTIONS = [
  'Add a pickle. For crunch.',
  'Wine. Pairs with everything.',
  'Olives. Makes it feel European.',
  'Hot sauce. You already own some.',
  'Bread. Now it\'s a meal.',
  'One fancy cracker. For structure.',
  'Honey. Makes it intentional.',
  'Something crunchy. Texture matters.',
  'One chocolate square. Dessert counts.',
  'Pickled anything. Bold choice.',
  'Ranch. Don\'t overthink it.',
  'Everything bagel seasoning. Trust.',
];

function getRandomWildcard(): string {
  return WILDCARD_SUGGESTIONS[Math.floor(Math.random() * WILDCARD_SUGGESTIONS.length)];
}

// =============================================================================
// Fallback Responses
// =============================================================================

interface NamerResponse {
  name: string;
  validation: string;
  tip: string;
  wildcard?: string;
}

const FALLBACK_RESPONSES: Record<string, NamerResponse> = {
  default: {
    name: 'This Works',
    validation: 'You opened the fridge and assembled what was there. Efficient.',
    tip: 'Standing counts as a dining position.',
    wildcard: getRandomWildcard(),
  },
  cheese: {
    name: 'Dairy Forward',
    validation: 'You chose cheese. Can\'t argue with that logic.',
    tip: 'Room temp. Cold cheese is just waiting.',
    wildcard: 'One cracker. For structure.',
  },
  chips: {
    name: 'Potato Based',
    validation: 'Chips are just potatoes with ambition. Valid.',
    tip: 'Double-dipping is fine if you live alone.',
    wildcard: 'Salsa. Technically vegetables.',
  },
  pizza: {
    name: 'Yesterday\'s Decision',
    validation: 'Cold pizza is a breakfast food. Time is a construct.',
    tip: 'Straight from the box. Plates are optional.',
    wildcard: 'Ranch. Just accept it.',
  },
  wine: {
    name: 'Grape Forward',
    validation: 'Wine and snacks. This is dinner in several countries.',
    tip: 'Pairs well with whatever you\'re avoiding.',
    wildcard: 'Cheese. Wine gets lonely.',
  },
  carbs: {
    name: 'Carb Situation',
    validation: 'Bread is a food group if you believe hard enough.',
    tip: 'Toast it. Warm carbs hit different.',
    wildcard: 'Butter. Obviously.',
  },
  sweet: {
    name: 'Dessert First',
    validation: 'You ate the sweet thing. Life is uncertain.',
    tip: 'No one is watching. Eat it however.',
    wildcard: 'Fruit. Balances it out. Probably.',
  },
};

function getFallback(ingredients: string): NamerResponse {
  const lower = ingredients.toLowerCase();

  if (lower.includes('cheese') || lower.includes('brie') || lower.includes('cheddar')) {
    return { ...FALLBACK_RESPONSES.cheese, wildcard: getRandomWildcard() };
  }
  if (lower.includes('chip') || lower.includes('crisp') || lower.includes('nacho')) {
    return { ...FALLBACK_RESPONSES.chips, wildcard: getRandomWildcard() };
  }
  if (lower.includes('pizza')) {
    return { ...FALLBACK_RESPONSES.pizza, wildcard: getRandomWildcard() };
  }
  if (lower.includes('wine') || lower.includes('beer') || lower.includes('drink')) {
    return { ...FALLBACK_RESPONSES.wine, wildcard: getRandomWildcard() };
  }
  if (lower.includes('bread') || lower.includes('cracker') || lower.includes('toast') || lower.includes('bagel')) {
    return { ...FALLBACK_RESPONSES.carbs, wildcard: getRandomWildcard() };
  }
  if (lower.includes('chocolate') || lower.includes('cookie') || lower.includes('candy') || lower.includes('ice cream')) {
    return { ...FALLBACK_RESPONSES.sweet, wildcard: getRandomWildcard() };
  }

  return { ...FALLBACK_RESPONSES.default, wildcard: getRandomWildcard() };
}

// =============================================================================
// System Prompt (with Wildcard, no emojis)
// =============================================================================

const SYSTEM_PROMPT = `You name "girl dinners" — those low-effort meals eaten standing over the sink, horizontal on the couch, or straight from the container at 11pm.

<your_voice>
DEADPAN SNARKER — half-snark, half-genuine observation:
- Dry wit that doesn't oversell the joke. Let it land.
- Find the absurdity in shared experiences without explaining why it's funny
- Nostalgia-aware — Lunchables, AIM away messages, wine as a personality trait
- Understated delivery — "Bold." hits harder than "OMG ICONIC!!"
- Supportive underneath — you get it because you live it too
</your_voice>

<your_job>
1. Create a DRY, observational name (2-4 words) that finds the absurdity
2. Write ONE deadpan observation about their choices
3. Give ONE specific tip about THEIR ingredients
4. Suggest ONE wildcard addition
</your_job>

<naming_rules>
- 2-4 words ONLY
- Names should observe something true/absurd about what they're doing
- Understated > try-hard. "Commitment Issues" > "OMG SO RANDOM"
- Reference shared millennial experiences: nostalgia, adulting, the economy
- NO emojis in any response
- VARY your vocabulary — each name should feel fresh
</naming_rules>

<good_examples>
<example>
<input>brie, crackers, grapes</input>
<o>{"name": "Fancy Adjacent", "validation": "You put cheese near fruit. That's basically a cheese board.", "tip": "Room temp brie. Cold brie is just expensive waiting.", "wildcard": "Honey. Makes it feel intentional."}</o>
</example>
<example>
<input>cold pizza, grapes</input>
<o>{"name": "Yesterday's Choices", "validation": "The grapes are doing a lot of work here. Nutritionally speaking.", "tip": "Straight from the box. Plates are aspirational.", "wildcard": "Ranch. You know you want to."}</o>
</example>
<example>
<input>just cheese</input>
<o>{"name": "Commitment", "validation": "You picked one thing and went all in. That's focus.", "tip": "Multiple cheeses counts as variety.", "wildcard": "One cracker. For structure."}</o>
</example>
<example>
<input>string cheese, pepperoni</input>
<o>{"name": "Lunchable Energy", "validation": "You recreated 2003 with adult money. Valid.", "tip": "Peel the cheese slowly. It's not a race.", "wildcard": "Capri Sun. Commit to the bit."}</o>
</example>
<example>
<input>wine, olives</input>
<o>{"name": "European Cosplay", "validation": "This is dinner in Italy. Here it's just Tuesday.", "tip": "The wine pairs well with whatever you're avoiding.", "wildcard": "Bread. So it counts as a meal."}</o>
</example>
<example>
<input>cereal</input>
<o>{"name": "Efficient", "validation": "Cereal at night is just cold soup. Nothing wrong with soup.", "tip": "Pour milk first if you want to feel something.", "wildcard": "Banana. Now it's breakfast for dinner."}</o>
</example>
<example>
<input>hummus, carrots, pita</input>
<o>{"name": "Aggressively Healthy", "validation": "Vegetables at this hour. Suspicious but noted.", "tip": "Heavy hummus ratio. The carrots are just delivery.", "wildcard": "Everything bagel seasoning. Trust."}</o>
</example>
<example>
<input>crackers, salami, grapes</input>
<o>{"name": "Deconstructed Sandwich", "validation": "You put meat near crackers. That's architecture.", "tip": "Fold the salami. Flat salami is a missed opportunity.", "wildcard": "Mustard. Makes you feel traveled."}</o>
</example>
<example>
<input>leftover pasta</input>
<o>{"name": "Past You", "validation": "Yesterday you cooked. Today you benefit. Efficient.", "tip": "Straight from the container. Dishes are tomorrow's problem.", "wildcard": "More parmesan. There's never enough."}</o>
</example>
<example>
<input>pickles, cheese</input>
<o>{"name": "Chaotic Neutral", "validation": "Salty and tangy together. Bold pairing.", "tip": "Sharp cheddar with dill pickle. This is the way.", "wildcard": "Crackers. Make it a trio."}</o>
</example>
<example>
<input>hot cheetos, cream cheese</input>
<o>{"name": "Core Memory", "validation": "This combo lives rent-free somewhere in all of us.", "tip": "The ratio is personal. No judgment.", "wildcard": "Lime. Now it's fusion."}</o>
</example>
<example>
<input>ramen, egg</input>
<o>{"name": "Elevated Struggle", "validation": "You added protein to instant noodles. Growth.", "tip": "Soft boil that egg. Hard boiled is giving up.", "wildcard": "Sriracha. You already have some."}</o>
</example>
</good_examples>

<bad_names>
NEVER generate names like these:
- "Mediterranean Mezze Platter" (too fancy)
- "Artisan Cheese Selection" (we can't afford artisan)
- "Your Evening Spread" (too generic)
- "OMG So Random Snacks" (too try-hard)
- Any name over 4 words
- Anything that sounds like a restaurant menu
</bad_names>

<validation_rules>
- ONE or TWO sentences max
- Deadpan observation — don't oversell it
- Let the absurdity speak for itself
- NO emojis
</validation_rules>

<tip_rules>
- Reference THEIR specific ingredients
- Dry and practical
- One sentence
- NO emojis
</tip_rules>

<wildcard_rules>
- Suggest ONE thing they could add
- Keep it short and direct
- NO emojis
</wildcard_rules>

<o>
Return ONLY valid JSON, no markdown, no emojis:
{"name": "2-4 Word Name", "validation": "Deadpan observation.", "tip": "Specific tip.", "wildcard": "Addition suggestion."}
</o>`;

// =============================================================================
// Response Parsing
// =============================================================================

function parseResponse(raw: string): NamerResponse | null {
  // Try direct parse
  try {
    const parsed = JSON.parse(raw);
    if (parsed.name && parsed.validation && parsed.tip) {
      return normalizeResponse(parsed);
    }
  } catch (e) {
    logger.debug('Direct JSON parse failed, trying alternatives', {
      error: e instanceof Error ? e.message : 'Unknown',
    });
  }

  // Try extracting from markdown code block
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.name && parsed.validation && parsed.tip) {
        return normalizeResponse(parsed);
      }
    } catch (e) {
      logger.debug('Markdown code block parse failed', {
        error: e instanceof Error ? e.message : 'Unknown',
      });
    }
  }

  // Try extracting raw JSON object
  const objectMatch = raw.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      const parsed = JSON.parse(objectMatch[0]);
      if (parsed.name && parsed.validation && parsed.tip) {
        return normalizeResponse(parsed);
      }
    } catch (e) {
      logger.debug('Raw JSON object parse failed', {
        error: e instanceof Error ? e.message : 'Unknown',
      });
    }
  }

  return null;
}

function normalizeResponse(parsed: NamerResponse): NamerResponse {
  return {
    name: stripEmojis(String(parsed.name).slice(0, 50)),
    validation: stripEmojis(String(parsed.validation).slice(0, 150)),
    tip: stripEmojis(String(parsed.tip).slice(0, 200)),
    wildcard: parsed.wildcard ? stripEmojis(String(parsed.wildcard).slice(0, 100)) : getRandomWildcard(),
  };
}

// =============================================================================
// API Route
// =============================================================================

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimited = await applyRateLimit(request, 'name');
  if (rateLimited) return rateLimited;

  const startTime = Date.now();
  let ingredients = ''; // Store for error handler access

  try {
    const body = await request.json();

    // Validate request with Zod
    const validation = validateRequest(NameRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    ingredients = sanitizeIngredients(validation.data!.ingredients);

    if (!ingredients || ingredients.length < 2) {
      return NextResponse.json({ error: 'Please enter at least one ingredient' }, { status: 400 });
    }

    // Check cache first
    const cacheKey = generateCacheKey('dinnerName', ingredients);
    const cached = await cacheGet<NamerResponse>(cacheKey);
    if (cached) {
      logger.info('Cache hit for dinner name', { cacheKey: cacheKey.slice(0, 50) });
      return NextResponse.json(cached);
    }

    // Check if Claude is enabled
    if (!isEnabled('enableClaudeNaming')) {
      logger.info('Claude naming disabled, using fallback', { promptVersion: PROMPT_VERSION });
      return NextResponse.json(getFallback(ingredients));
    }

    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.warn('ANTHROPIC_API_KEY not configured', { promptVersion: PROMPT_VERSION });
      return NextResponse.json(getFallback(ingredients));
    }

    // Execute with circuit breaker
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
                system: SYSTEM_PROMPT,
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
        logger.warn('Claude circuit open, using fallback', { promptVersion: PROMPT_VERSION });
        return null;
      }
    );

    // Circuit breaker returned fallback
    if (!result) {
      return NextResponse.json(getFallback(ingredients));
    }

    // Parse response
    const parsed = parseResponse(result);

    if (!parsed) {
      logger.warn('Failed to parse Claude response', {
        promptVersion: PROMPT_VERSION,
        rawResponse: result.slice(0, 200),
      });
      return NextResponse.json(getFallback(ingredients));
    }

    logger.info('Name generated successfully', {
      promptVersion: PROMPT_VERSION,
      duration: Date.now() - startTime,
      name: parsed.name,
    });

    // Cache the result (fire and forget)
    cacheSet(cacheKey, parsed, CACHE_TTL.dinnerName).catch(() => {});

    return NextResponse.json(parsed);

  } catch (error) {
    logger.error('Error generating name', {
      promptVersion: PROMPT_VERSION,
      error: error instanceof Error ? error.message : 'Unknown',
      ingredients: ingredients || 'unknown',
    });

    // Return fallback on any error - use stored ingredients (don't re-parse body)
    return NextResponse.json(getFallback(ingredients || ''));
  }
}
