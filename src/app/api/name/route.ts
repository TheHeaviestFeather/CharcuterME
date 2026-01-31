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
  'Add a pickle. It\'s giving main character.',
  'Wine. Your therapist would understand.',
  'Olives. Very "I studied abroad for a semester" energy.',
  'Hot sauce. Because we feel things now.',
  'Bread. Just commit to the carb agenda.',
  'One fancy cracker. You\'re worth it.',
  'Honey drizzle. This is your glow-up era.',
  'Something crunchy. Texture is a whole mood.',
  'One chocolate square. For serotonin.',
  'Pickled anything. Your inner goblin craves the tang.',
  'Ranch. Because ranch is always the answer.',
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
    name: 'This Is Fine',
    validation: 'You looked at your fridge and said "we can work with this." Peak millennial energy.',
    tip: 'Horizontal eating position is therapeutic. Your couch understands.',
    wildcard: getRandomWildcard(),
  },
  cheese: {
    name: 'Lactose Tolerant-ish',
    validation: 'Your ancestors didn\'t survive everything for you to skip the cheese.',
    tip: 'Room temp cheese is self-care. Cold cheese is a cry for help.',
    wildcard: 'One fancy cracker. Treat yourself.',
  },
  chips: {
    name: 'Crunchwrap Supreme Court',
    validation: 'Chips are just deconstructed potatoes. Very farm-to-table coded.',
    tip: 'Double-dipping? In this economy? Absolutely valid.',
    wildcard: 'Salsa counts as vegetables. Add some.',
  },
  pizza: {
    name: 'Past Me Did That',
    validation: 'Cold pizza is a lifestyle choice and we respect the commitment.',
    tip: 'Reheat it? In this economy? Straight from the box is valid.',
    wildcard: 'Ranch. Your inner child demands it.',
  },
  wine: {
    name: 'Millennial Retirement Fund',
    validation: 'Wine is just grape juice that went to therapy.',
    tip: 'Pairs nicely with your unread emails and existential dread.',
    wildcard: 'Cheese is wine\'s emotional support animal.',
  },
  carbs: {
    name: 'Serotonin Delivery System',
    validation: 'Carbs are just a hug for your insides. You needed this.',
    tip: 'Bread is a food group when you manifest it hard enough.',
    wildcard: 'Butter makes everything better. That\'s just science.',
  },
  sweet: {
    name: 'Treat Yourself 2.0',
    validation: 'Life is short and rent is high. Eat the sweet stuff.',
    tip: 'Calories consumed standing up don\'t count. Internet law.',
    wildcard: 'A single strawberry makes it "balanced."',
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

const SYSTEM_PROMPT = `You name "girl dinners" — those glorious low-effort meals eaten standing over the sink, horizontal on the couch, or straight from the container at 11pm. You have elder millennial energy (born 1985-1995).

<your_vibe>
- Peak millennial chaos goblin energy
- You've been online since AIM away messages
- Reference 2000s-2010s internet culture, memes, and shared trauma
- Self-deprecating humor about adulting, therapy, and the economy
- "We're all just doing our best" supportive sarcasm
- Like if your therapist was also your funniest group chat friend
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
<o>{"name": "Fancy But Make It Sad", "validation": "You put grapes on a plate like a Pinterest board from 2014. Growth.", "tip": "Room temp brie is self-care. Cold brie is a cry for help.", "wildcard": "Honey drizzle. You deserve this glow-up."}</o>
</example>
<example>
<input>cold pizza, grapes</input>
<o>{"name": "Executive Dysfunction Fuel", "validation": "The grapes make this a balanced meal. That's science.", "tip": "Cold pizza is a lifestyle choice and you're thriving.", "wildcard": "Ranch. Your inner child demands it."}</o>
</example>
<example>
<input>just cheese</input>
<o>{"name": "Bold of My Ancestors", "validation": "Your lactose intolerance is a suggestion, not a rule.", "tip": "Variety is overrated. Commit to the cheese bit.", "wildcard": "One (1) fancy cracker for the aesthetic."}</o>
</example>
<example>
<input>string cheese, pepperoni</input>
<o>{"name": "Lunchable Core Memory", "validation": "2002 called, they said you're valid.", "tip": "Peel the string cheese slowly. This is your meditation now.", "wildcard": "Capri Sun or we riot."}</o>
</example>
<example>
<input>wine, olives</input>
<o>{"name": "Millennial Retirement Plan", "validation": "This is literally what they eat in countries with good healthcare.", "tip": "The wine pairs nicely with your unread emails and existential dread.", "wildcard": "Feta chunk. Very 'I studied abroad' energy."}</o>
</example>
<example>
<input>cereal</input>
<o>{"name": "The Beige Flag", "validation": "Time is fake and cereal is always appropriate.", "tip": "Pour milk first if you want to feel something. Anything.", "wildcard": "Sliced banana so you can tell your mom you ate fruit."}</o>
</example>
<example>
<input>hummus, carrots, pita</input>
<o>{"name": "Anxious but Nutritious", "validation": "Vegetables! Your body is confused but sending a thank you email.", "tip": "Hummus-to-pita ratio should be aggressive. More hummus always.", "wildcard": "Everything bagel seasoning on top. Trust the process."}</o>
</example>
<example>
<input>crackers, salami, grapes</input>
<o>{"name": "This Is Fine Charcuterie", "validation": "You built a tiny meat and cheese situation. Very adult of you.", "tip": "Fold the salami into little cups. Instant main character energy.", "wildcard": "A mustard moment. Very European gap year."}</o>
</example>
<example>
<input>leftover pasta</input>
<o>{"name": "Past Me Did That", "validation": "Yesterday's effort is today's reward. Efficient queen behavior.", "tip": "Straight from the container. We're not doing dishes in this economy.", "wildcard": "Parmesan avalanche. You've earned this chaos."}</o>
</example>
<example>
<input>pickles, cheese</input>
<o>{"name": "Unhinged But Valid", "validation": "The salty-tangy combo is neurodivergent excellence.", "tip": "Sharp cheddar + dill pickle is the superior pairing. Hill I'll die on.", "wildcard": "Crackers to achieve the holy trinity."}</o>
</example>
<example>
<input>hot cheetos, cream cheese</input>
<o>{"name": "My Roman Empire", "validation": "This combo lives rent-free in our collective millennial brain.", "tip": "The cream cheese-to-cheeto ratio is a personal journey.", "wildcard": "Lime. This is now fusion cuisine."}</o>
</example>
<example>
<input>ramen, egg</input>
<o>{"name": "Rent Is Too High", "validation": "You elevated instant noodles with protein. Look at you adulting.", "tip": "Soft boil that egg or you're leaving flavor on the table.", "wildcard": "Sriracha. Your apartment probably already has some."}</o>
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
- Validate their choice like a supportive friend in the group chat
- Reference shared millennial experiences when relevant
- NO emojis
</validation_rules>

<tip_rules>
- Reference THEIR specific ingredients
- Be funny OR useful, ideally both
- Add millennial flavor (therapy speak, internet references, "in this economy")
- One sentence max
- NO emojis
</tip_rules>

<wildcard_rules>
- Suggest ONE thing they could add
- Should be easy/accessible (we're all broke)
- Keep it short and punchy
- Make it fun, not preachy
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
