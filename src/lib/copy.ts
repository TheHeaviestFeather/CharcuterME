/**
 * CharcuterME - Copy Constants
 * Centralized strings for A/B testing and consistency
 */

export const COPY = {
  // Input Screen
  input: {
    helper: 'Add 3–8 items for best results.',
    cta: 'Name This Disaster',
    ctaDisabled: 'Name My Dinner',
    ctaLoading: 'Working on it...',
    surpriseMe: 'Surprise me',
    placeholder: 'Type an ingredient...',
    duplicateToast: 'Already added',
    categoryLabel: 'Tap to add',
  },

  // Loading
  loading: {
    ctaDisabled: 'Cooking up your masterpiece...',
    quips: [
      'Consulting the council of pickles.',
      'Making chaos look intentional.',
      'Channeling main character energy.',
      'Adjusting the vibe lighting.',
      "Adding a garnish you didn't ask for.",
      "Convincing your snacks they're fancy.",
      'Manifesting artisanal energy.',
      'Turning "this is fine" into "this is art."',
    ],
  },

  // Results
  results: {
    primaryCta: 'Share This Masterpiece',
    copyCaption: 'Copy caption',
    saveImage: 'Save image',
    vibeHook: 'Want a vibe score? Upload your real plate.',
    vibeSubtext: "We'll roast it lovingly.",
    regenerateName: 'Try another name',
    remixWeirder: 'Make it weirder',
    remixClassy: 'Make it classy',
  },
} as const;

// Ingredient suggestion categories - chaotic millennial energy (no duplicates)
export const SUGGESTION_CATEGORIES = {
  Salty: [
    'pickles',
    'chips',
    'pretzels',
    'string cheese',
    'deli meat',
    'olives',
    'goldfish',
    'popcorn',
  ],
  Sweet: [
    'chocolate',
    'cookies',
    'grapes',
    'gummy bears',
    'nutella',
    'fruit snacks',
    'granola',
    'dried mango',
  ],
  Crunch: [
    'crackers',
    'tortilla chips',
    'toast',
    'carrots',
    'cucumbers',
    'croutons',
    'pita chips',
    'apple slices',
  ],
  'Protein-ish': [
    'cheese',
    'hummus',
    'peanut butter',
    'yogurt',
    'pepperoni',
    'hard-boiled egg',
    'deli turkey',
    'cottage cheese',
  ],
  Chaos: [
    'pizza',
    'wine',
    'hot sauce',
    'cereal',
    'sushi',
    'french fries',
    'mystery tupperware',
    'regret',
  ],
} as const;

// For "Surprise me" - chaotic but weirdly good combos
export const SURPRISE_COMBOS = [
  ['cheese', 'crackers', 'grapes', 'wine'],
  ['chips', 'hummus', 'pickles', 'pepperoni'],
  ['peanut butter', 'crackers', 'chocolate', 'apple slices'],
  ['pizza', 'hot sauce', 'string cheese'],
  ['tortilla chips', 'cheese', 'salsa', 'yogurt'],
  ['cereal', 'cookies', 'milk'],
  ['deli meat', 'cheese', 'mustard', 'crackers'],
  ['popcorn', 'chocolate', 'pretzels', 'wine'],
  ['cucumbers', 'hummus', 'olives', 'feta'],
  ['goldfish', 'grapes', 'string cheese'],
  ['sushi', 'edamame', 'wine'],
  ['french fries', 'nuggets', 'hot sauce'],
];
