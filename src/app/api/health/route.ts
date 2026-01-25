import { NextResponse } from 'next/server';

export async function GET() {
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

  // Check key formats (without exposing actual keys)
  const anthropicKeyValid = process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-') ?? false;
  const openaiKeyValid = process.env.OPENAI_API_KEY?.startsWith('sk-') ?? false;

  return NextResponse.json({
    status: hasAnthropicKey && hasOpenAIKey ? 'ok' : 'missing_keys',
    keys: {
      ANTHROPIC_API_KEY: {
        set: hasAnthropicKey,
        validFormat: anthropicKeyValid,
        preview: hasAnthropicKey
          ? `${process.env.ANTHROPIC_API_KEY?.slice(0, 10)}...`
          : null,
      },
      OPENAI_API_KEY: {
        set: hasOpenAIKey,
        validFormat: openaiKeyValid,
        preview: hasOpenAIKey
          ? `${process.env.OPENAI_API_KEY?.slice(0, 7)}...`
          : null,
      },
    },
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}
