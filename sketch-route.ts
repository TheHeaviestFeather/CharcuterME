import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { processGirlDinner } from '@/lib/logic-bridge';
import { withRetry } from '@/lib/retry';
import { withTimeout, TIMEOUTS } from '@/lib/timeout';
import { dalleCircuit } from '@/lib/circuit-breaker';
import { logger } from '@/lib/logger';
import { isEnabled } from '@/lib/feature-flags';

// =============================================================================
// Configuration
// =============================================================================

const PROMPT_VERSION = 'sketch_v3.0';
const MAX_INGREDIENTS = 8;

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// =============================================================================
// Input Processing
// =============================================================================

function parseIngredients(raw: string): string[] {
  return raw
    .split(/[,\n]+/)
    .map((i) => i.trim().toLowerCase())
    .filter((i) => i.length > 1 && i.length < 40)
    .filter((i) => !/[{}"'`<>]/.test(i))
    .slice(0, MAX_INGREDIENTS);
}

// =============================================================================
// Prompt Building - Studio Ghibli Style
// =============================================================================

function buildGhibliPrompt(ingredients: string[], template: string): string {
  const ingredientNames = ingredients.join(', ');
  
  // Layout guidance based on ingredient count and template
  const layoutGuide = getLayoutGuide(template, ingredients.length);

  return `Studio Ghibli-style illustration, 45-degree angle like an Instagram food photo.

${ingredientNames} casually arranged on a cute white ceramic plate, cozy girl dinner vibes.

STYLE:
- Soft, dreamy Ghibli watercolor textures
- Warm golden hour lighting from the left side
- Gentle, inviting shadows
- That magical Ghibli glow that makes everything look delicious
- Hand-painted feel, slightly whimsical
- Colors are warm and appetizing, never harsh or oversaturated

COMPOSITION:
- Creamy linen fabric background with soft natural folds
- Shallow depth of field, background gently blurred
- ${layoutGuide}
- Food looks delicious and effortlessly styled
- Cute but not trying too hard — casual elegance
- Centered composition with breathing room around the plate

MOOD:
- Cozy evening comfort food vibes
- Self-care energy
- Like a still frame from Kiki's Delivery Service or Howl's Moving Castle
- Warm, inviting, makes you want to reach in and grab something
- The comfort of eating alone, but make it aesthetic

CRITICAL - DO NOT INCLUDE:
- NO text, labels, writing, or watermarks of any kind
- NO hands, fingers, or people
- NO utensils, forks, knives, or chopsticks
- NO other food items beyond: ${ingredientNames}
- NO photorealistic 3D rendering
- NO harsh dramatic lighting or shadows
- NO busy or cluttered backgrounds

The final image should feel like a warm hug in food form.`;
}

function getLayoutGuide(template: string, count: number): string {
  // Template-specific layouts
  const layouts: Record<string, string> = {
    minimalist: 'Intentional negative space, single focal point placed slightly off-center using rule of thirds, gallery-like elegance with room to breathe',
    
    wildGraze: 'Organic S-curve flow connecting all items naturally, clustered in pleasing odd numbers (3s and 5s), abundant but not cluttered, each item visible',
    
    mediterranean: 'Central anchor item (like cheese or dip) with other items radiating outward in a natural spiral, rustic Mediterranean warmth',
    
    bento: 'Organized zones for each item type, clean visual separation between groups, satisfying orderly arrangement',
    
    casual: 'Relaxed natural placement as if someone just set it down, effortlessly charming, not too perfect',
    
    snack: 'Playful scattered arrangement, items slightly overlapping in a casual pile, snack-attack energy',
  };

  // Select based on template or auto-detect from count
  if (template && layouts[template]) {
    return layouts[template];
  }

  // Auto-select based on ingredient count
  if (count <= 2) return layouts.minimalist;
  if (count <= 4) return layouts.casual;
  if (count <= 6) return layouts.wildGraze;
  return layouts.bento;
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
  const ingredientText = displayIngredients.join(' • ') || 'your spread';

  // Generate decorative circles for ingredients
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
  <!-- Linen background -->
  <rect width="400" height="400" fill="${colors.cream}"/>
  <rect width="400" height="400" fill="url(#linen)" opacity="0.3"/>
  
  <defs>
    <pattern id="linen" patternUnits="userSpaceOnUse" width="4" height="4">
      <rect width="4" height="4" fill="${colors.cream}"/>
      <rect width="1" height="1" fill="${colors.mocha}" opacity="0.1"/>
    </pattern>
  </defs>
  
  <!-- Plate shadow -->
  <ellipse cx="205" cy="210" rx="130" ry="120" fill="${colors.mocha}" opacity="0.1"/>
  
  <!-- Main plate -->
  <ellipse cx="200" cy="200" rx="130" ry="120" fill="white"/>
  <ellipse cx="200" cy="200" rx="130" ry="120" fill="none" stroke="${colors.mocha}" stroke-width="2" opacity="0.4"/>
  <ellipse cx="200" cy="200" rx="110" ry="100" fill="none" stroke="${colors.mocha}" stroke-width="1" opacity="0.2"/>
  
  <!-- Ingredient representations -->
  <g>
    ${circles}
  </g>
  
  <!-- Center focal point -->
  <circle cx="200" cy="195" r="18" fill="${colors.mocha}" opacity="0.6"/>
  <circle cx="200" cy="195" r="12" fill="${colors.coral}" opacity="0.5"/>
  
  <!-- Ghibli-style sparkles -->
  <g fill="${colors.coral}" opacity="0.5">
    <circle cx="280" cy="110" r="3"/>
    <circle cx="115" cy="140" r="2.5"/>
    <circle cx="295" cy="260" r="2"/>
    <circle cx="95" cy="230" r="2.5"/>
    <circle cx="310" cy="175" r="2"/>
  </g>
  
  <!-- Template name -->
  <text x="200" y="340" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="${colors.mocha}" font-style="italic">
    ${template || 'Your Spread'}
  </text>
  
  <!-- Ingredient list -->
  <text x="200" y="362" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#999">
    ${ingredientText}
  </text>
  
  <!-- Encouraging message -->
  <text x="200" y="385" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#bbb" font-style="italic">
    imagine the ghibli magic ✨
  </text>
</svg>`;
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

    const ingredients = parseIngredients(rawIngredients);
    
    if (ingredients.length === 0) {
      return NextResponse.json({ error: 'No valid ingredients provided' }, { status: 400 });
    }

    // Get template from logic bridge
    const processed = processGirlDinner(rawIngredients);
    const template = processed.templateSelected || 'casual';

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

    // Build the Ghibli-style prompt
    const prompt = buildGhibliPrompt(ingredients, template);

    logger.info('DALL-E prompt built', {
      promptVersion: PROMPT_VERSION,
      promptLength: prompt.length,
      ingredientCount: ingredients.length,
      template,
    });

    // Execute with circuit breaker
    const imageUrl = await dalleCircuit.execute(
      async () => {
        return await withTimeout(
          withRetry(
            async () => {
              const openai = getOpenAIClient();
              const response = await openai.images.generate({
                model: 'dall-e-3',
                prompt,
                n: 1,
                size: '1024x1024',
                quality: 'standard',
                style: 'natural', // More true to our Ghibli prompt than 'vivid'
              });

              const url = response.data?.[0]?.url;
              if (!url) throw new Error('No image URL returned');
              return url;
            },
            {
              maxRetries: 2,
              shouldRetry: (error) => {
                const msg = error.message.toLowerCase();
                // Don't retry content policy violations
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
    });

    try {
      const body = await request.json();
      const ingredients = parseIngredients(body.ingredients || '');
      return NextResponse.json({
        type: 'svg',
        svg: generateSvgFallback(ingredients, 'casual'),
        template: 'casual',
        fallback: true,
      });
    } catch {
      return NextResponse.json({
        type: 'svg',
        svg: generateSvgFallback(['your', 'spread'], 'casual'),
        fallback: true,
      });
    }
  }
}
