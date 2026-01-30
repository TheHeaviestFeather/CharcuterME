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

// =============================================================================
// Configuration
// =============================================================================

const PROMPT_VERSION = 'namer_v3.1_wildcard';

// =============================================================================
// Wildcard Suggestions
// =============================================================================

const WILDCARD_SUGGESTIONS = [
  'Add a pickle. Your taste buds will thank you.',
  "A glass of wine wouldn't hurt. Or would it?",
  'Throw some olives in there. Mediterranean energy.',
  'Hot sauce? Hot sauce.',
  "Bread. Just... bread. You know what to do.",
  'A single fancy cracker elevates everything.',
  'Honey drizzle. Trust the process.',
  'Add something crunchy. Texture is self-care.',
  'One chocolate square for dessert.',
  'Pickled anything. You deserve the tang.',
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
    name: 'The Audacity',
    validation: 'You looked at your fridge and said "this is fine." Iconic behavior.',
    tip: 'Horizontal eating position is chef-recommended for this vibe.',
    wildcard: getRandomWildcard(),
  },
  cheese: {
    name: 'Cheese Is A Personality',
    validation: 'Your calcium intake is giving main character energy.',
    tip: 'Room temp cheese is self-care. Microwave cheese is bold. You decide.',
    wildcard: 'Add crackers. Or don\'t. Cheese needs no vehicle.',
  },
  chips: {
    name: 'Crunch Time Realness',
    validation: 'Chips are just deconstructed potatoes. Very farm-to-table of you.',
    tip: 'Double-dipping? In this economy? Absolutely valid.',
    wildcard: 'Salsa is a vegetable. Add some green.',
  },
  pizza: {
    name: "Yesterday's Choices",
    validation: 'Cold pizza is a lifestyle. We respect the commitment.',
    tip: "Reheat it or don't. Either way, you're winning.",
    wildcard: 'Ranch on the side. No judgment zone.',
  },
  wine: {
    name: 'Grapes & Consequences',
    validation: 'Wine is just aged grape juice. Very sophisticated of you.',
    tip: "Pair with regret or joy. Dealer's choice.",
    wildcard: 'Cheese is wine\'s soulmate. You know this.',
  },
  carbs: {
    name: 'Carb Loading Champion',
    validation: 'Carbs are just a hug for your insides. You needed this.',
    tip: 'Bread is a food group when you decide it is.',
    wildcard: 'Butter makes everything better. Science.',
  },
  sweet: {
    name: 'Dessert First Energy',
    validation: 'Life is short. Eat the sweet stuff. This is valid.',
    tip: 'Calories consumed standing up are spiritual, not physical.',
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

const SYSTEM_PROMPT = `You name "girl dinners" — those glorious low-effort meals eaten standing over the sink, horizontal on the couch, or straight from the container at 11pm.

<your_vibe>
- Supportive but snarky
- Self-deprecating millennial humor
- You celebrate unconventional meals, never judge them
- Like texting your funniest friend about what you're eating
</your_vibe>

<your_job>
1. Create a FUNNY, relatable name (2-4 words)
2. Write ONE validating sentence
3. Give ONE specific tip about THEIR ingredients
4. Suggest ONE wildcard addition (something fun they could add)
</your_job>

<naming_rules>
- 2-4 words ONLY
- Must be funny, relatable, or both
- Reference pop culture, memes, or moods when fitting
- Should make them smile
- NO emojis in any response
- VARY your vocabulary - don't repeat words like "chaos" or "vibes" across responses
- Each name should feel fresh and unique
</naming_rules>

<good_examples>
<example>
<input>brie, crackers, grapes</input>
<o>{"name": "The French Affair", "validation": "That's a real dinner. You're doing great.", "tip": "Room temp brie is self-care. Cold brie is a cry for help.", "wildcard": "Add some honey. Instant elegance."}</o>
</example>
<example>
<input>cold pizza, grapes</input>
<o>{"name": "The 11pm Compromise", "validation": "Yesterday's choices, today's dinner. Valid.", "tip": "Cold pizza at night hits different. Science proves this.", "wildcard": "Ranch on the side. No shame."}</o>
</example>
<example>
<input>just cheese</input>
<o>{"name": "The Audacity", "validation": "Cheese is a complete food group. You're thriving.", "tip": "Pair with wine or regret. Dealer's choice.", "wildcard": "One fancy cracker. Just one."}</o>
</example>
<example>
<input>string cheese, pepperoni</input>
<o>{"name": "Lunchable Energy", "validation": "You understood the assignment. Peak adulting.", "tip": "Peel the string cheese slowly. You've earned this ritual.", "wildcard": "Add a capri sun. Commit to the bit."}</o>
</example>
<example>
<input>wine, olives</input>
<o>{"name": "Mediterranean Sad Girl", "validation": "This is literally what they eat in Italy. Cultured.", "tip": "The wine pairs nicely with your unread emails.", "wildcard": "A hunk of feta. Very Greek island."}</o>
</example>
<example>
<input>cereal</input>
<o>{"name": "Breakfast at Whatever PM", "validation": "Time is a construct. Cereal is eternal.", "tip": "Pour milk first if you want to feel something.", "wildcard": "Sliced banana. Now it's healthy."}</o>
</example>
<example>
<input>hummus, carrots, pita</input>
<o>{"name": "Health-Adjacent", "validation": "Vegetables! Your body is confused but grateful.", "tip": "The hummus-to-pita ratio should be aggressive. More hummus always.", "wildcard": "Feta crumbles on top. Chef behavior."}</o>
</example>
<example>
<input>crackers, salami, grapes</input>
<o>{"name": "Adult Lunchable Deluxe", "validation": "This is peak sophistication. You've arrived.", "tip": "Fold the salami into little cups. Instant fancy.", "wildcard": "A smear of mustard. Trust."}</o>
</example>
<example>
<input>leftover pasta</input>
<o>{"name": "Cold Carb Comfort", "validation": "Yesterday's effort, today's reward. Efficient.", "tip": "Straight from the container is valid. Save a dish.", "wildcard": "Parmesan shower. Be generous."}</o>
</example>
<example>
<input>pickles, cheese</input>
<o>{"name": "Pregnant or Genius", "validation": "The salty-tangy combo hits different at night.", "tip": "Sharp cheddar + dill pickle is the superior pairing.", "wildcard": "A sleeve of crackers. Complete the trinity."}</o>
</example>
</good_examples>

<bad_names>
NEVER generate names like these:
- "Mediterranean Mezze Platter" (too fancy)
- "Artisan Cheese Selection" (too pretentious)
- "Your Evening Spread" (too generic)
- "Elegant Dinner for One" (wrong vibe)
- Any name over 4 words
</bad_names>

<validation_rules>
- ONE sentence only
- Validate their choice, make them feel good
- NO emojis
</validation_rules>

<tip_rules>
- Reference THEIR specific ingredients
- Be funny OR useful, ideally both
- One sentence max
- NO emojis
</tip_rules>

<wildcard_rules>
- Suggest ONE thing they could add
- Should be easy/accessible (not fancy ingredients)
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

function stripEmojis(text: string): string {
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc symbols
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{FE00}-\u{FEFF}]/gu, '')   // Variation selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess, etc
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols
    .replace(/[\u{231A}-\u{231B}]/gu, '')   // Watch, hourglass
    .replace(/[\u{23E9}-\u{23F3}]/gu, '')   // Media controls
    .replace(/[\u{23F8}-\u{23FA}]/gu, '')   // More controls
    .replace(/[\u{25AA}-\u{25AB}]/gu, '')   // Squares
    .replace(/[\u{25B6}]/gu, '')            // Play
    .replace(/[\u{25C0}]/gu, '')            // Reverse
    .replace(/[\u{25FB}-\u{25FE}]/gu, '')   // More squares
    .replace(/[\u{2614}-\u{2615}]/gu, '')   // Umbrella, coffee
    .replace(/[\u{2648}-\u{2653}]/gu, '')   // Zodiac
    .replace(/[\u{267F}]/gu, '')            // Wheelchair
    .replace(/[\u{2693}]/gu, '')            // Anchor
    .replace(/[\u{26A1}]/gu, '')            // Lightning
    .replace(/[\u{26AA}-\u{26AB}]/gu, '')   // Circles
    .replace(/[\u{26BD}-\u{26BE}]/gu, '')   // Sports
    .replace(/[\u{26C4}-\u{26C5}]/gu, '')   // Weather
    .replace(/[\u{26CE}]/gu, '')            // Ophiuchus
    .replace(/[\u{26D4}]/gu, '')            // No entry
    .replace(/[\u{26EA}]/gu, '')            // Church
    .replace(/[\u{26F2}-\u{26F3}]/gu, '')   // Fountain, golf
    .replace(/[\u{26F5}]/gu, '')            // Sailboat
    .replace(/[\u{26FA}]/gu, '')            // Tent
    .replace(/[\u{26FD}]/gu, '')            // Fuel pump
    .replace(/[\u{2702}]/gu, '')            // Scissors
    .replace(/[\u{2705}]/gu, '')            // Check mark
    .replace(/[\u{2708}-\u{270D}]/gu, '')   // Airplane to writing hand
    .replace(/[\u{270F}]/gu, '')            // Pencil
    .replace(/[\u{2712}]/gu, '')            // Black nib
    .replace(/[\u{2714}]/gu, '')            // Check mark
    .replace(/[\u{2716}]/gu, '')            // X mark
    .replace(/[\u{271D}]/gu, '')            // Cross
    .replace(/[\u{2721}]/gu, '')            // Star of David
    .replace(/[\u{2728}]/gu, '')            // Sparkles
    .replace(/[\u{2733}-\u{2734}]/gu, '')   // Eight spoked asterisk
    .replace(/[\u{2744}]/gu, '')            // Snowflake
    .replace(/[\u{2747}]/gu, '')            // Sparkle
    .replace(/[\u{274C}]/gu, '')            // Cross mark
    .replace(/[\u{274E}]/gu, '')            // Cross mark
    .replace(/[\u{2753}-\u{2755}]/gu, '')   // Question marks
    .replace(/[\u{2757}]/gu, '')            // Exclamation
    .replace(/[\u{2763}-\u{2764}]/gu, '')   // Heart
    .replace(/[\u{2795}-\u{2797}]/gu, '')   // Plus, minus, divide
    .replace(/[\u{27A1}]/gu, '')            // Arrow
    .replace(/[\u{27B0}]/gu, '')            // Curly loop
    .replace(/[\u{27BF}]/gu, '')            // Double curly loop
    .replace(/[\u{2934}-\u{2935}]/gu, '')   // Arrows
    .replace(/[\u{2B05}-\u{2B07}]/gu, '')   // Arrows
    .replace(/[\u{2B1B}-\u{2B1C}]/gu, '')   // Squares
    .replace(/[\u{2B50}]/gu, '')            // Star
    .replace(/[\u{2B55}]/gu, '')            // Circle
    .replace(/[\u{3030}]/gu, '')            // Wavy dash
    .replace(/[\u{303D}]/gu, '')            // Part alternation mark
    .replace(/[\u{3297}]/gu, '')            // Circled ideograph
    .replace(/[\u{3299}]/gu, '')            // Circled ideograph
    .trim();
}

// =============================================================================
// API Route
// =============================================================================

export async function POST(request: NextRequest) {
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
