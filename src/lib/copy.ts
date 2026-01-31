/**
 * CharcuterME - Copy Constants
 * Centralized strings for A/B testing and consistency
 */

export const COPY = {
  // Input Screen
  input: {
    helper: 'Add 3–8 items for best results.',
    previewEmpty: 'Add 3 items to unlock the chaos.',
    previewLabel: 'Preview (updates as you add)',
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

// Ingredient suggestion categories
export const SUGGESTION_CATEGORIES = {
  Salty: ['olives', 'prosciutto', 'salami', 'feta', 'anchovies', 'pickles', 'chips', 'pretzels'],
  Sweet: ['grapes', 'honey', 'chocolate', 'berries', 'dates', 'jam', 'dried fruit', 'cookies'],
  Crunch: ['crackers', 'nuts', 'breadsticks', 'crostini', 'celery', 'carrots', 'toast', 'chips'],
  'Protein-ish': ['cheese', 'brie', 'hummus', 'eggs', 'salami', 'prosciutto', 'yogurt', 'edamame'],
  Chaos: ['pizza', 'wine', 'regret', 'hot sauce', 'leftovers', 'ice cream', 'cereal', 'pickles'],
} as const;

// For "Surprise me" - curated combos that work well
export const SURPRISE_COMBOS = [
  ['brie', 'grapes', 'crackers', 'honey'],
  ['olives', 'salami', 'cheese', 'wine'],
  ['hummus', 'carrots', 'pita', 'feta'],
  ['chocolate', 'berries', 'nuts', 'wine'],
  ['pickles', 'cheese', 'crackers', 'mustard'],
  ['prosciutto', 'melon', 'mozzarella', 'basil'],
  ['chips', 'salsa', 'guacamole', 'cheese'],
  ['yogurt', 'honey', 'granola', 'berries'],
];
