import { NextRequest, NextResponse } from 'next/server';
import { processGirlDinner } from '@/lib/logic-bridge';
import { withRetry } from '@/lib/retry';
import { withTimeout, TIMEOUTS } from '@/lib/timeout';
import { dalleCircuit } from '@/lib/circuit-breaker';
import { logger } from '@/lib/logger';
import { isEnabled } from '@/lib/feature-flags';
import { getOpenAIClient } from '@/lib/ai-clients';
import { BRAND_COLORS, COLORS, AI_MODELS, DALLE_SETTINGS } from '@/lib/constants';

// SVG fallback when DALL-E is unavailable
function getSvgFallback(template: string, ingredients: string[]) {
  const randomColor = BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)];

  return {
    type: 'svg' as const,
    svg: `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="${COLORS.cream}"/>
      <ellipse cx="200" cy="200" rx="150" ry="140" fill="none" stroke="${randomColor}" stroke-width="3"/>
      <text x="200" y="180" text-anchor="middle" font-family="system-ui" font-size="16" fill="${COLORS.mocha}">
        ${template}
      </text>
      <text x="200" y="210" text-anchor="middle" font-family="system-ui" font-size="12" fill="#666">
        ${ingredients.slice(0, 3).join(' • ')}
      </text>
      <text x="200" y="350" text-anchor="middle" font-family="system-ui" font-size="10" fill="#999">
        AI sketch unavailable - use your imagination!
      </text>
    </svg>`,
    template,
    fallback: true,
  };
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

    // Process ingredients through logic bridge
    const processed = processGirlDinner(ingredients);
    const ingredientList = ingredients.split(',').map((i: string) => i.trim());

    // Check if DALL-E is enabled
    if (!isEnabled('enableDalle')) {
      logger.info('DALL-E disabled via feature flag, using SVG fallback');
      return NextResponse.json(getSvgFallback(processed.templateSelected, ingredientList));
    }

    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OPENAI_API_KEY not configured, using SVG fallback');
      return NextResponse.json({
        ...getSvgFallback(processed.templateSelected, ingredientList),
        error: 'OpenAI API key not configured',
      });
    }

    // Use circuit breaker with retry and timeout
    const imageUrl = await dalleCircuit.execute(
      async () => {
        return await withTimeout(
          withRetry(
            async () => {
              const openai = getOpenAIClient();
              const response = await openai.images.generate({
                model: AI_MODELS.sketch,
                prompt: processed.prompt,
                n: 1,
                size: DALLE_SETTINGS.size,
                quality: DALLE_SETTINGS.quality,
                style: DALLE_SETTINGS.style,
              });

              const url = response.data && response.data[0]?.url;
              if (!url) {
                throw new Error('No image URL returned from DALL-E');
              }
              return url;
            },
            { maxRetries: 2 }
          ),
          TIMEOUTS.DALLE_IMAGE,
          'DALL-E image generation timed out'
        );
      },
      () => {
        logger.warn('DALL-E circuit open, using SVG fallback');
        return null;
      }
    );

    // If circuit breaker returned fallback (null)
    if (!imageUrl) {
      return NextResponse.json({
        ...getSvgFallback(processed.templateSelected, ingredientList),
        reason: processed.templateReason,
        rules: processed.rulesApplied,
      });
    }

    logger.info('Sketch generated successfully', {
      action: 'generate_sketch',
      duration: Date.now() - startTime,
      template: processed.templateSelected,
    });

    return NextResponse.json({
      imageUrl,
      template: processed.templateSelected,
      reason: processed.templateReason,
      rules: processed.rulesApplied,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error generating sketch', {
      action: 'generate_sketch',
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Parse ingredients for fallback
    let ingredientList: string[] = [];
    let template = 'The Spread';
    try {
      const body = await request.clone().json();
      ingredientList = (body.ingredients || '').split(',').map((i: string) => i.trim());
      const processed = processGirlDinner(body.ingredients || '');
      template = processed.templateSelected;
    } catch {
      // Ignore parse errors
    }

    return NextResponse.json({
      ...getSvgFallback(template, ingredientList),
      error: 'Failed to generate blueprint',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
