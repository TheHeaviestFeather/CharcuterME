/**
 * CharcuterME - Ingredient Domain
 * Barrel export for ingredient-related functionality
 */

export {
  INGREDIENT_DATABASE,
  DEFAULT_INGREDIENT,
  getIngredient,
  getIngredientNames,
} from './database';

export {
  classifyIngredients,
  summarizeIngredients,
  fuzzyMatch,
} from './classifier';

export {
  validateIngredient,
  NON_FOOD_PATTERNS,
  SNARK_BANK,
  AMBIGUOUS_ITEMS,
} from './validator';
