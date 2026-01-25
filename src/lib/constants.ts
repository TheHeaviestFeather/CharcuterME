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

// Minimum vibe score (we're not monsters)
export const MIN_VIBE_SCORE = 35;

// API Models - SINGLE SOURCE OF TRUTH
export const AI_MODELS = {
  naming: 'claude-3-5-haiku-20241022',
  sketch: 'dall-e-3',
  vibe: 'gpt-4o',
} as const;

// Image generation settings - SINGLE SOURCE OF TRUTH
export const DALLE_SETTINGS = {
  size: '1024x1024' as const,
  quality: 'standard' as const,
  style: 'vivid' as const, // 'vivid' for anime-style saturated colors
};

// Claude settings
export const CLAUDE_SETTINGS = {
  maxTokens: 300,
  temperature: 0.9,
} as const;
