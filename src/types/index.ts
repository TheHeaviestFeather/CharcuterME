/**
 * CharcuterME Type Definitions
 *
 * Types are organized in two categories:
 * 1. Domain types (derived from Zod schemas for validation)
 * 2. Internal types (for app logic, no validation needed)
 *
 * API request/response types are derived from Zod schemas in @/lib/validation
 */

import { z } from 'zod';

// =============================================================================
// Zod Schemas - Single Source of Truth
// =============================================================================

// Ingredient Role Schema
export const IngredientRoleSchema = z.enum(['anchor', 'filler', 'pop', 'vehicle']);
export type IngredientRole = z.infer<typeof IngredientRoleSchema>;

// Ingredient Size Schema
export const IngredientSizeSchema = z.enum(['tiny', 'small', 'medium', 'large']);
export type IngredientSize = z.infer<typeof IngredientSizeSchema>;

// Plating Style Schema
export const PlatingStyleSchema = z.enum(['stack', 'scatter', 'cluster', 'spread', 'fan', 'pile']);
export type PlatingStyle = z.infer<typeof PlatingStyleSchema>;

// Ingredient Data Schema
export const IngredientDataSchema = z.object({
  role: IngredientRoleSchema,
  size: IngredientSizeSchema,
  shape: z.string(),
  color: z.string(),
  platingStyle: PlatingStyleSchema,
  displayName: z.string(),
  proTip: z.string(),
  isSmallRound: z.boolean().optional(),
  isLongItem: z.boolean().optional(),
  isBulky: z.boolean().optional(),
  needsContainer: z.boolean().optional(),
  useOddNumbers: z.boolean().optional(),
});
export type IngredientData = z.infer<typeof IngredientDataSchema>;

// Classified Ingredient Schema
export const ClassifiedIngredientSchema = IngredientDataSchema.extend({
  original: z.string(),
});
export type ClassifiedIngredient = z.infer<typeof ClassifiedIngredientSchema>;

// =============================================================================
// Internal Types (No Zod validation needed)
// =============================================================================

// Ingredient Summary - computed from ClassifiedIngredient[]
export interface IngredientSummary {
  total: number;
  anchors: ClassifiedIngredient[];
  fillers: ClassifiedIngredient[];
  pops: ClassifiedIngredient[];
  vehicles: ClassifiedIngredient[];
  hasLarge: boolean;
  hasBulky: boolean;
  hasSmallRound: boolean;
  hasLongItems: boolean;
  hasSpreadable: boolean;
  needsContainer: boolean;
  hasOddNumberItems: boolean;
}

// Template Layout
export interface TemplateLayout {
  style: string;
  negativeSpace: string;
  boardShape: string;
}

// Template Definition
export interface Template {
  name: string;
  conditions: (summary: IngredientSummary) => boolean;
  description: string;
  layout: TemplateLayout;
  rules: string[];
  visualGuide: string;
}

// Visual Rules
export interface VisualRule {
  name: string;
  check: (summary: IngredientSummary) => boolean;
  instruction: string;
  appliesTo?: string[];
}

// =============================================================================
// API Schemas - Derived from Zod
// =============================================================================

// Processed Result Schema
export const ProcessedResultSchema = z.object({
  input: z.union([z.string(), z.array(z.string())]),
  classified: z.array(ClassifiedIngredientSchema),
  summary: z.object({
    total: z.number(),
    anchors: z.array(z.string()),
    fillers: z.array(z.string()),
    pops: z.array(z.string()),
    vehicles: z.array(z.string()),
  }),
  templateSelected: z.string(),
  templateReason: z.string(),
  rulesApplied: z.array(z.string()),
  prompt: z.string(),
});
export type ProcessedResult = z.infer<typeof ProcessedResultSchema>;

// Namer Response Schema
export const NamerResponseSchema = z.object({
  name: z.string(),
  validation: z.string(),
  tip: z.string(),
  wildcard: z.string().optional(),
});
export type NamerResponse = z.infer<typeof NamerResponseSchema>;

// Sketch Response Schema
export const SketchResponseSchema = z.object({
  type: z.enum(['image', 'svg']),
  imageUrl: z.string().optional(),
  svg: z.string().optional(),
  template: z.string().optional(),
  fallback: z.boolean().optional(),
  reason: z.string().optional(),
  rules: z.array(z.string()).optional(),
});
export type SketchResponse = z.infer<typeof SketchResponseSchema>;

// Vibe Check Response Schema
export const VibeCheckResponseSchema = z.object({
  score: z.number().min(0).max(100),
  rank: z.string(),
  compliment: z.string(),
  sticker: z.string(),
  improvement: z.string().optional(),
});
export type VibeCheckResponse = z.infer<typeof VibeCheckResponseSchema>;

// =============================================================================
// Validation Types
// =============================================================================

export const ValidationSeveritySchema = z.enum(['high', 'low', 'clarification']);
export type ValidationSeverity = z.infer<typeof ValidationSeveritySchema>;

export interface ValidationResult {
  valid: boolean;
  severity?: ValidationSeverity;
  category?: string;
  snark?: string;
  suggestion?: string;
  validForms?: string[];
  classification?: {
    found: boolean;
    role: string;
    category: string;
    matched?: string;
    warning?: string;
  };
}

export interface ValidationListResult {
  valid: Array<{ item: string; classification: ValidationResult['classification'] }>;
  invalid: Array<{ item: string; severity: ValidationSeverity; category: string; snark: string }>;
  ambiguous: Array<{ item: string; snark: string; validForms: string[] }>;
  warnings: Array<{ item: string; warning: string }>;
}

// Dinner Match Schema
export const DinnerMatchSchema = z.object({
  name: z.string(),
  tip: z.string(),
  template: z.string(),
  validation: z.string(),
});
export type DinnerMatch = z.infer<typeof DinnerMatchSchema>;

// =============================================================================
// Template Selection Types
// =============================================================================

export const TemplateIdSchema = z.enum(['minimalist', 'anchor', 'snackLine', 'bento', 'wildGraze']);
export type TemplateId = z.infer<typeof TemplateIdSchema>;

export interface TemplateOption {
  id: TemplateId;
  name: string;
  description: string;
  icon: string;
}

// =============================================================================
// App State Types
// =============================================================================
// Note: App state is now managed by useDinnerFlow hook in src/hooks/useDinnerFlow.ts
// Screen type and DinnerState are exported from there.
