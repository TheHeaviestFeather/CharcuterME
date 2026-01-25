import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { processGirlDinner } from '@/lib/logic-bridge';

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { ingredients } = await request.json();

    if (!ingredients || typeof ingredients !== 'string') {
      return NextResponse.json(
        { error: 'Ingredients are required' },
        { status: 400 }
      );
    }

    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: 'OpenAI API key not configured',
          fallback: true,
          message: 'Blueprint generation requires an OpenAI API key'
        },
        { status: 503 }
      );
    }

    // Process ingredients through logic bridge
    const processed = processGirlDinner(ingredients);

    // Generate image with DALL-E 3
    const openai = getOpenAIClient();
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: processed.prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'natural',
    });

    const imageUrl = response.data && response.data[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E');
    }

    return NextResponse.json({
      imageUrl,
      template: processed.templateSelected,
      reason: processed.templateReason,
      rules: processed.rulesApplied,
    });
  } catch (error) {
    console.error('Error generating sketch:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate blueprint',
        fallback: true,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
