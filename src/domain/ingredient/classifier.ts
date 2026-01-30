/**
 * CharcuterME - Ingredient Classifier
 * Classifies user-input ingredients and summarizes their properties
 */

import type { ClassifiedIngredient, IngredientSummary } from '@/types';
import { parseIngredients } from '@/lib/validation';
import { INGREDIENT_DATABASE, DEFAULT_INGREDIENT } from './database';

// =============================================================================
// String Matching Utilities
// =============================================================================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Check if two strings are a fuzzy match
 */
export function fuzzyMatch(input: string, target: string): boolean {
  return levenshteinDistance(input, target) <= 2 && input.length >= 3;
}

// =============================================================================
// Classification Functions
// =============================================================================

/**
 * Classify ingredients from user input
 * Matches against database with exact, partial, and fuzzy matching
 */
export function classifyIngredients(userInput: string | string[]): ClassifiedIngredient[] {
  const items = Array.isArray(userInput) ? userInput : parseIngredients(userInput);

  return items.map((item) => {
    const normalized = item.toLowerCase().trim();

    // Exact match
    if (INGREDIENT_DATABASE[normalized]) {
      return { original: item, ...INGREDIENT_DATABASE[normalized] };
    }

    // Partial or fuzzy match
    for (const [key, data] of Object.entries(INGREDIENT_DATABASE)) {
      if (normalized.includes(key) || key.includes(normalized) || fuzzyMatch(normalized, key)) {
        return { original: item, ...data, displayName: data.displayName || item };
      }
    }

    // Return default for unknown ingredients
    return { original: item, ...DEFAULT_INGREDIENT, displayName: item };
  });
}

/**
 * Summarize classified ingredients for template selection
 */
export function summarizeIngredients(classified: ClassifiedIngredient[]): IngredientSummary {
  return {
    total: classified.length,
    anchors: classified.filter((i) => i.role === 'anchor'),
    fillers: classified.filter((i) => i.role === 'filler'),
    pops: classified.filter((i) => i.role === 'pop'),
    vehicles: classified.filter((i) => i.role === 'vehicle'),
    hasLarge: classified.some((i) => i.size === 'large'),
    hasBulky: classified.some((i) => i.isBulky),
    hasSmallRound: classified.some((i) => i.isSmallRound),
    hasLongItems: classified.some((i) => i.isLongItem),
    hasSpreadable: classified.some((i) => i.shape === 'spreadable'),
    needsContainer: classified.some((i) => i.needsContainer),
    hasOddNumberItems: classified.some((i) => i.useOddNumbers),
  };
}
