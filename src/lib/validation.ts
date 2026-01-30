/**
 * Zod Validation Utilities
 * Re-exports schemas from types and provides validation helpers
 */

import { z } from 'zod';

// Re-export schemas from types for convenience
export {
  NamerResponseSchema,
  SketchResponseSchema,
  VibeCheckResponseSchema,
  type NamerResponse,
  type SketchResponse,
  type VibeCheckResponse,
} from '@/types';

// =============================================================================
// Shared Utilities
// =============================================================================

/**
 * Parse and sanitize ingredient input
 * Extracted to shared utility to avoid DRY violations
 */
export function parseIngredients(raw: string): string[] {
  return raw
    .split(/[,\n]+/)
    .map((i) => i.trim().toLowerCase())
    .filter((i) => i.length > 1 && i.length < 40)
    .filter((i) => !/[{}"'`<>]/.test(i))
    .slice(0, 12); // Hard limit for performance
}

/**
 * Sanitize ingredient string for AI prompts
 */
export function sanitizeIngredients(raw: string): string {
  return raw
    .replace(/[{}"'`<>]/g, '') // Remove JSON/XML breaking characters
    .replace(/\n/g, ', ')       // Newlines to commas
    .replace(/\s+/g, ' ')       // Collapse whitespace
    .trim()
    .slice(0, 500);             // Hard limit
}

// =============================================================================
// Request Schemas
// =============================================================================

export const NameRequestSchema = z.object({
  ingredients: z
    .string()
    .min(1, 'Ingredients are required')
    .max(1000, 'Input too long'),
});

export const SketchRequestSchema = z.object({
  ingredients: z
    .string()
    .min(1, 'Ingredients are required')
    .max(1000, 'Input too long'),
});

// Max photo size: 10MB base64 (~7.5MB actual image)
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

export const VibeRequestSchema = z.object({
  photo: z
    .string()
    .min(1, 'Photo is required')
    .max(MAX_PHOTO_SIZE, 'Photo is too large (max 10MB)')
    .refine(
      (val) => val.startsWith('data:image/') || /^[A-Za-z0-9+/=]+$/.test(val.slice(0, 100)),
      'Invalid photo format'
    ),
  dinnerName: z
    .string()
    .max(200, 'Dinner name too long')
    .optional(),
  ingredients: z
    .string()
    .max(1000, 'Ingredients too long')
    .optional(),
  rules: z
    .array(z.string().max(200))
    .max(20)
    .optional(),
});

// =============================================================================
// Type Exports
// =============================================================================

export type NameRequest = z.infer<typeof NameRequestSchema>;
export type SketchRequest = z.infer<typeof SketchRequestSchema>;
export type VibeRequest = z.infer<typeof VibeRequestSchema>;

// =============================================================================
// Validation Helper
// =============================================================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validate request body against a Zod schema
 * Returns typed data or error message
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): ValidationResult<T> {
  const result = schema.safeParse(body);

  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      success: false,
      error: firstError?.message || 'Validation failed',
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
