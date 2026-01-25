// =============================================================================
// Environment Variable Validation
// Validates all env vars at startup - fail fast if misconfigured
// =============================================================================

import { z } from 'zod';

// Define ALL env vars with validation
const envSchema = z.object({
  // AI Providers
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),

  // App config
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Optional: Future integrations
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
});

// Validate at startup - fail fast if misconfigured
function validateEnv() {
  // Only validate on server-side
  if (typeof window !== 'undefined') {
    return {} as z.infer<typeof envSchema>;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);

    // In development, warn but don't crash (for build process)
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Running with missing env vars - some features may not work');
      return {
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
        NODE_ENV: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
      } as z.infer<typeof envSchema>;
    }

    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

export const env = validateEnv();

// Type-safe env access
export type Env = z.infer<typeof envSchema>;

// Helper to check if env is configured
export function isEnvConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY && process.env.OPENAI_API_KEY);
}
