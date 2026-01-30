import { GoogleAuth } from 'google-auth-library';
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
    .slice(0, 10);
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

function buildImagenPrompt(ingredients: string[], _template: string): string {
  const ingredientList = ingredients.join(', ');
  const count = ingredients.length;

  return `Cozy Instagram food photography, 45-degree angle, warm golden hour lighting.

A ceramic plate with EXACTLY ${count} food items: ${ingredientList}. Nothing else on the plate.

Setting: Cozy couch corner with soft throw blanket in background. Wine glass blurred in back.
Style: Shallow depth of field, warm colors, lifestyle aesthetic.

STRICT RULES:
- The plate must contain ONLY these ${count} items: ${ingredientList}
- Do NOT add any other food, garnishes, herbs, or extras
- NO humans, hands, people, or body parts in the image
- No text or watermarks`;
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

async function getAccessToken(): Promise<string> {
  // Parse service account credentials from environment variable
  // Supports both raw JSON and base64-encoded JSON
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!credentials) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not configured');
  }

  let serviceAccount;
  try {
    // Try parsing as raw JSON first
    serviceAccount = JSON.parse(credentials);
  } catch {
    // If that fails, try base64 decoding first
    try {
      const decoded = Buffer.from(credentials, 'base64').toString('utf-8');
      serviceAccount = JSON.parse(decoded);
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON or base64-encoded JSON');
    }
  }

  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();

  if (!token.token) {
    throw new Error('Failed to get access token');
  }

  return token.token;
}

async function generateWithVertexImagen(prompt: string): Promise<string | null> {
  const accessToken = await getAccessToken();

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

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      logger.warn('GOOGLE_SERVICE_ACCOUNT_KEY not configured', { promptVersion: PROMPT_VERSION });
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
