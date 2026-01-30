import { NextRequest, NextResponse } from 'next/server';
import { processGirlDinner } from '@/lib/logic-bridge';
import { logger } from '@/lib/logger';
import { isEnabled } from '@/lib/feature-flags';
import { parseIngredients } from '@/lib/validation';
import { generateCacheKey, cacheGet, cacheSet, CACHE_TTL } from '@/lib/cache';
import { getVertexAccessToken, isVertexConfigured } from '@/lib/vertex-auth';

// =============================================================================
// Configuration
// =============================================================================

const PROMPT_VERSION = 'sketch_v6.0_chaotic_millennial';

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
    layout: 'Items slightly askew on the plate. One thing rolling toward the edge. Imperfect but intentional.',
    scene: 'Worn kitchen counter with water ring stains. Sriracha bottle photobombing in background.',
    mood: 'Too tired to care about presentation. Authentic chaos.',
  },

  'The Anchor': {
    layout: 'One big item dominates. Others scattered around like afterthoughts. Uneven spacing.',
    scene: 'Paper towel as a placemat. Fork at weird angle. Ambient laptop glow.',
    mood: '"This is fine" energy. Peak millennial survival.',
  },

  'The Snack Line': {
    layout: 'Items in a vaguely straight line. Some overlapping. One fell over.',
    scene: 'Coffee table with ring stains. TV remote half-visible. Blanket burrito staging.',
    mood: 'Netflix asked if I\'m still watching. Yes. Obviously.',
  },

  'The Bento': {
    layout: 'Attempted organization that gave up halfway. Some zones respected, some chaos.',
    scene: 'Desk with sticky notes visible. Coffee mug with attitude. Work-from-home realness.',
    mood: 'Multitasking between emails and emotional eating.',
  },

  'The Wild Graze': {
    layout: 'Gloriously haphazard pile. Items touching that shouldn\'t. Zero fucks given.',
    scene: 'Couch cushion visible. Wine glass already half empty. Phone charging cable in shot.',
    mood: 'Sunday scaries but make it aesthetic. Chaotic self-care.',
  },
};

// =============================================================================
// Prompt Building for Imagen 3 - Millennial Chaotic Style
// =============================================================================

function buildImagenPrompt(ingredients: string[], _template: string): string {
  const ingredientList = ingredients.join(', ');
  const count = ingredients.length;

  return `Casual phone photo of late night snack, slightly messy, authentic millennial apartment vibes.

A mismatched plate or paper plate with EXACTLY ${count} food items: ${ingredientList}. Arranged haphazardly like someone just threw them on.

Setting: Cluttered coffee table or kitchen counter. Visible in background: half-empty wine glass, phone charger, maybe a laptop edge. Warm lamp lighting mixed with blue TV glow. Couch blanket visible.
Style: Imperfect composition, slight motion blur okay, looks like it was taken at 11pm before eating. NOT Instagram perfect - more "sent this to my group chat" energy.

STRICT RULES:
- The plate must contain ONLY these ${count} items: ${ingredientList}
- Do NOT add any other food, garnishes, herbs, or extras
- NO humans, hands, people, or body parts in the image
- No text or watermarks
- NOT overly styled or curated - embrace the chaos`;
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
// Image Generation with Vertex AI Imagen 3
// =============================================================================

const PROJECT_ID = process.env.GOOGLE_PROJECT_ID || 'charcuterme';
const LOCATION = 'us-central1';

async function generateWithVertexImagen(prompt: string): Promise<string | null> {
  const accessToken = await getVertexAccessToken();

  const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagen-3.0-generate-001:predict`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '1:1',
        safetyFilterLevel: 'block_few',
        personGeneration: 'dont_allow',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Vertex AI Imagen error', {
      status: response.status,
      error: errorText
    });
    throw new Error(`Vertex AI error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Log the response structure for debugging
  logger.info('Vertex AI response received', {
    hasData: !!data,
    hasPredictions: !!data?.predictions,
    predictionsLength: data?.predictions?.length,
    firstPredictionKeys: data?.predictions?.[0] ? Object.keys(data.predictions[0]) : [],
  });

  // Extract base64 image from response
  const predictions = data.predictions;
  if (predictions && predictions.length > 0) {
    const prediction = predictions[0];

    // Try different possible field names
    const imageData = prediction.bytesBase64Encoded ||
                      prediction.image?.bytesBase64Encoded ||
                      prediction.generatedImage?.bytesBase64Encoded ||
                      prediction.imageBytes;

    if (imageData) {
      return `data:image/png;base64,${imageData}`;
    }
  }

  // Log what we got for debugging
  logger.error('Unexpected response structure', {
    data: JSON.stringify(data).slice(0, 500)
  });

  throw new Error('No image in response');
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

    // Check cache first
    const cacheKey = generateCacheKey('sketch', rawIngredients);
    const cached = await cacheGet<{ type: string; imageUrl?: string; template: string; reason?: string; rules?: string[] }>(cacheKey);
    if (cached) {
      logger.info('Cache hit for sketch', { cacheKey: cacheKey.slice(0, 50) });
      return NextResponse.json(cached);
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

    if (!isVertexConfigured()) {
      logger.warn('Vertex AI not configured', { promptVersion: PROMPT_VERSION });
      return NextResponse.json({
        type: 'svg',
        svg: generateSvgFallback(ingredients, template),
        template,
        fallback: true,
        reason: 'Service account not configured',
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
      imageData = await generateWithVertexImagen(prompt);
    } catch (error) {
      logger.error('Vertex AI Imagen generation failed', {
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

    logger.info('Sketch generated with Vertex AI Imagen', {
      promptVersion: PROMPT_VERSION,
      duration: Date.now() - startTime,
      template,
      ingredientCount: ingredients.length,
    });

    const result = {
      type: 'image',
      imageUrl: imageData, // Base64 data URL
      template,
      reason: processed.templateReason,
      rules: processed.rulesApplied,
    };

    // Cache the result (fire and forget)
    cacheSet(cacheKey, result, CACHE_TTL.sketch).catch(() => {});

    return NextResponse.json(result);

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
