/**
 * CharcuterME - Dinner Analyzer
 * Main processing functions for girl dinner analysis
 */

import type { DinnerMatch, ProcessedResult, ClassifiedIngredient, Template, VisualRule } from '@/types';
import { parseIngredients } from '@/lib/validation';
import { classifyIngredients, summarizeIngredients } from '../ingredient';
import { selectTemplate, getTemplate, getTemplateReason, getApplicableRules, TEMPLATE_LAYOUT_PROMPTS } from '../plating';

// =============================================================================
// Dinner Name Database
// =============================================================================

const DINNER_DATABASE: Record<string, Omit<DinnerMatch, 'validation'>> = {
  'brie': { name: 'Cheese Is A Personality', tip: 'Room temp brie is self-care. Cold brie is a cry for help.', template: 'minimalist' },
  'brie,crackers': { name: 'Fancy But Make It Lazy', tip: 'You\'re one wine glass away from a whole vibe.', template: 'minimalist' },
  'brie,crackers,grapes': { name: 'Vineyard Cosplay', tip: 'This is giving "I have my life together" and we love that for you.', template: 'wildGraze' },
  'hummus': { name: 'Mediterranean Coping Mechanism', tip: 'Olive oil in the well is mandatory. It\'s the law.', template: 'mediterranean' },
  'hummus,pita': { name: 'Dip & Denial', tip: 'Warm pita is a love language. Treat yourself.', template: 'mediterranean' },
  'hummus,pita,carrots': { name: 'Pretending To Be Healthy', tip: 'The carrots cancel out everything. That\'s math.', template: 'mediterranean' },
  'hummus,pita,carrots,cucumber': { name: 'Spa Day Energy', tip: 'Very hydrated. Very unbothered. Very you.', template: 'mediterranean' },
  'chips,salsa': { name: 'Carbs & Consequences', tip: 'Salsa is a vegetable. Don\'t let anyone tell you otherwise.', template: 'snackAttack' },
  'chips,salsa,guacamole': { name: 'Guac Is Extra & So Are You', tip: 'Double-dipping is valid when you live your truth.', template: 'snackAttack' },
  'chips,guacamole': { name: 'Green Flag Energy', tip: 'Avocado toast could never. This is superior.', template: 'snackAttack' },
  'chips,queso': { name: 'Liquid Gold Therapy', tip: 'Microwave 20 seconds. Or don\'t. Chaos is also valid.', template: 'snackAttack' },
  'pizza': { name: 'Yesterday\'s Choices', tip: 'Cold pizza at any hour is a lifestyle, not a problem.', template: 'pizzaNight' },
  'leftover pizza': { name: 'The Remix Era', tip: 'Day-old pizza hits different and science agrees.', template: 'pizzaNight' },
  'leftover pizza,grapes': { name: 'Balanced As All Things Should Be', tip: 'Grapes = fruit = health. Logic checks out.', template: 'pizzaNight' },
  'cheese,crackers': { name: 'Lunchable But Make It 30', tip: 'This is adult behavior and we\'re here for it.', template: 'minimalist' },
  'cheese': { name: 'The Audacity', tip: 'Just cheese? Honestly iconic. No notes.', template: 'minimalist' },
  'grapes': { name: 'Minimalist Queen', tip: 'Sometimes dinner is just grapes. That\'s called efficiency.', template: 'minimalist' },
  'string cheese': { name: 'Inner Child Healing', tip: 'Peel it slowly. You\'ve earned this meditative moment.', template: 'casual' },
  'pickles': { name: 'Sodium & Serenity', tip: 'Pickle people just get it. No explanation needed.', template: 'minimalist' },
  'olives': { name: 'Main Character In Rome', tip: 'You\'re basically on vacation. Mentally, at least.', template: 'minimalist' },
  'wine': { name: 'Grapes & Consequences', tip: 'It\'s fruit. Fermented, but still fruit.', template: 'minimalist' },
  'wine,cheese': { name: 'Wine Mom Starter Pack', tip: 'This pairing has been getting people through life for centuries.', template: 'minimalist' },
  'crackers': { name: 'Carb Loading', tip: 'You\'re basically an athlete now.', template: 'minimalist' },
  'yogurt': { name: 'Pretending To Adult', tip: 'Probiotics are basically a personality trait at this point.', template: 'minimalist' },
  'cereal': { name: 'Breakfast For Dinner Energy', tip: 'Rules are a social construct. Eat your cereal.', template: 'casual' },
};

const VALIDATIONS = [
  "You looked in your fridge and said 'this is fine.' Iconic behavior.",
  "This is what peak performance looks like. Don't let anyone tell you different.",
  "Your therapist would either be proud or concerned. Either way, valid.",
  "The fridge provided. You listened. Self-care unlocked.",
  "Dinner is a social construct. You're deconstructing it. Very avant-garde.",
  "No notes. Just vibes. Just you thriving.",
  "This is giving 'I survived another day' and honestly? Celebrate that.",
  "Carbs are just a hug for your insides. You deserve hugs.",
];

// Performance limits to prevent O(2^n) explosions
const MAX_INGREDIENTS_FOR_COMBINATIONS = 10;
const MAX_COMBINATION_LENGTH = 5;

// =============================================================================
// Combination Generator
// =============================================================================

function combinations<T>(arr: T[], len: number): T[][] {
  if (len === 1) return arr.map((x) => [x]);
  const result: T[][] = [];
  for (let i = 0; i <= arr.length - len; i++) {
    for (const tail of combinations(arr.slice(i + 1), len - 1)) {
      result.push([arr[i], ...tail]);
    }
  }
  return result;
}

// =============================================================================
// Dinner Finder
// =============================================================================

