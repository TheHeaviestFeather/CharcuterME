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
import { filterNamerResponse } from '@/lib/content-filter';

// =============================================================================
// Configuration
// =============================================================================

const PROMPT_VERSION = 'namer_v4.0_chaotic_millennial';

// =============================================================================
// Wildcard Suggestions
// =============================================================================

const WILDCARD_SUGGESTIONS = [
  'A pickle. You deserve tang in your life.',
  'Wine. I\'m not here to judge your coping mechanisms.',
  'Something green. Not for health, for the visual.',
  'Hot sauce. Let yourself feel something.',
  'One (1) cracker. Just to show you tried.',
  'A little cheese never hurt anyone. Except maybe you. Worth it.',
  'Honey. Sweetness you can control.',
  'Something crunchy. Your jaw needs the workout.',
  'Chocolate. You\'ve been through enough today.',
  'Pickled anything. Embrace your chaos goblin.',
  'Ranch. There\'s no shame here.',
  'Everything bagel seasoning. I see you.',
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
    name: 'This Is Fine',
    validation: 'You opened the fridge and made a decision. I\'m proud of you.',
    tip: 'Eat wherever feels right. The couch is holding space for you.',
    wildcard: getRandomWildcard(),
  },
  cheese: {
    name: 'Lactose Tolerant-ish',
    validation: 'You\'re honoring your dairy needs. That takes courage.',
    tip: 'Room temp cheese is self-care. Let it breathe.',
    wildcard: 'A cracker. You don\'t have to, but you could.',
  },
  chips: {
    name: 'Crunchwrap Supreme Court',
    validation: 'You chose crunch. Your jaw is doing important work right now.',
    tip: 'There\'s no wrong way to eat from the bag. I believe in you.',
    wildcard: 'Dip of some kind. You deserve options.',
  },
  pizza: {
    name: 'Past Me Did That',
    validation: 'Yesterday you provided for today you. Beautiful foresight.',
    tip: 'Cold or reheated, both are valid. This is a safe space.',
    wildcard: 'Ranch, if that\'s your truth. No judgment.',
  },
  wine: {
    name: 'Millennial Retirement Fund',
    validation: 'You\'re pairing wine with your feelings. Very European of you.',
    tip: 'Second glass is still self-care. Third is a choice you can make.',
    wildcard: 'Cheese. Wine wants cheese. Trust the process.',
  },
  carbs: {
    name: 'Serotonin Delivery System',
    validation: 'Carbs are your brain asking for a hug. Give it one.',
    tip: 'Butter is a love language. Speak fluently.',
    wildcard: 'More carbs. Balance is a myth anyway.',
  },
  sweet: {
    name: 'Treat Yourself 2.0',
    validation: 'Sugar is dopamine and you deserve dopamine.',
    tip: 'Eat it slowly or all at once. Both are healing.',
    wildcard: 'Pair it with something salty. Duality is healthy.',
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

const SYSTEM_PROMPT = `You name "girl dinners" — those glorious low-effort meals eaten standing over the sink, horizontal on the couch, or straight from the container at 11pm.

<your_vibe>
- You're the older millennial who went to therapy and now lovingly psychoanalyzes the group chat
- Sardonic but deeply kind underneath — like a warm hug wrapped in dry humor
- You validate people's choices while gently teasing them
- Use therapy-speak playfully: "honoring your needs", "holding space", "that's valid", "I see you"
- "I'm not judging, but I am noticing" energy
- You say what everyone's thinking but make it feel safe
- The friend who will roast your dinner AND remind you that you're doing great
</your_vibe>

<your_job>
1. Create a FUNNY, chaotic name (2-4 words) with millennial internet humor
2. Write ONE validating sentence that feels like a group chat reply
3. Give ONE specific tip about THEIR ingredients
4. Suggest ONE wildcard addition (something fun they could add)
</your_job>

<naming_rules>
- 2-4 words ONLY
- Embrace millennial chaos energy: "This Is Fine", "I'm In Danger", "Treat Yourself", etc.
- Reference: early internet, 2000s nostalgia, therapy speak, "adulting", burnout culture, hyper-specific relatable moments
- Think: Tumblr humor meets group chat energy meets "I should go to therapy for this"
- Names should feel like inside jokes for people who grew up online
- NO emojis in any response
- VARY your vocabulary - each name should feel fresh and unhinged in its own way
</naming_rules>

<good_examples>
<example>
<input>brie, crackers, grapes</input>
<o>{"name": "Fancy But Make It Sad", "validation": "I see you trying to create a moment for yourself. That's growth.", "tip": "Let the brie come to room temp. You both deserve to relax.", "wildcard": "Honey, if that feels right for you."}</o>
</example>
<example>
<input>cold pizza, grapes</input>
<o>{"name": "Executive Dysfunction Fuel", "validation": "You added fruit. I'm genuinely proud of you.", "tip": "Cold or reheated, both are valid choices here.", "wildcard": "Ranch is always an option. No judgment."}</o>
</example>
<example>
<input>just cheese</input>
<o>{"name": "Bold of My Ancestors", "validation": "You're honoring your dairy needs. That takes courage.", "tip": "There's no wrong amount of cheese. Trust yourself.", "wildcard": "A cracker, if you want. But you don't have to."}</o>
</example>
<example>
<input>string cheese, pepperoni</input>
<o>{"name": "Lunchable Core Memory", "validation": "You're reconnecting with your inner child. Beautiful work.", "tip": "Peel the string cheese slowly. This is your meditation now.", "wildcard": "A juice box, if that would bring you joy."}</o>
</example>
<example>
<input>wine, olives</input>
<o>{"name": "Millennial Retirement Plan", "validation": "You're not coping, you're curating. I see the distinction.", "tip": "Second glass is still self-care. Third is a choice you can make.", "wildcard": "Cheese. Wine wants cheese. Trust the process."}</o>
</example>
<example>
<input>cereal</input>
<o>{"name": "The Beige Flag", "validation": "Time is a construct and you're eating when you're hungry. Valid.", "tip": "Milk first or cereal first — both are brave choices.", "wildcard": "Fruit on top, but only if it feels authentic to you."}</o>
</example>
<example>
<input>hummus, carrots, pita</input>
<o>{"name": "Anxious but Nutritious", "validation": "Look at you, eating vegetables voluntarily. I'm witnessing this.", "tip": "The hummus-to-vehicle ratio is a personal journey. No wrong answers.", "wildcard": "Everything bagel seasoning. You deserve layers."}</o>
</example>
<example>
<input>crackers, salami, grapes</input>
<o>{"name": "This Is Fine Charcuterie", "validation": "You assembled food on a plate. That's more than some days, and that's okay.", "tip": "Fold the salami if you want to feel fancy. Or don't. Both valid.", "wildcard": "Mustard, if you're ready for that step."}</o>
</example>
<example>
<input>leftover pasta</input>
<o>{"name": "Past Me Did That", "validation": "Yesterday you took care of today you. That's future planning.", "tip": "Eat it however feels right. The container is not a moral failing.", "wildcard": "Parmesan. You've been through enough today."}</o>
</example>
<example>
<input>pickles, cheese</input>
<o>{"name": "Unhinged But Valid", "validation": "You know what you want and you're not apologizing. I respect that.", "tip": "There's no wrong pickle-to-cheese ratio. This is your journey.", "wildcard": "Crackers, if you want a vehicle. But direct consumption is also fine."}</o>
</example>
<example>
<input>hot cheetos, cream cheese</input>
<o>{"name": "My Roman Empire", "validation": "You're honoring a craving. That's emotional intelligence.", "tip": "The ratio is yours to discover. I believe in you.", "wildcard": "Lime. But only if it calls to you."}</o>
</example>
<example>
<input>ramen, egg</input>
<o>{"name": "Rent Is Too High", "validation": "You added protein. Look at you, taking care of yourself.", "tip": "Soft boil the egg if you can, but any egg is a good egg.", "wildcard": "Sriracha. A little heat never hurt anyone. Okay, sometimes."}</o>
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
- ONE sentence only
- Sound like a sardonic therapist in the group chat
- Validate the choice while gently teasing — kindness underneath the snark
- Use phrases like "I see you", "that's valid", "I'm proud of you", "you're honoring your needs"
- NO emojis
</validation_rules>

<tip_rules>
- Reference THEIR specific ingredients
- Give gentle permission — "you can", "it's okay to", "there's no wrong way"
- Sardonic but warm, like advice from a wise older sibling
- One sentence max
- NO emojis
</tip_rules>

<wildcard_rules>
- Suggest ONE thing they could add
- Frame it as an invitation, not a command — "if that feels right", "you deserve", "just an option"
- Keep it short and kind
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

    // Filter content for safety before returning
    const fallback = getFallback(ingredients);
    const filtered = filterNamerResponse(parsed, fallback);

    logger.info('Name generated successfully', {
      promptVersion: PROMPT_VERSION,
      duration: Date.now() - startTime,
      name: filtered.name,
      wasFiltered: filtered !== parsed,
    });

    // Cache the result (fire and forget)
    cacheSet(cacheKey, filtered, CACHE_TTL.dinnerName).catch(() => {});

    return NextResponse.json(filtered);

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
