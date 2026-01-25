import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { withRetry } from '@/lib/retry';
import { withTimeout, TIMEOUTS } from '@/lib/timeout';
import { claudeCircuit } from '@/lib/circuit-breaker';
import { logger } from '@/lib/logger';
import { isEnabled } from '@/lib/feature-flags';

function getAnthropicClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

const FALLBACK_RESPONSES: Record<string, { name: string; validation: string; tip: string }> = {
  default: {
    name: 'The Spread',
    validation: "That's a real dinner. You're doing great.",
    tip: 'The couch is the correct location for this meal.',
  },
  hasCheese: {
    name: 'The Cheese Situation',
    validation: 'Cheese is always the answer.',
    tip: 'Room temperature cheese hits different.',
  },
  hasChips: {
    name: 'Snack Attack',
    validation: "Sometimes chips are dinner. That's fine.",
    tip: 'Double-dipping is allowed when you live alone.',
  },
};

function getFallback(ingredients: string) {
  const lowerIngredients = ingredients.toLowerCase();
  if (lowerIngredients.includes('cheese') || lowerIngredients.includes('brie')) {
    return FALLBACK_RESPONSES.hasCheese;
  }
  if (lowerIngredients.includes('chip')) {
    return FALLBACK_RESPONSES.hasChips;
  }
  return FALLBACK_RESPONSES.default;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { ingredients } = await request.json();

    if (!ingredients || typeof ingredients !== 'string') {
      return NextResponse.json(
        { error: 'Ingredients are required' },
        { status: 400 }
      );
    }

    // Check if feature is enabled
    if (!isEnabled('enableClaudeNaming')) {
      logger.info('Claude naming disabled via feature flag');
      return NextResponse.json(getFallback(ingredients));
    }

    // Check if API key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.warn('ANTHROPIC_API_KEY not configured, using fallback');
      return NextResponse.json(getFallback(ingredients));
    }

    const prompt = `You name "girl dinners" — casual, unpretentious meals made from whatever someone has.

Your job:
1. Give this food a funny, relatable, validating name (2-5 words)
2. Write a short validation message (one sentence)
3. Give one casual tip about their ingredients

VIBE:
- Casual, not fancy
- Self-aware, slightly self-deprecating humor
- Validating ("this counts as dinner")
- Like texting your friend what you're eating

NAME EXAMPLES:
- "brie, crackers, grapes" → "The French Affair"
- "string cheese, pepperoni" → "Lunchable Energy"
- "chips, salsa, guac" → "Fiesta Mode"
- "leftover pizza, grapes" → "The 11pm Compromise"
- "just cheese" → "The Audacity"

BAD NAMES (too fancy):
- "Mediterranean Mezze" ❌
- "Artisan Selection" ❌
- "Elegant Evening" ❌

VALIDATION MESSAGE:
Always validates their choice:
- "That's a real dinner. You're doing great."
- "This is self-care. You earned this."
- "The fridge provides. You listened."

TIP:
Must reference THEIR specific ingredients, not generic advice:
- For brie: "Let the brie sit out 10 minutes — it spreads like butter."
- For chips: "Salsa counts as a vegetable. You're thriving."
- For pizza: "Cold pizza is valid. No microwave judgment here."

They have: ${ingredients}

Respond in EXACTLY this JSON format (no markdown, just raw JSON):
{"name": "[2-5 word playful name]", "validation": "[one sentence validation]", "tip": "[specific tip about their ingredients]"}`;

    // Use circuit breaker with retry and timeout
    const response = await claudeCircuit.execute(
      async () => {
        return await withTimeout(
          withRetry(
            async () => {
              const anthropic = getAnthropicClient();
              return await anthropic.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: 200,
                messages: [
                  {
                    role: 'user',
                    content: prompt,
                  },
                ],
              });
            },
            { maxRetries: 2 }
          ),
          TIMEOUTS.CLAUDE_NAMING,
          'Claude naming timed out'
        );
      },
      () => {
        logger.warn('Claude circuit open, using fallback');
        return null;
      }
    );

    // If circuit breaker returned fallback
    if (!response) {
      return NextResponse.json(getFallback(ingredients));
    }

    // Extract text content
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse JSON response
    const result = JSON.parse(textContent.text);

    logger.info('Name generated successfully', {
      action: 'generate_name',
      duration: Date.now() - startTime,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error generating name', {
      action: 'generate_name',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Return fallback on error
    const { ingredients } = await request.json().catch(() => ({ ingredients: '' }));
    return NextResponse.json(getFallback(ingredients || ''));
  }
}
