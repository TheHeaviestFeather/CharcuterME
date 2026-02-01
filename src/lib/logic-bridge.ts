/**
 * CharcuterME - Logic Bridge (Compatibility Layer)
 *
 * This module now re-exports from the domain layer.
 * All logic has been split into focused domain modules:
 *
 * - src/domain/ingredient/ - Ingredient database, classification, validation
 * - src/domain/plating/    - Templates and visual rules
 * - src/domain/dinner/     - Dinner matching and processing
 *
 * This file is kept for backwards compatibility with existing imports.
 */

// Re-export everything from domain layer
export {
  // Ingredient Domain
  INGREDIENT_DATABASE,
  validateIngredient,
  classifyIngredients,
  summarizeIngredients,

  // Plating Domain
  TEMPLATES,
  VISUAL_RULES,
  selectTemplate,
  getApplicableRules,

  // Dinner Domain
  findDinner,
  processGirlDinner,
  processGirlDinnerWithTemplate,
} from '@/domain';
