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
      'Arranging your snacks like they have a LinkedIn.',
      'Adding a garnish you didn\'t ask for.',
      'Turning "girl dinner" into "intentional tapas."',
      'Consulting the council of pickles.',
      'Making chaos look intentional.',
      'Channeling main character energy.',
      'Adjusting the vibe lighting.',
      'Summoning artisanal energy.',
    ],
  },

  // Results
  results: {
    primaryCta: 'Share This Masterpiece',
    copyCaption: 'Copy caption',
    saveImage: 'Save image',
    vibeHook: 'Want a vibe score? Upload your real plate.',
    vibeSubtext: 'We\'ll roast it lovingly.',
    regenerateName: 'Try another name',
    remixWeirder: 'Make it weirder',
    remixClassy: 'Make it classy',
  },
} as const;

// Ingredient suggestion categories - chaotic millennial energy
export const SUGGESTION_CATEGORIES = {
  Salty: ['pickles', 'chips', 'pretzels', 'string cheese', 'deli meat', 'olives', 'goldfish', 'popcorn'],
  Sweet: ['chocolate', 'cookies', 'grapes', 'cereal', 'gummy bears', 'nutella', 'fruit snacks', 'granola'],
  Crunch: ['crackers', 'tortilla chips', 'toast', 'pretzels', 'carrots', 'cucumbers', 'croutons', 'pita chips'],
  'Protein-ish': ['cheese', 'hummus', 'peanut butter', 'yogurt', 'pepperoni', 'hard-boiled egg', 'deli turkey', 'cottage cheese'],
  Chaos: ['cold pizza', 'wine', 'hot sauce', 'leftover takeout', 'cereal at night', 'pickle juice', 'shredded cheese', 'mystery tupperware'],
} as const;

// For "Surprise me" - chaotic but weirdly good combos
export const SURPRISE_COMBOS = [
  ['cheese', 'crackers', 'grapes', 'wine'],
  ['chips', 'hummus', 'pickles', 'pepperoni'],
  ['peanut butter', 'crackers', 'chocolate', 'banana'],
  ['cold pizza', 'hot sauce', 'string cheese'],
  ['tortilla chips', 'shredded cheese', 'salsa', 'yogurt'],
  ['cereal', 'cookies', 'milk', 'regret'],
  ['deli meat', 'cheese', 'mustard', 'crackers'],
  ['popcorn', 'chocolate', 'pretzels', 'wine'],
  ['cucumbers', 'hummus', 'olives', 'feta'],
  ['goldfish', 'grapes', 'string cheese', 'juice box'],
];
