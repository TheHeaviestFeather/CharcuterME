import { NextResponse } from 'next/server';

export async function GET() {
  // Only return boolean indicators - never expose key content
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const hasGoogleKey = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  const allKeysPresent = hasAnthropicKey && hasOpenAIKey && hasGoogleKey;

  return NextResponse.json({
    status: allKeysPresent ? 'ok' : 'degraded',
    services: {
      naming: hasAnthropicKey,
      vibe: hasOpenAIKey,
      sketch: hasGoogleKey,
    },
    timestamp: new Date().toISOString(),
  });
}
