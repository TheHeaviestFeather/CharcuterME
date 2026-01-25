import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { processGirlDinner } from '@/lib/logic-bridge';
import { withRetry } from '@/lib/retry';
import { withTimeout, TIMEOUTS } from '@/lib/timeout';
import { dalleCircuit } from '@/lib/circuit-breaker';
import { logger } from '@/lib/logger';
import { isEnabled } from '@/lib/feature-flags';
import { AI_MODELS, DALLE_SETTINGS } from '@/lib/constants';
import { SketchRequestSchema, validateRequest, parseIngredients } from '@/lib/validation';

// =============================================================================
// Configuration
// =============================================================================

const PROMPT_VERSION = 'sketch_v3.2_template_layouts';

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// =============================================================================
// Layout Guides (Template-Based)
// =============================================================================

const LAYOUT_GUIDES: Record<string, string> = {
  'The Minimalist':
    'Minimal arrangement with generous negative space. Items placed off-center using rule of thirds. Gallery-like elegance.',

  'The Anchor':
    'One hero item at center. Smaller items orbit around it. Clear visual hierarchy.',

  'The Snack Line':
    'Linear arrangement with dip as anchor. Dippers fanned beside it.',

  'The Bento':
    'Organized zones for each item. Clean separation between groups. Orderly grid.',

  'The Wild Graze':
    'S-curve flow connecting items. Clustered in odd numbers. Abundant but intentional.',
};

// =============================================================================
// Prompt Building - Option B: Template-Based Detailed Prompt
// =============================================================================

function buildGhibliPrompt(ingredients: string[], template: string): string {
  const ingredientList = ingredients.slice(0, 6).join(', ');
  const layoutGuide = LAYOUT_GUIDES[template] || LAYOUT_GUIDES['The Wild Graze'];

  return `Anime food illustration in the style of Japanese animation films. Soft painted textures, warm glowing colors.

${ingredientList} on a simple white plate. ${layoutGuide}

Visual style:
- Soft cel-shading with visible brushstrokes
- Warm palette: cream whites, golden ambers, soft corals
- Food has inner luminosity, looks impossibly delicious
- Rich saturated colors but gentle, never harsh
- Slightly stylized and idealized, not photorealistic

Composition: Overhead view with slight tilt. Soft cream fabric background, shallow depth of field. Food is hero, everything else fades soft.

The food should look like a frame from a cozy anime - warm, inviting, making the viewer hungry.`;
}

// =============================================================================
// SVG Fallback
// =============================================================================

