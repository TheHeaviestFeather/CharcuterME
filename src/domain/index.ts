/**
 * CharcuterME - Domain Layer
 * Central export for all domain modules
 */

// Ingredient Domain
export {
  INGREDIENT_DATABASE,
  DEFAULT_INGREDIENT,
  getIngredient,
  getIngredientNames,
  classifyIngredients,
  summarizeIngredients,
  fuzzyMatch,
  validateIngredient,
  NON_FOOD_PATTERNS,
  SNARK_BANK,
  AMBIGUOUS_ITEMS,
} from './ingredient';

// Plating Domain
export {
  TEMPLATES,
  TEMPLATE_LAYOUT_PROMPTS,
  selectTemplate,
  getTemplate,
  getTemplateReason,
  VISUAL_RULES,
  getApplicableRules,
} from './plating';

// Dinner Domain
export {
  findDinner,
  processGirlDinner,
  processGirlDinnerWithTemplate,
  DINNER_DATABASE,
  VALIDATIONS,
} from './dinner';
