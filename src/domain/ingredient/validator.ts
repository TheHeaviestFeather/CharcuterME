/**
 * CharcuterME - Ingredient Validator
 * Validates ingredients and provides snark for non-food items
 */

import type { ValidationResult } from '@/types';
import { INGREDIENT_DATABASE } from './database';
import { fuzzyMatch } from './classifier';

// =============================================================================
// Non-Food Detection Patterns
// =============================================================================

const NON_FOOD_PATTERNS: Record<string, { pattern: RegExp; responses: string[] }> = {
  objects: {
    pattern: /\b(keys?|phone|wallet|napkin|paper|plastic|brick|rock|stone|glass|plate|bowl|fork|knife|spoon|cup|remote|charger|cable|shoe|sock|shirt|pants|hat|bag|purse|book|pen|pencil)\b/i,
    responses: [
      "That's not food. That's clutter. Let's focus on edibles.",
      "We're flattered you think we can plate anything, but no.",
      "Unless you're making an art installation, let's stick to food.",
    ],
  },
  dangerous: {
    pattern: /\b(poison|bleach|cleaning|detergent|chemical|drug|medication|pill|tide pod|gasoline|antifreeze)\b/i,
    responses: [
      "That's not safe. Please don't put that on any plate.",
      "Absolutely not. That's a hazard, not an ingredient.",
    ],
  },
  abstract: {
    pattern: /\b(love|hate|vibes?|energy|thoughts?|prayers?|feelings?|dreams?|hope|sadness|anger|chaos|nothing)\b/i,
    responses: [
      "We appreciate the energy, but we need actual food.",
      "Wishing for a snack? We still need ingredients.",
      "That's very philosophical, but also inedible.",
    ],
  },
  materials: {
    pattern: /\b(wood|metal|cotton|leather|rubber|concrete|dirt|sand|mud|grass(?! jelly)|lawn)\b/i,
    responses: [
      "That's a building material, not a snack material.",
      "We work with food, not hardware store inventory.",
    ],
  },
};

// =============================================================================
// Snark Responses
// =============================================================================

const SNARK_BANK: Record<string, string> = {
  brick: "We admire the commitment to 'rustic,' but we need actual food.",
  keys: "Those open doors, not appetites. What's actually in your fridge?",
  phone: "The only thing your phone should be on is airplane mode while you eat.",
  napkin: "That's... not an ingredient. That's evidence of eating.",
  nothing: "Well, that's honest. But we need SOMETHING to work with.",
  water: "Hydration is important, but we're building boards, not pools.",
  air: "Minimalism is chic, but even we need ingredients.",
  tears: "Salty, but not the kind we work with.",
  regret: "That's a breakfast emotion, not a dinner ingredient.",
};

// =============================================================================
// Ambiguous Items
// =============================================================================

const AMBIGUOUS_ITEMS: Record<string, { clarification: string; validForms: string[] }> = {
  grass: {
    clarification: "Wheatgrass? Lemongrass? Or like... lawn grass? Be specific!",
    validForms: ['wheatgrass', 'lemongrass', 'grass jelly'],
  },
  flowers: {
    clarification: "Edible flowers are gorgeous! But if you mean backyard roses, that's risky.",
    validForms: ['edible flowers', 'nasturtium', 'lavender', 'rose petals'],
  },
  leaves: {
    clarification: "Basil leaves? Mint leaves? Or random tree leaves?",
    validForms: ['basil leaves', 'mint leaves', 'bay leaves', 'grape leaves'],
  },
};

// =============================================================================
// Validation Function
// =============================================================================

/**
 * Validate a single ingredient
 * Checks for dangerous items, non-food, ambiguous items, and unknown ingredients
 */
export function validateIngredient(input: string): ValidationResult {
  const normalized = input.toLowerCase().trim();

  // Check for dangerous items first
  if (NON_FOOD_PATTERNS.dangerous.pattern.test(normalized)) {
    return {
      valid: false,
      severity: 'high',
      category: 'dangerous',
      snark: NON_FOOD_PATTERNS.dangerous.responses[0],
      suggestion: "Let's stick to things from the grocery store, okay?",
    };
  }

  // Check snark bank for specific items
  for (const [item, response] of Object.entries(SNARK_BANK)) {
    if (normalized.includes(item)) {
      return { valid: false, severity: 'low', category: 'non_food', snark: response };
    }
  }

  // Check ambiguous items
  for (const [item, data] of Object.entries(AMBIGUOUS_ITEMS)) {
    if (normalized === item || normalized.includes(` ${item}`) || normalized.includes(`${item} `)) {
      const isValidForm = data.validForms.some((form) => normalized.includes(form));
      if (!isValidForm) {
        return {
          valid: false,
          severity: 'clarification',
          category: 'ambiguous',
          snark: data.clarification,
          validForms: data.validForms,
        };
      }
    }
  }

  // Check all non-food patterns
  for (const [category, { pattern, responses }] of Object.entries(NON_FOOD_PATTERNS)) {
    if (pattern.test(normalized)) {
      return {
        valid: false,
        severity: 'low',
        category,
        snark: responses[Math.floor(Math.random() * responses.length)],
      };
    }
  }

  // Check if in database (exact or fuzzy)
  if (INGREDIENT_DATABASE[normalized]) {
    return {
      valid: true,
      classification: {
        found: true,
        role: INGREDIENT_DATABASE[normalized].role,
        category: 'known',
        matched: normalized,
      },
    };
  }

  for (const key of Object.keys(INGREDIENT_DATABASE)) {
    if (normalized.includes(key) || key.includes(normalized) || fuzzyMatch(normalized, key)) {
      return {
        valid: true,
        classification: {
          found: true,
          role: INGREDIENT_DATABASE[key].role,
          category: 'known',
          matched: key,
        },
      };
    }
  }

  // Unknown but not obviously non-food
  return {
    valid: true,
    classification: {
      found: false,
      role: 'unknown',
      category: 'unknown',
      warning: "We don't recognize this, but we'll give it a shot!",
    },
  };
}

// Export patterns for potential use in other modules
export { NON_FOOD_PATTERNS, SNARK_BANK, AMBIGUOUS_ITEMS };
