import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from 'next/server';
import { processGirlDinner } from '@/lib/logic-bridge';
import { logger } from '@/lib/logger';
import { isEnabled } from '@/lib/feature-flags';

// =============================================================================
// Configuration
// =============================================================================

const PROMPT_VERSION = 'sketch_v4.0_imagen3';

function getGoogleClient() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY not configured');
  }
  return new GoogleGenerativeAI(apiKey);
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
    .slice(0, 6);
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
// Prompt Building for Imagen 3
// =============================================================================

function buildImagenPrompt(ingredients: string[], template: string): string {
  const layoutGuide = LAYOUT_GUIDES[template] || LAYOUT_GUIDES['The Wild Graze'];
  const count = ingredients.length;

  // Imagen 3 responds better to clear, structured prompts
  return `Anime food illustration in the style of Studio Ghibli films.

SCENE: A simple white ceramic plate on cream linen fabric background.

CONTENTS: Exactly ${count} food items on the plate:
${ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n')}

COMPOSITION: ${layoutGuide}

STYLE:
- Soft watercolor textures with visible brushstrokes
- Warm golden hour lighting from the left
- Food has a gentle inner glow, looks delicious
- Warm color palette: cream, amber, coral tones
- Slightly stylized, not photorealistic
- Cozy, inviting atmosphere

IMPORTANT CONSTRAINTS:
- Show ONLY the ${count} ingredients listed above
- Do not add any extra food items
- Do not add garnishes or decorations
- Do not add utensils
- No text or labels
- No borders or frames
- Clean cream fabric background only`;
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
    const size = 20 + (i * 3); // Deterministic size instead of Math.random()
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
// Image Generation with Imagen 3 via Gemini 2.0 Flash
// =============================================================================

async function generateWithImagen(prompt: string): Promise<string | null> {
  const genAI = getGoogleClient();

  // Use Gemini 2.0 Flash with image generation capability
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      temperature: 1,
      topP: 0.95,
      topK: 40,
    },
  });

  const response = await model.generateContent({
    contents: [{
      role: "user",
      parts: [{ text: `Generate an image: ${prompt}` }]
    }],
    generationConfig: {
      // @ts-expect-error - responseModalities is experimental
      responseModalities: ["image", "text"],
    },
  });

  const candidate = response.response.candidates?.[0];
  if (!candidate?.content?.parts) {
    throw new Error('No content in response');
  }

  // Find the image part in the response
  for (const part of candidate.content.parts) {
    if (part.inlineData?.mimeType?.startsWith("image/")) {
      // Return as base64 data URL
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

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

    // Check if Imagen is enabled
    if (!isEnabled('enableImagen')) {
      logger.info('Imagen disabled via feature flag', { promptVersion: PROMPT_VERSION });
      return NextResponse.json({
        type: 'svg',
        svg: generateSvgFallback(ingredients, template),
        template,
        fallback: true,
        reason: 'Feature disabled',
      });
    }

    if (!process.env.GOOGLE_API_KEY) {
      logger.warn('GOOGLE_API_KEY not configured', { promptVersion: PROMPT_VERSION });
      return NextResponse.json({
        type: 'svg',
        svg: generateSvgFallback(ingredients, template),
        template,
        fallback: true,
        reason: 'API key not configured',
      });
    }

    // Build prompt
    const prompt = buildImagenPrompt(ingredients, template);

    logger.info('Imagen prompt built', {
      promptVersion: PROMPT_VERSION,
      promptLength: prompt.length,
      ingredientCount: ingredients.length,
      template,
    });

    // Generate image
    let imageData: string | null = null;

    try {
      imageData = await generateWithImagen(prompt);
    } catch (error) {
      logger.error('Imagen generation failed', {
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

    logger.info('Sketch generated with Imagen', {
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