/**
 * Find a matching dinner name for the given ingredients
 */
export function findDinner(inputString: string): DinnerMatch {
  // Limit input size for performance
  const items = parseIngredients(inputString).sort().slice(0, MAX_INGREDIENTS_FOR_COMBINATIONS);
  const key = items.join(',');
  const validation = VALIDATIONS[Math.floor(Math.random() * VALIDATIONS.length)];

  // Exact match
  if (DINNER_DATABASE[key]) {
    return { ...DINNER_DATABASE[key], validation };
  }

  // Try subsets (longest first, but limited to prevent combinatorial explosion)
  const maxLen = Math.min(items.length, MAX_COMBINATION_LENGTH);
  for (let len = maxLen; len > 0; len--) {
    for (const combo of combinations(items, len)) {
      const comboKey = combo.join(',');
      if (DINNER_DATABASE[comboKey]) {
        return { ...DINNER_DATABASE[comboKey], validation };
      }
    }
  }

  // Try individual items
  for (const item of items) {
    for (const [dbKey, value] of Object.entries(DINNER_DATABASE)) {
      if (dbKey.includes(item)) {
        return { ...value, validation };
      }
    }
  }

  // Default
  return { name: 'The Spread', tip: 'The couch is the correct location.', template: 'casual', validation };
}

// =============================================================================
// Image Prompt Builders
// =============================================================================

/**
 * Build image prompt with default template
 * Style: Casual phone photo aesthetic (millennial apartment vibes)
 */
export function buildImagePrompt(
  classified: ClassifiedIngredient[],
  _template: Template,
  _rules: VisualRule[]
): string {
  const ingredientNames = classified.map((i) => i.displayName).join(', ');
  const count = classified.length;

  return `Casual phone photo of late night snack, slightly messy, authentic millennial apartment vibes.

A mismatched plate or paper plate with EXACTLY ${count} food items: ${ingredientNames}. Arranged haphazardly like someone just threw them on.

Setting: Cluttered coffee table or kitchen counter. Visible in background: half-empty wine glass, phone charger, maybe a laptop edge. Warm lamp lighting mixed with blue TV glow.
Style: Imperfect composition, slight motion blur okay, looks like it was taken at 11pm before eating. NOT Instagram perfect - more "sent this to my group chat" energy.

STRICT RULES:
- The plate must contain ONLY these ${count} items: ${ingredientNames}
- Do NOT add any other food, garnishes, herbs, or extras
- NO humans, hands, people, or body parts in the image
- No text or watermarks
- NOT overly styled or curated - embrace the chaos`.trim();
}

/**
 * Build image prompt with template-specific layout instructions
 * Style: Casual phone photo aesthetic with layout variation
 */
export function buildImagePromptWithTemplate(classified: ClassifiedIngredient[], templateId: string): string {
  const ingredientNames = classified.map((i) => i.displayName).join(', ');
  const count = classified.length;
  const layoutPrompt = TEMPLATE_LAYOUT_PROMPTS[templateId] || TEMPLATE_LAYOUT_PROMPTS.wildGraze;

  return `Casual phone photo of late night snack, slightly messy, authentic millennial apartment vibes.

A mismatched plate or paper plate with EXACTLY ${count} food items: ${ingredientNames}.
${layoutPrompt}

Setting: Cluttered coffee table or kitchen counter. Warm lamp lighting mixed with blue TV glow.
Style: Imperfect composition, slight motion blur okay, looks like it was taken at 11pm before eating. NOT Instagram perfect - more "sent this to my group chat" energy.

STRICT RULES:
- The plate must contain ONLY these ${count} items: ${ingredientNames}
- Do NOT add any other food, garnishes, herbs, or extras
- NO humans, hands, people, or body parts in the image
- No text or watermarks
- NOT overly styled or curated - embrace the chaos`.trim();
}

// =============================================================================
// Main Processing Functions
// =============================================================================

/**
 * Process user input and return full analysis result
 */
export function processGirlDinner(userInput: string | string[]): ProcessedResult {
  const classified = classifyIngredients(userInput);
  const summary = summarizeIngredients(classified);
  const template = selectTemplate(summary);
  const rules = getApplicableRules(summary);
  const prompt = buildImagePrompt(classified, template, rules);

  return {
    input: userInput,
    classified,
    summary: {
      total: summary.total,
      anchors: summary.anchors.map((a) => a.displayName),
      fillers: summary.fillers.map((f) => f.displayName),
      pops: summary.pops.map((p) => p.displayName),
      vehicles: summary.vehicles.map((v) => v.displayName),
    },
    templateSelected: template.name,
    templateReason: getTemplateReason(summary, template),
    rulesApplied: rules.map((r) => r.name),
    prompt,
  };
}

/**
 * Process with user-selected template
 */
export function processGirlDinnerWithTemplate(
  userInput: string | string[],
  templateId: string
): ProcessedResult {
  const classified = classifyIngredients(userInput);
  const summary = summarizeIngredients(classified);
  const template = getTemplate(templateId);
  const rules = getApplicableRules(summary);
  const prompt = buildImagePromptWithTemplate(classified, templateId);

  return {
    input: userInput,
    classified,
    summary: {
      total: summary.total,
      anchors: summary.anchors.map((a) => a.displayName),
      fillers: summary.fillers.map((f) => f.displayName),
      pops: summary.pops.map((p) => p.displayName),
      vehicles: summary.vehicles.map((v) => v.displayName),
    },
    templateSelected: template.name,
    templateReason: `You chose: ${template.description}`,
    rulesApplied: rules.map((r) => r.name),
    prompt,
  };
}

// Export database for potential UI features
export { DINNER_DATABASE, VALIDATIONS };
