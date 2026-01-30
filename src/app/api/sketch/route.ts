import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { processGirlDinner } from '@/lib/logic-bridge';
import { logger } from '@/lib/logger';
import { isEnabled } from '@/lib/feature-flags';

// =============================================================================
// Configuration
// =============================================================================

const PROMPT_VERSION = 'sketch_v5.0_lifestyle';

// =============================================================================
// Input Processing
// =============================================================================

function parseIngredients(raw: string): string[] {
  return raw
    .split(/[,\n]+/)
    .map((i) => i.trim().toLowerCase())
    .filter((i) => i.length > 1 && i.length < 40)
    .filter((i) => !/[{}"'`<>]/.test(i))
    .slice(0, 6);
}

// =============================================================================
// Layout Guides (Template-Based)
// =============================================================================

interface TemplateStyle {
  layout: string;
  scene: string;
  mood: string;
}

const TEMPLATE_STYLES: Record<string, TemplateStyle> = {
  'The Minimalist': {
    layout: 'Minimal arrangement with generous negative space. Items placed off-center using rule of thirds.',
    scene: 'Clean marble or light stone surface. Single small candle in soft focus. Minimal, intentional.',
    mood: 'Quiet evening alone. Thoughtful, curated simplicity.',
  },

  'The Anchor': {
    layout: 'One hero item takes focus. Smaller items arranged around it as supporting players.',
    scene: 'Rustic wooden cutting board on kitchen counter. Casual, just-prepared feeling.',
    mood: 'Proud home cook energy. "I made this and it looks good."',
  },

  'The Snack Line': {
    layout: 'Linear arrangement with dip as anchor point. Dippers fanned in an arc beside it.',
    scene: 'Coffee table surface. TV remote slightly visible. Cozy blanket edge in frame.',
    mood: 'Movie night vibes. Comfortable, no pretense.',
  },

  'The Bento': {
    layout: 'Organized zones for each item. Clean visual separation. Satisfying orderly grid.',
    scene: 'Clean desk surface. Laptop edge or book spine in soft background.',
    mood: 'Work-from-home lunch break. Organized but relaxed.',
  },

  'The Wild Graze': {
    layout: 'Abundant S-curve flow connecting items. Clustered in pleasing odd numbers. Organic arrangement.',
    scene: 'Cozy couch corner. Soft throw blanket visible. Wine glass in background.',
    mood: 'Sunday evening indulgence. Treat yourself energy.',
  },
};

// =============================================================================
// Prompt Building for Imagen 3 - Lifestyle Photography Style
// =============================================================================

function buildImagenPrompt(ingredients: string[], template: string): string {
  const ingredientList = ingredients.join(', ');
  const count = ingredients.length;

  const style = TEMPLATE_STYLES[template] || TEMPLATE_STYLES['The Wild Graze'];

  return `Cozy Instagram food photography. 45-degree angle, shot from the perspective of someone about to enjoy their meal.

FOOD: A ceramic plate with exactly ${count} items: ${ingredientList}.
${style.layout}

SCENE:
- ${style.scene}
- Soft linen napkin tucked under plate edge
- Warm ambient lighting from the side

LIGHTING: Golden hour warmth. Soft directional light from the left creating gentle shadows.

STYLE:
- Shallow depth of field, background softly blurred
- Warm color grading, cozy tones
- Lifestyle aesthetic, not food database or stock photo
- Artfully casual plating, not restaurant-perfect
- The food looks delicious and approachable

MOOD: ${style.mood}

CRITICAL CONSTRAINTS:
- Show ONLY these ${count} food items on the plate: ${ingredientList}
- Do not add any extra food items, garnishes, or ingredients
- Scene props (napkin, glass, blanket) are allowed but NO extra food
- No text, labels, watermarks, or borders`;
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

  <ellipse cx="205" cy="210" rx="130" ry="120" fill="${colors.mocha}" opacity="0.1"/>
  <ellipse cx="200" cy="200" rx="130" ry="120" fill="white"/>
  <ellipse cx="200" cy="200" rx="130" ry="120" fill="none" stroke="${colors.mocha}" stroke-width="2" opacity="0.4"/>

  <g>
    ${circles}
  </g>

  <text x="200" y="340" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="${colors.mocha}" font-style="italic">
    ${template || 'Your Spread'}
  </text>

  <text x="200" y="362" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#999">
    ${ingredientText}
  </text>
</svg>`;
}

// =============================================================================
// Image Generation with DALL-E 3
// =============================================================================

async function generateWithDallE(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const openai = new OpenAI({ apiKey });

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
    response_format: "b64_json",
  });

  const imageData = response.data?.[0]?.b64_json;
  if (!imageData) {
    throw new Error('No image in response');
  }

  return `data:image/png;base64,${imageData}`;
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
    const template = processed.templateSelected || 'The Wild Graze';

    // Check if image generation is enabled
    if (!isEnabled('enableImagen')) {
      logger.info('Image generation disabled via feature flag', { promptVersion: PROMPT_VERSION });
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

    // Build prompt with template-specific styling
    const prompt = buildImagenPrompt(ingredients, template);
    const templateStyle = TEMPLATE_STYLES[template] || TEMPLATE_STYLES['The Wild Graze'];

    logger.info('Image prompt built', {
      promptVersion: PROMPT_VERSION,
      promptLength: prompt.length,
      ingredientCount: ingredients.length,
      template,
      mood: templateStyle.mood,
    });

    // Generate image
    let imageData: string | null = null;

    try {
      imageData = await generateWithDallE(prompt);
    } catch (error) {
      logger.error('DALL-E image generation failed', {
        promptVersion: PROMPT_VERSION,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }

    // Return fallback if generation failed
    if (!imageData) {
      return NextResponse.json({
        type: 'svg',
        svg: generateSvgFallback(ingredients, template),
        template,
        fallback: true,
        reason: 'Generation failed',
      });
    }

    logger.info('Sketch generated with DALL-E', {
      promptVersion: PROMPT_VERSION,
      duration: Date.now() - startTime,
      template,
      ingredientCount: ingredients.length,
    });

    return NextResponse.json({
      type: 'image',
      imageUrl: imageData, // Base64 data URL
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
      const ingredients = parseIngredients('');
      return NextResponse.json({
        type: 'svg',
        svg: generateSvgFallback(ingredients, 'The Wild Graze'),
        template: 'The Wild Graze',
        fallback: true,
      });
    } catch {
      return NextResponse.json({
        type: 'svg',
        svg: generateSvgFallback(['your', 'spread'], 'The Wild Graze'),
        fallback: true,
      });
    }
  }
}