function generateSvgFallback(ingredients: string[], template: string): string {
  const colors = {
    cream: '#FAF9F7',
    mocha: '#A47864',
    coral: '#FF6F61',
    lavender: '#A78BFA',
  };

  const displayIngredients = ingredients.slice(0, 4);
  const ingredientText = displayIngredients.join(' + ') || 'your spread';

  const circles = displayIngredients.map((_, i) => {
    const angle = (i * 90) + 45;
    const radius = 55;
    const x = 200 + radius * Math.cos((angle * Math.PI) / 180);
    const y = 195 + radius * Math.sin((angle * Math.PI) / 180);
    const circleColors = [colors.coral, colors.lavender, colors.mocha, '#E8B4A0'];
    const size = 20 + Math.random() * 10;
    return `<circle cx="${x}" cy="${y}" r="${size}" fill="${circleColors[i]}" opacity="0.75"/>`;
  }).join('\n    ');

  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="${colors.cream}"/>
  <rect width="400" height="400" fill="url(#linen)" opacity="0.3"/>

  <defs>
    <pattern id="linen" patternUnits="userSpaceOnUse" width="4" height="4">
      <rect width="4" height="4" fill="${colors.cream}"/>
      <rect width="1" height="1" fill="${colors.mocha}" opacity="0.1"/>
    </pattern>
  </defs>

  <ellipse cx="205" cy="210" rx="130" ry="120" fill="${colors.mocha}" opacity="0.1"/>
  <ellipse cx="200" cy="200" rx="130" ry="120" fill="white"/>
  <ellipse cx="200" cy="200" rx="130" ry="120" fill="none" stroke="${colors.mocha}" stroke-width="2" opacity="0.4"/>
  <ellipse cx="200" cy="200" rx="110" ry="100" fill="none" stroke="${colors.mocha}" stroke-width="1" opacity="0.2"/>

  <g>
    ${circles}
  </g>

  <circle cx="200" cy="195" r="18" fill="${colors.mocha}" opacity="0.6"/>
  <circle cx="200" cy="195" r="12" fill="${colors.coral}" opacity="0.5"/>

  <g fill="${colors.coral}" opacity="0.5">
    <circle cx="280" cy="110" r="3"/>
    <circle cx="115" cy="140" r="2.5"/>
    <circle cx="295" cy="260" r="2"/>
    <circle cx="95" cy="230" r="2.5"/>
    <circle cx="310" cy="175" r="2"/>
  </g>

  <text x="200" y="340" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="${colors.mocha}" font-style="italic">
    ${template || 'Your Spread'}
  </text>

  <text x="200" y="362" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#999">
    ${ingredientText}
  </text>

  <text x="200" y="385" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#bbb" font-style="italic">
    imagine the magic
  </text>
</svg>`;
}

// =============================================================================
// API Route
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let ingredients: string[] = []; // Store for error handler access
  let template = 'The Wild Graze'; // Store for error handler access

  try {
    const body = await request.json();

    // Validate request with Zod
    const validation = validateRequest(SketchRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    ingredients = parseIngredients(validation.data!.ingredients);

    if (ingredients.length === 0) {
      return NextResponse.json({ error: 'No valid ingredients provided' }, { status: 400 });
    }

    // Get template from logic bridge
    const processed = processGirlDinner(validation.data!.ingredients);
    template = processed.templateSelected || 'The Wild Graze';

    // Check if DALL-E is enabled
    if (!isEnabled('enableDalle')) {
      logger.info('DALL-E disabled via feature flag', { promptVersion: PROMPT_VERSION });
      return NextResponse.json({
        type: 'svg',
        svg: generateSvgFallback(ingredients, template),
        template,
        fallback: true,
        reason: 'Feature disabled',
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OPENAI_API_KEY not configured', { promptVersion: PROMPT_VERSION });
      return NextResponse.json({
        type: 'svg',
        svg: generateSvgFallback(ingredients, template),
        template,
        fallback: true,
        reason: 'API key not configured',
      });
    }

    // Build the detailed prompt with template-based layout
    const prompt = buildGhibliPrompt(ingredients, template);

    logger.info('DALL-E prompt built', {
      promptVersion: PROMPT_VERSION,
      promptLength: prompt.length,
      ingredientCount: ingredients.length,
      template,
      layoutGuide: LAYOUT_GUIDES[template] ? 'matched' : 'default',
    });

    // Execute with circuit breaker
    const imageUrl = await dalleCircuit.execute(
      async () => {
        return await withTimeout(
          withRetry(
            async () => {
              const openai = getOpenAIClient();
              const response = await openai.images.generate({
                model: AI_MODELS.sketch,
                prompt,
                n: 1,
                size: DALLE_SETTINGS.size,
                quality: DALLE_SETTINGS.quality,
                style: DALLE_SETTINGS.style,
              });

              const url = response.data?.[0]?.url;
              if (!url) throw new Error('No image URL returned');
              return url;
            },
            {
              maxRetries: 2,
              shouldRetry: (error) => {
                const msg = error.message.toLowerCase();
                if (msg.includes('content policy') || msg.includes('safety')) return false;
                return msg.includes('rate limit') || msg.includes('timeout');
              },
            }
          ),
          TIMEOUTS.DALLE_IMAGE,
          'DALL-E timed out'
        );
      },
      () => {
        logger.warn('DALL-E circuit open', { promptVersion: PROMPT_VERSION });
        return null;
      }
    );

    // Circuit breaker returned fallback
    if (!imageUrl) {
      return NextResponse.json({
        type: 'svg',
        svg: generateSvgFallback(ingredients, template),
        template,
        fallback: true,
        reason: 'Generation failed',
      });
    }

    logger.info('Sketch generated', {
      promptVersion: PROMPT_VERSION,
      duration: Date.now() - startTime,
      template,
      ingredientCount: ingredients.length,
    });

    return NextResponse.json({
      type: 'image',
      imageUrl,
      template,
      reason: processed.templateReason,
      rules: processed.rulesApplied,
    });

  } catch (error) {
    logger.error('Error generating sketch', {
      promptVersion: PROMPT_VERSION,
      error: error instanceof Error ? error.message : 'Unknown',
      ingredientCount: ingredients.length,
      template,
    });

    // Return fallback on any error - use stored ingredients (don't re-parse body)
    return NextResponse.json({
      type: 'svg',
      svg: generateSvgFallback(ingredients.length > 0 ? ingredients : ['your', 'spread'], template),
      template,
      fallback: true,
    });
  }
}
