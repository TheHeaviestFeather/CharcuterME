/**
 * Shared Constants
 * Brand colors, default values, and other constants used across the app
 */

// Brand colors (match tailwind.config.ts)
export const COLORS = {
  mocha: '#A47864',
  coral: '#FF6F61',
  lavender: '#A78BFA',
  cream: '#FAF9F7',
} as const;

// Array of brand colors for random selection
export const BRAND_COLORS = [COLORS.coral, COLORS.lavender, COLORS.mocha, COLORS.cream];

// Default dinner name when AI fails
export const DEFAULT_DINNER_NAME = 'The Audacity';

// Minimum vibe score - users won't share low scores, so keep it respectable
export const MIN_VIBE_SCORE = 65;

// API Models - SINGLE SOURCE OF TRUTH
export const AI_MODELS = {
  naming: 'claude-3-5-haiku-20241022',
  sketch: 'imagen-3.0-generate-001', // Vertex AI Imagen
  vibe: 'gpt-4o',
} as const;

// Claude settings
export const CLAUDE_SETTINGS = {
  maxTokens: 300,
  temperature: 0.9,
} as const;
