import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { withRetry } from '@/lib/retry';
import { withTimeout, TIMEOUTS } from '@/lib/timeout';
import { claudeCircuit } from '@/lib/circuit-breaker';
import { logger } from '@/lib/logger';
import { isEnabled } from '@/lib/feature-flags';

// =============================================================================
// Configuration
// =============================================================================

const PROMPT_VERSION = 'namer_v3.0';

// Model agnostic - change this to switch models without touching prompt logic
const MODEL = 'claude-3-5-haiku-20241022';

function getAnthropicClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

// =============================================================================
// Input Sanitization
// =============================================================================

function sanitizeIngredients(raw: string): string {
  return raw
    .replace(/[{}"'`<>]/g, '') // Remove JSON/XML breaking characters
    .replace(/\n/g, ', ')       // Newlines to commas
    .replace(/\s+/g, ' ')       // Collapse whitespace
    .trim()
    .slice(0, 500);             // Hard limit
}

// =============================================================================
// Fallback Responses
// =============================================================================

const FALLBACK_RESPONSES: Record<string, { name: string; validation: string; tip: string }> = {
  default: {
    name: 'The Audacity',
    validation: '✓ You looked at your fridge and said "this is fine." Iconic behavior.',
    tip: 'Horizontal eating position is chef-recommended for this vibe.',
  },
  cheese: {
    name: 'Cheese Is A Personality',
    validation: '✓ Your calcium intake is giving main character energy.',
    tip: 'Room temp cheese is self-care. Microwave cheese is chaos. You decide.',
  },
  chips: {
    name: 'Crunch Time Realness',
    validation: '✓ Chips are just deconstructed potatoes. Very farm-to-table of you.',
    tip: 'Double-dipping? In this economy? Absolutely valid.',
  },
  pizza: {
    name: "Yesterday's Choices",
    validation: '✓ Cold pizza is a lifestyle. We respect the commitment.',
    tip: "Reheat it or don't. Either way, you're winning.",
  },
  wine: {
    name: 'Grapes & Consequences',
    validation: '✓ Wine is just aged grape juice. Very sophisticated of you.',
    tip: "Pair with regret or joy. Dealer's choice.",
  },
  carbs: {
    name: 'Carb Loading Champion',
    validation: '✓ Carbs are just a hug for your insides. You needed this.',
    tip: 'Bread is a food group when you decide it is.',
  },
  sweet: {
    name: 'Dessert First Energy',
    validation: '✓ Life is short. Eat the sweet stuff. This is valid.',
    tip: 'Calories consumed standing up are spiritual, not physical.',
  },
};

function getFallback(ingredients: string): { name: string; validation: string; tip: string } {
  const lower = ingredients.toLowerCase();
  
  if (lower.includes('pizza')) return FALLBACK_RESPONSES.pizza;
  if (lower.includes('wine') || lower.includes('beer')) return FALLBACK_RESPONSES.wine;
  if (lower.includes('cheese') || lower.includes('brie') || lower.includes('cheddar')) {
    return FALLBACK_RESPONSES.cheese;
  }
  if (lower.includes('chip') || lower.includes('crisp')) return FALLBACK_RESPONSES.chips;
  if (lower.includes('bread') || lower.includes('pasta') || lower.includes('cracker')) {
    return FALLBACK_RESPONSES.carbs;
  }
  if (lower.includes('cookie') || lower.includes('chocolate') || lower.includes('candy')) {
    return FALLBACK_RESPONSES.sweet;
  }
  
  return FALLBACK_RESPONSES.default;
}

// =============================================================================
// System Prompt
// =============================================================================

const SYSTEM_PROMPT = `You name "girl dinners" — those glorious low-effort meals eaten standing over the sink, horizontal on the couch, or straight from the container at 11pm.

<your_vibe>
- Supportive but snarky
- Self-deprecating millennial humor
- You CELEBRATE chaos, never judge it
- Like texting your funniest friend about what you're eating
</your_vibe>

<your_job>
1. Create a FUNNY, relatable name (2-4 words)
2. Write ONE validating sentence (starts with ✓)
3. Give ONE specific tip about THEIR ingredients
</your_job>

<naming_rules>
- 2-4 words ONLY
- Must be funny, relatable, or both
- Reference pop culture, memes, or moods when fitting
- Should make them smile
</naming_rules>

<good_examples>
<example>
<input>brie, crackers, grapes</input>
<output>{"name": "The French Affair", "validation": "✓ That's a real dinner. You're doing great.", "tip": "Room temp brie is self-care. Cold brie is a cry for help."}</output>
</example>
<example>
<input>cold pizza, grapes</input>
<output>{"name": "The 11pm Compromise", "validation": "✓ Yesterday's choices, today's dinner. Valid.", "tip": "Cold pizza at night hits different. Science proves this."}</output>
</example>
<example>
<input>just cheese</input>
<output>{"name": "The Audacity", "validation": "✓ Cheese is a complete food group. You're thriving.", "tip": "Pair with wine or regret. Dealer's choice."}</output>
</example>
<example>
<input>string cheese, pepperoni</input>
<output>{"name": "Lunchable Energy", "validation": "✓ You understood the assignment. Peak adulting.", "tip": "Peel the string cheese slowly. You've earned this ritual."}</output>
</example>
<example>
<input>wine, olives</input>
<output>{"name": "Mediterranean Sad Girl", "validation": "✓ This is literally what they eat in Italy. Cultured.", "tip": "The wine pairs nicely with your unread emails."}</output>
</example>
<example>
<input>cereal</input>
<output>{"name": "Breakfast at Whatever PM", "validation": "✓ Time is a construct. Cereal is eternal.", "tip": "Pour milk first if you want to feel something."}</output>
</example>
<example>
<input>leftover chinese, crackers</input>
<output>{"name": "Fusion Confusion", "validation": "✓ Cultural appreciation via your fridge. Respect.", "tip": "Cold lo mein is a lifestyle choice we support."}</output>
</example>
<example>
<input>hummus, carrots, pita</input>
<output>{"name": "Health-Adjacent", "validation": "✓ Vegetables! Your body is confused but grateful.", "tip": "The hummus-to-pita ratio should favor chaos. More hummus."}</output>
</example>
</good_examples>

<bad_names>
NEVER generate names like these:
- "Mediterranean Mezze Platter" ❌ (too fancy)
- "Artisan Cheese Selection" ❌ (too pretentious)
- "Your Evening Spread" ❌ (too generic)
- "Elegant Dinner for One" ❌ (wrong vibe)
- Any name over 4 words ❌
</bad_names>

<validation_rules>
- MUST start with "✓ " (checkmark space)
- ONE sentence only
- Validate their choice, make them feel good
</validation_rules>

<tip_rules>
- Reference THEIR specific ingredients
- Be funny OR useful, ideally both
- One sentence max
</tip_rules>

<output>
Return ONLY valid JSON, no markdown:
{"name": "2-4 Word Name", "validation": "✓ Validating sentence.", "tip": "Specific tip."}
</output>`;

// =============================================================================
// Response Parsing
// =============================================================================

interface NamerResponse {
  name: string;
  validation: string;
  tip: string;
}

function parseResponse(raw: string): NamerResponse | null {
  // Try direct parse
  try {
    const parsed = JSON.parse(raw);
    if (parsed.name && parsed.validation && parsed.tip) {
      return normalizeResponse(parsed);
    }
  } catch {}

  // Try extracting from markdown
  const codeMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeMatch) {
    try {
      const parsed = JSON.parse(codeMatch[1]);
      if (parsed.name) return normalizeResponse(parsed);
    } catch {}
  }

  // Try finding JSON object
  const objectMatch = raw.match(/\{[\s\S]*"name"[\s\S]*\}/);
  if (objectMatch) {
    try {
      return normalizeResponse(JSON.parse(objectMatch[0]));
    } catch {}
  }

  return null;
}

function normalizeResponse(parsed: NamerResponse): NamerResponse {
  let validation = parsed.validation;
  if (!validation.startsWith('✓')) {
    validation = `✓ ${validation}`;
  }

  // Trim name if too long
  const words = parsed.name.split(' ');
  const name = words.length > 5 ? words.slice(0, 4).join(' ') : parsed.name;

  return { name, validation, tip: parsed.tip };
}

// =============================================================================
// API Route
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const rawIngredients = body.ingredients;

    if (!rawIngredients || typeof rawIngredients !== 'string') {
      return NextResponse.json({ error: 'Ingredients are required' }, { status: 400 });
    }

    const ingredients = sanitizeIngredients(rawIngredients);
    
    if (ingredients.length < 2) {
      return NextResponse.json({ error: 'Please enter at least one ingredient' }, { status: 400 });
    }

    if (!isEnabled('enableClaudeNaming')) {
      logger.info('Claude naming disabled', { promptVersion: PROMPT_VERSION });
      return NextResponse.json(getFallback(ingredients));
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      logger.warn('ANTHROPIC_API_KEY not configured', { promptVersion: PROMPT_VERSION });
      return NextResponse.json(getFallback(ingredients));
    }

    const response = await claudeCircuit.execute(
      async () => {
        return await withTimeout(
          withRetry(
            async () => {
              const anthropic = getAnthropicClient();
              return await anthropic.messages.create({
                model: MODEL,
                max_tokens: 200,
                temperature: 0.9,
                system: SYSTEM_PROMPT,
                messages: [{ role: 'user', content: `Name this girl dinner: ${ingredients}` }],
              });
            },
            { maxRetries: 2 }
          ),
          TIMEOUTS.CLAUDE_NAMING,
          'Claude naming timed out'
        );
      },
      () => {
        logger.warn('Claude circuit open', { promptVersion: PROMPT_VERSION });
        return null;
      }
    );

    if (!response) {
      return NextResponse.json(getFallback(ingredients));
    }

    const textContent = response.content.find((b) => b.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    const result = parseResponse(textContent.text);
    
    if (!result) {
      logger.warn('Parse failed', { promptVersion: PROMPT_VERSION });
      return NextResponse.json(getFallback(ingredients));
    }

    logger.info('Name generated', {
      promptVersion: PROMPT_VERSION,
      duration: Date.now() - startTime,
      model: MODEL,
    });

    return NextResponse.json(result);

  } catch (error) {
    logger.error('Error generating name', {
      promptVersion: PROMPT_VERSION,
      error: error instanceof Error ? error.message : 'Unknown',
    });

    try {
      const { ingredients } = await request.json();
      return NextResponse.json(getFallback(ingredients || ''));
    } catch {
      return NextResponse.json(FALLBACK_RESPONSES.default);
    }
  }
}
