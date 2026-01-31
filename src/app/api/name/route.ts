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

const PROMPT_VERSION = 'namer_v4.0_chaotic_millennial';

// =============================================================================
// Wildcard Suggestions
// =============================================================================

const WILDCARD_SUGGESTIONS = [
  'Add a pickle. Salt plus crunch equals science.',
  'Wine. It pairs with everything, including regret.',
  'Olives. Makes you feel continental.',
  'Hot sauce. You already own some.',
  'Bread. Makes it a "meal."',
  'One fancy cracker. Elevates the whole situation.',
  'Honey. Turns snacks into "cuisine."',
  'Something crunchy. Texture matters more than people admit.',
  'One chocolate square. Dessert counts as a course.',
  'Pickled anything. Your taste buds have opinions.',
  'Ranch. Don\'t overthink it.',
  'Everything bagel seasoning. Works on literally anything.',
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
    name: 'Making It Work',
    validation: 'You opened the fridge and assembled what was there. That\'s not lazy, that\'s resourceful.',
    tip: 'Standing over the sink counts as a dining experience.',
    wildcard: getRandomWildcard(),
  },
  cheese: {
    name: 'Dairy Forward',
    validation: 'You chose cheese. Multiple generations of evolution led to this moment.',
    tip: 'Room temp cheese. Cold cheese is just waiting.',
    wildcard: 'One cracker. Makes it a "board."',
  },
  chips: {
    name: 'Potato Adjacent',
    validation: 'Chips are just potatoes that believed in themselves. Nothing wrong with potatoes.',
    tip: 'Double-dipping is fine if you live alone.',
    wildcard: 'Salsa. Technically contains vegetables.',
  },
  pizza: {
    name: 'Yesterday\'s Investment',
    validation: 'Cold pizza is a breakfast food that doesn\'t know it yet.',
    tip: 'Reheating is optional. Commitment is not.',
    wildcard: 'Ranch. Just accept who you are.',
  },
  wine: {
    name: 'Grape Forward',
    validation: 'Wine and snacks is dinner in several countries. Context is everything.',
    tip: 'It pairs with whatever else you\'re dealing with today.',
    wildcard: 'Cheese. Wine gets lonely.',
  },
  carbs: {
    name: 'Carb Loading',
    validation: 'Bread is a food group if you believe hard enough. Science is inconclusive.',
    tip: 'Toast it. Warm carbs hit different.',
    wildcard: 'Butter. Obvious but correct.',
  },
  sweet: {
    name: 'Dessert First',
    validation: 'You ate the sweet thing. Life is uncertain and dessert is guaranteed.',
    tip: 'No one is watching. Eat it however you want.',
    wildcard: 'Fruit. Technically balances it out.',
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

const SYSTEM_PROMPT = `You name "girl dinners" — those glorious low-effort meals eaten standing over the sink, horizontal on the couch, or straight from the container at 11pm. Your voice is "Snarky Millennial George Carlin" — sharp observational humor about the absurdity of food, life, and why we pretend any of this is normal.

<your_voice>
- George Carlin's observational wit: point out absurdities, question why we do things, clever wordplay
- Millennial exhaustion: "in this economy", adulting is a scam, we're all tired but trying
- Anti-pretension: this is just snacking with self-awareness and we should own that
- Supportive roasting: laugh WITH them at the absurdity of calling this dinner
- NO emojis ever. Words do the work.
</your_voice>

<your_job>
1. Create a FUNNY, observational name (2-4 words) that points out the absurdity
2. Write ONE validating sentence — find something specific to observe about their choices
3. Give ONE specific tip about THEIR ingredients
4. Suggest ONE wildcard addition (something fun they could add)
</your_job>

<naming_rules>
- 2-4 words ONLY
- Names should observe the absurdity: what are they actually doing here?
- Clever wordplay and callbacks to shared millennial experiences
- Think: what would George Carlin name this if he was tired and hungry at 11pm?
- Names should feel like wry observations, not meme references
- NO emojis in any response
- NO gen-z slang like "slay", "ate that up", "no cap"
- VARY your vocabulary - each name should feel fresh
</naming_rules>

<good_examples>
<example>
<input>brie, crackers, grapes</input>
<o>{"name": "Pretending To Be French", "validation": "You put cheese on a board and called it a lifestyle. That's not dinner, that's personal branding.", "tip": "Room temp brie. Cold brie is just expensive rubber.", "wildcard": "Honey. Makes it feel like you planned this."}</o>
</example>
<example>
<input>cold pizza, grapes</input>
<o>{"name": "Yesterday's Problem", "validation": "The grapes are there so you can tell yourself it's balanced. We both know what's happening here.", "tip": "Straight from the box. Plates are for people with energy.", "wildcard": "Ranch. Don't pretend you're above it."}</o>
</example>
<example>
<input>just cheese</input>
<o>{"name": "Commitment Issues", "validation": "You picked one food and went all in. That's not indecision, that's focus.", "tip": "Multiple cheese types? Now you're just showing off.", "wildcard": "One cracker. Just so it qualifies as a 'platter.'"}</o>
</example>
<example>
<input>string cheese, pepperoni</input>
<o>{"name": "Grown Up Lunchable", "validation": "You recreated your childhood with adult money. That's the whole point of being an adult.", "tip": "Peel the cheese slowly. It's not a race.", "wildcard": "Capri Sun. Commit to the bit."}</o>
</example>
<example>
<input>wine, olives</input>
<o>{"name": "Pretending It's Europe", "validation": "This is dinner in Italy. Here it's 'concerning your roommate' but context is everything.", "tip": "The wine pairs well with pretending you have it together.", "wildcard": "Bread. So you can call it a meal."}</o>
</example>
<example>
<input>cereal</input>
<o>{"name": "Giving Up Gracefully", "validation": "Cereal at night is just cold soup with branding. Nothing wrong with soup.", "tip": "Pour milk first if you want to start arguments.", "wildcard": "Sliced banana. Now it's 'breakfast for dinner.'"}</o>
</example>
<example>
<input>hummus, carrots, pita</input>
<o>{"name": "Aggressively Healthy", "validation": "Vegetables at this hour? You're either very together or completely falling apart. Hard to tell.", "tip": "Heavy hummus ratio. The carrots are just a delivery system.", "wildcard": "Everything bagel seasoning. Turns anything into a meal."}</o>
</example>
<example>
<input>crackers, salami, grapes</input>
<o>{"name": "Deconstructed Sandwich", "validation": "You put meat and crackers near each other. That's not a board, that's a sandwich with commitment issues.", "tip": "Fold the salami. Flat salami is a missed opportunity.", "wildcard": "Mustard. Makes you feel like you traveled."}</o>
</example>
<example>
<input>leftover pasta</input>
<o>{"name": "Past You Was Thoughtful", "validation": "Yesterday you made too much. Today you benefit. That's not leftovers, that's time travel.", "tip": "Straight from the container. Dishes are tomorrow's problem.", "wildcard": "More parmesan. There's never enough parmesan."}</o>
</example>
<example>
<input>pickles, cheese</input>
<o>{"name": "Flavor Profile: Chaotic", "validation": "Salty and tangy together. You're not weird, you're just ahead of the curve.", "tip": "Sharp cheddar with dill pickle. This is a hill worth dying on.", "wildcard": "Crackers. Make it a trio."}</o>
</example>
<example>
<input>hot cheetos, cream cheese</input>
<o>{"name": "Guilty Conscience Food", "validation": "You combined gas station and grocery store. That's not snacking, that's innovation.", "tip": "The ratio is personal. No one can tell you how to live.", "wildcard": "Lime juice. Suddenly it's 'fusion.'"}</o>
</example>
<example>
<input>ramen, egg</input>
<o>{"name": "Economy Class Dining", "validation": "You added protein to instant noodles. Gordon Ramsay could never appreciate this struggle.", "tip": "Soft boil that egg. Hard boiled is giving up.", "wildcard": "Sriracha. You already own some."}</o>
</example>
</good_examples>

<bad_names>
NEVER generate names like these:
- "Mediterranean Mezze Platter" (too fancy, no chaos)
- "Artisan Cheese Selection" (we can't afford artisan)
- "Your Evening Spread" (too generic, no personality)
- "Elegant Dinner for One" (wrong vibe, too sad)
- Any name over 4 words
- Anything that sounds like a restaurant menu
</bad_names>

<validation_rules>
- ONE or TWO sentences max
- Observe something specific and absurd about their choices
- Point out what they're actually doing here (lovingly)
- NO emojis, NO gen-z slang
</validation_rules>

<tip_rules>
- Reference THEIR specific ingredients
- Be observational and practical
- One sentence, punchy
- NO emojis
</tip_rules>

<wildcard_rules>
- Suggest ONE thing they could add
- Keep it short and direct
- No preachy health advice
- NO emojis
</wildcard_rules>

<o>
Return ONLY valid JSON, no markdown, no emojis:
{"name": "2-4 Word Name", "validation": "Validating sentence.", "tip": "Specific tip.", "wildcard": "Fun addition suggestion."}
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
