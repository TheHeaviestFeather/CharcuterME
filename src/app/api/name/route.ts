import { NextRequest, NextResponse } from 'next/server';
import { withRetry } from '@/lib/retry';
import { withTimeout, TIMEOUTS } from '@/lib/timeout';
import { claudeCircuit } from '@/lib/circuit-breaker';
import { logger } from '@/lib/logger';
import { isEnabled } from '@/lib/feature-flags';
import { getAnthropicClient } from '@/lib/ai-clients';
import { AI_MODELS } from '@/lib/constants';

const FALLBACK_RESPONSES: Record<string, { name: string; validation: string; tip: string }> = {
  default: {
    name: 'The Audacity',
    validation: "You looked at your fridge and said 'this is fine.' Iconic behavior.",
    tip: 'Horizontal eating position is chef-recommended for this vibe.',
  },
  hasCheese: {
    name: 'Cheese Is A Personality',
    validation: "Your calcium intake is giving main character energy.",
    tip: 'Room temp cheese is self-care. Microwave cheese is chaos. You decide.',
  },
  hasChips: {
    name: 'Crunch Time Realness',
    validation: "Chips are just deconstructed potatoes. Very farm-to-table of you.",
    tip: 'Double-dipping? In this economy? Absolutely valid.',
  },
  hasPizza: {
    name: 'Yesterday\'s Choices, Today\'s Dinner',
    validation: "Cold pizza is a lifestyle. We respect the commitment.",
    tip: 'Reheat it or don\'t. Either way, you\'re winning.',
  },
  hasWine: {
    name: 'Grapes & Consequences',
    validation: "Wine is just aged grape juice. Very sophisticated of you.",
    tip: 'Pair with regret or joy. Dealer\'s choice.',
  },
};

function getFallback(ingredients: string) {
  const lower = ingredients.toLowerCase();
  if (lower.includes('pizza')) return FALLBACK_RESPONSES.hasPizza;
  if (lower.includes('wine')) return FALLBACK_RESPONSES.hasWine;
  if (lower.includes('cheese') || lower.includes('brie') || lower.includes('cheddar')) {
    return FALLBACK_RESPONSES.hasCheese;
  }
  if (lower.includes('chip')) return FALLBACK_RESPONSES.hasChips;
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

    const prompt = `You are a chaotic millennial bestie who names "girl dinners" — unhinged, low-effort meals eaten standing over the sink or horizontal on the couch.

Your job: Name their dinner with SNARKY MILLENNIAL HUMOR that makes them laugh and feel seen.

VIBE CHECK:
- Extremely online humor (Twitter/TikTok energy)
- Self-deprecating but validating
- Chaotic but supportive
- Like your funniest friend roasting your life choices lovingly
- References therapy, wine, being tired, adulting, etc.

NAME EXAMPLES (2-5 words, make them LAUGH):
- "brie, crackers" → "Cheese Is A Personality"
- "string cheese, pepperoni" → "Lunchable But Make It 30"
- "chips, salsa" → "Carbs & Consequences"
- "leftover pizza" → "Yesterday's Choices"
- "just cheese" → "The Audacity"
- "wine, crackers" → "Grapes & Regrets"
- "hummus, pita" → "Mediterranean Coping Mechanism"
- "pickles" → "Sodium & Sadness"
- "grapes, cheese" → "Vineyard Cosplay"
- "random snacks" → "Chaos Goblin Hours"
- "yogurt, granola" → "Pretending To Be Healthy"

VALIDATION (snarky but supportive, one sentence):
- "You looked in your fridge and said 'this is fine.' Iconic."
- "This is what happens when you adult all day. Valid."
- "Your therapist would be proud. Or concerned. Either way."
- "Carbs are just a hug for your insides."
- "This is giving 'main character who's been through it.'"

TIP (reference THEIR ingredients, be funny):
- For cheese: "Room temp brie is self-care. Cold brie is a cry for help."
- For chips: "Double-dipping is fine. You live alone for a reason."
- For pizza: "Cold pizza hits different at 11pm. Science."
- For pickles: "Your sodium intake is concerning but also valid."

They have: ${ingredients}

Respond in EXACTLY this JSON format (no markdown):
{"name": "[2-5 word snarky name that makes them laugh]", "validation": "[one snarky but validating sentence]", "tip": "[funny tip about THEIR specific ingredients]"}`;

    // Use circuit breaker with retry and timeout
    const response = await claudeCircuit.execute(
      async () => {
        return await withTimeout(
          withRetry(
            async () => {
              const anthropic = getAnthropicClient();
              return await anthropic.messages.create({
                model: AI_MODELS.naming,
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
