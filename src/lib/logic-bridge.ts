/**
 * CharcuterME - Logic Bridge System v2.0
 * The "Creative Director" Layer
 *
 * This module classifies ingredients, validates input, selects templates,
 * and builds structured prompts. Includes non-food detection and snark responses.
 *
 * Flow: User Input -> Validation -> Classification -> Template Selection -> Prompt -> AI
 */

import type {
  IngredientData,
  ClassifiedIngredient,
  IngredientSummary,
  Template,
  VisualRule,
  ProcessedResult,
  ValidationResult,
  DinnerMatch,
} from '@/types';

// =============================================================================
// PART 1: NON-FOOD DETECTION & SNARK
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
      "Manifesting a snack? We still need ingredients.",
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
// PART 2: INGREDIENT CLASSIFICATION DATABASE
// =============================================================================

const INGREDIENT_DATABASE: Record<string, IngredientData> = {
  // CHEESES
  brie: { role: 'anchor', size: 'large', shape: 'round', color: 'cream', platingStyle: 'spread', displayName: 'Brie Wheel', proTip: 'Let sit out 10 minutes to soften' },
  camembert: { role: 'anchor', size: 'large', shape: 'round', color: 'cream', platingStyle: 'spread', displayName: 'Camembert', proTip: 'Score the top for oozy goodness' },
  cheddar: { role: 'anchor', size: 'medium', shape: 'cube', color: 'orange', platingStyle: 'stack', displayName: 'Cheddar Cubes', proTip: 'Stack in a small pyramid' },
  gouda: { role: 'anchor', size: 'medium', shape: 'wedge', color: 'yellow', platingStyle: 'scatter', displayName: 'Gouda Wedges', proTip: 'Break into rustic chunks' },
  'goat cheese': { role: 'anchor', size: 'medium', shape: 'log', color: 'white', platingStyle: 'spread', displayName: 'Goat Cheese', proTip: 'Crumble loosely or slice the log' },
  feta: { role: 'filler', size: 'small', shape: 'cube', color: 'white', platingStyle: 'scatter', displayName: 'Feta Crumbles', proTip: 'Crumble by hand for organic shapes' },
  mozzarella: { role: 'anchor', size: 'medium', shape: 'round', color: 'white', platingStyle: 'cluster', displayName: 'Fresh Mozz', proTip: "Tear by hand, don't slice" },
  'cream cheese': { role: 'anchor', size: 'medium', shape: 'spreadable', color: 'white', platingStyle: 'spread', displayName: 'Cream Cheese', proTip: 'Spread thick in one spot' },
  'string cheese': { role: 'filler', size: 'small', shape: 'long', color: 'white', platingStyle: 'fan', displayName: 'String Cheese', proTip: 'Peel into strips for fancy vibes', isLongItem: true },
  parmesan: { role: 'filler', size: 'small', shape: 'shard', color: 'yellow', platingStyle: 'scatter', displayName: 'Parm Shards', proTip: 'Break into jagged shards' },
  cheese: { role: 'anchor', size: 'medium', shape: 'cube', color: 'yellow', platingStyle: 'stack', displayName: 'Cheese', proTip: 'Cut into bite-sized pieces' },
  manchego: { role: 'anchor', size: 'medium', shape: 'wedge', color: 'yellow', platingStyle: 'fan', displayName: 'Manchego', proTip: 'Cut into thin triangular slices' },
  'blue cheese': { role: 'anchor', size: 'medium', shape: 'wedge', color: 'white', platingStyle: 'scatter', displayName: 'Blue Cheese', proTip: 'Crumble for drama' },
  burrata: { role: 'anchor', size: 'large', shape: 'round', color: 'white', platingStyle: 'spread', displayName: 'Burrata', proTip: 'Tear open to show the creamy center' },

  // PROTEINS
  salami: { role: 'filler', size: 'small', shape: 'round', color: 'red', platingStyle: 'fan', displayName: 'Salami', proTip: 'Fold in half or roll into cones' },
  prosciutto: { role: 'filler', size: 'medium', shape: 'flat', color: 'pink', platingStyle: 'pile', displayName: 'Prosciutto', proTip: 'Loosely bunch into ribbons, never lay flat' },
  pepperoni: { role: 'filler', size: 'small', shape: 'round', color: 'red', platingStyle: 'scatter', displayName: 'Pepperoni', proTip: 'Overlap in a snaking line', isSmallRound: true },
  ham: { role: 'filler', size: 'medium', shape: 'flat', color: 'pink', platingStyle: 'pile', displayName: 'Ham', proTip: 'Fold into quarters and stack' },
  turkey: { role: 'filler', size: 'medium', shape: 'flat', color: 'tan', platingStyle: 'pile', displayName: 'Turkey', proTip: 'Roll loosely into cylinders' },
  'smoked salmon': { role: 'anchor', size: 'medium', shape: 'flat', color: 'orange', platingStyle: 'pile', displayName: 'Smoked Salmon', proTip: 'Drape elegantly, show the color' },
  bacon: { role: 'filler', size: 'small', shape: 'long', color: 'brown', platingStyle: 'pile', displayName: 'Bacon', proTip: 'Break into pieces or leave whole', isLongItem: true },
  chorizo: { role: 'filler', size: 'small', shape: 'round', color: 'red', platingStyle: 'scatter', displayName: 'Chorizo', proTip: 'Slice thin on an angle' },
  coppa: { role: 'filler', size: 'small', shape: 'round', color: 'red', platingStyle: 'fan', displayName: 'Coppa', proTip: 'Fold into elegant rosettes' },

  // FRUITS
  grapes: { role: 'pop', size: 'small', shape: 'round', color: 'purple', platingStyle: 'cluster', displayName: 'Grapes', proTip: 'Keep in small clusters of 3-5', isSmallRound: true, useOddNumbers: true },
  apple: { role: 'filler', size: 'medium', shape: 'flat', color: 'red', platingStyle: 'fan', displayName: 'Apple Slices', proTip: 'Fan in an arc, skin side up' },
  strawberries: { role: 'pop', size: 'small', shape: 'irregular', color: 'red', platingStyle: 'scatter', displayName: 'Strawberries', proTip: 'Halve to show the red interior', isSmallRound: true, useOddNumbers: true },
  blueberries: { role: 'pop', size: 'tiny', shape: 'round', color: 'blue', platingStyle: 'scatter', displayName: 'Blueberries', proTip: 'Scatter in gaps as color pops', isSmallRound: true, useOddNumbers: true },
  raspberries: { role: 'pop', size: 'tiny', shape: 'round', color: 'red', platingStyle: 'scatter', displayName: 'Raspberries', proTip: 'Use to fill small gaps', isSmallRound: true, useOddNumbers: true },
  figs: { role: 'pop', size: 'small', shape: 'round', color: 'purple', platingStyle: 'cluster', displayName: 'Figs', proTip: 'Quarter to show the pink interior', useOddNumbers: true },
  berries: { role: 'pop', size: 'tiny', shape: 'round', color: 'mixed', platingStyle: 'scatter', displayName: 'Mixed Berries', proTip: 'Scatter in gaps', isSmallRound: true, useOddNumbers: true },
  pear: { role: 'filler', size: 'medium', shape: 'flat', color: 'green', platingStyle: 'fan', displayName: 'Pear Slices', proTip: 'Slice thin and fan out' },

  // VEGETABLES
  cucumber: { role: 'filler', size: 'small', shape: 'round', color: 'green', platingStyle: 'fan', displayName: 'Cucumber', proTip: 'Slice on an angle for larger ovals' },
  carrots: { role: 'filler', size: 'small', shape: 'long', color: 'orange', platingStyle: 'fan', displayName: 'Carrot Sticks', proTip: 'Stand upright in a cup or fan out', isLongItem: true },
  'cherry tomatoes': { role: 'pop', size: 'small', shape: 'round', color: 'red', platingStyle: 'scatter', displayName: 'Cherry Tomatoes', proTip: 'Halve some, leave others whole', isSmallRound: true, useOddNumbers: true },
  tomatoes: { role: 'filler', size: 'medium', shape: 'round', color: 'red', platingStyle: 'fan', displayName: 'Tomatoes', proTip: 'Slice thick for structure' },
  celery: { role: 'filler', size: 'small', shape: 'long', color: 'green', platingStyle: 'fan', displayName: 'Celery', proTip: 'Fill the groove with spread', isLongItem: true },
  pickles: { role: 'pop', size: 'small', shape: 'long', color: 'green', platingStyle: 'scatter', displayName: 'Pickles', proTip: 'Slice lengthwise into spears' },
  olives: { role: 'pop', size: 'small', shape: 'round', color: 'green', platingStyle: 'scatter', displayName: 'Olives', proTip: 'Scatter in odd-numbered clusters', isSmallRound: true, useOddNumbers: true },
  radishes: { role: 'pop', size: 'small', shape: 'round', color: 'red', platingStyle: 'scatter', displayName: 'Radishes', proTip: 'Slice thin or halve', isSmallRound: true },
  peppers: { role: 'filler', size: 'small', shape: 'long', color: 'mixed', platingStyle: 'fan', displayName: 'Peppers', proTip: 'Slice into strips' },

  // CARBS / VEHICLES
  crackers: { role: 'vehicle', size: 'small', shape: 'flat', color: 'tan', platingStyle: 'fan', displayName: 'Crackers', proTip: 'Fan in an arc or stack vertically', isLongItem: true },
  bread: { role: 'vehicle', size: 'medium', shape: 'irregular', color: 'tan', platingStyle: 'pile', displayName: 'Bread', proTip: 'Tear by hand for rustic look' },
  baguette: { role: 'vehicle', size: 'medium', shape: 'round', color: 'tan', platingStyle: 'fan', displayName: 'Baguette', proTip: 'Slice on angle, toast optional', isLongItem: true },
  pita: { role: 'vehicle', size: 'medium', shape: 'flat', color: 'tan', platingStyle: 'fan', displayName: 'Pita', proTip: 'Cut into triangles, stack or fan' },
  chips: { role: 'vehicle', size: 'small', shape: 'irregular', color: 'tan', platingStyle: 'pile', displayName: 'Chips', proTip: 'Pile loosely' },
  pretzels: { role: 'vehicle', size: 'small', shape: 'irregular', color: 'brown', platingStyle: 'scatter', displayName: 'Pretzels', proTip: 'Scatter around edges' },
  'tortilla chips': { role: 'vehicle', size: 'small', shape: 'flat', color: 'tan', platingStyle: 'fan', displayName: 'Tortilla Chips', proTip: 'Fan around a dip bowl' },
  crostini: { role: 'vehicle', size: 'small', shape: 'flat', color: 'tan', platingStyle: 'fan', displayName: 'Crostini', proTip: 'Arrange in overlapping rows' },
  breadsticks: { role: 'vehicle', size: 'small', shape: 'long', color: 'tan', platingStyle: 'fan', displayName: 'Breadsticks', proTip: 'Stand upright in a glass', isLongItem: true },

  // DIPS & SPREADS
  hummus: { role: 'anchor', size: 'medium', shape: 'spreadable', color: 'tan', platingStyle: 'spread', displayName: 'Hummus', proTip: 'Swirl and make a well for olive oil', needsContainer: true },
  salsa: { role: 'anchor', size: 'medium', shape: 'spreadable', color: 'red', platingStyle: 'spread', displayName: 'Salsa', proTip: 'Serve in a small bowl', needsContainer: true },
  guacamole: { role: 'anchor', size: 'medium', shape: 'spreadable', color: 'green', platingStyle: 'spread', displayName: 'Guac', proTip: 'Pile high, it oxidizes if spread thin', needsContainer: true },
  tzatziki: { role: 'anchor', size: 'medium', shape: 'spreadable', color: 'white', platingStyle: 'spread', displayName: 'Tzatziki', proTip: 'Drizzle with olive oil', needsContainer: true },
  ranch: { role: 'filler', size: 'small', shape: 'spreadable', color: 'white', platingStyle: 'spread', displayName: 'Ranch', proTip: 'Small bowl or ramekin', needsContainer: true },
  mustard: { role: 'filler', size: 'small', shape: 'spreadable', color: 'yellow', platingStyle: 'spread', displayName: 'Mustard', proTip: 'Dollop or small dish', needsContainer: true },
  'peanut butter': { role: 'anchor', size: 'medium', shape: 'spreadable', color: 'tan', platingStyle: 'spread', displayName: 'Peanut Butter', proTip: 'Big scoop, eat directly' },
  jam: { role: 'filler', size: 'small', shape: 'spreadable', color: 'red', platingStyle: 'spread', displayName: 'Jam', proTip: 'Dollop near cheese' },
  'fig jam': { role: 'filler', size: 'small', shape: 'spreadable', color: 'purple', platingStyle: 'spread', displayName: 'Fig Jam', proTip: 'Small dollop near cheese' },
  honey: { role: 'pop', size: 'tiny', shape: 'spreadable', color: 'gold', platingStyle: 'spread', displayName: 'Honey', proTip: 'Drizzle over cheese at the end' },
  queso: { role: 'anchor', size: 'medium', shape: 'spreadable', color: 'yellow', platingStyle: 'spread', displayName: 'Queso', proTip: 'Warm bowl, keep it melty', needsContainer: true },

  // NUTS
  almonds: { role: 'filler', size: 'tiny', shape: 'irregular', color: 'tan', platingStyle: 'scatter', displayName: 'Almonds', proTip: 'Scatter in gaps, odd numbers', isSmallRound: true, useOddNumbers: true },
  walnuts: { role: 'filler', size: 'tiny', shape: 'irregular', color: 'brown', platingStyle: 'scatter', displayName: 'Walnuts', proTip: 'Break into smaller pieces', useOddNumbers: true },
  cashews: { role: 'filler', size: 'tiny', shape: 'irregular', color: 'tan', platingStyle: 'scatter', displayName: 'Cashews', proTip: 'Scatter liberally', useOddNumbers: true },
  nuts: { role: 'filler', size: 'tiny', shape: 'irregular', color: 'brown', platingStyle: 'scatter', displayName: 'Mixed Nuts', proTip: 'Fill gaps at the end', useOddNumbers: true },
  pistachios: { role: 'filler', size: 'tiny', shape: 'irregular', color: 'green', platingStyle: 'scatter', displayName: 'Pistachios', proTip: 'Scatter for color', useOddNumbers: true },
  pecans: { role: 'filler', size: 'tiny', shape: 'irregular', color: 'brown', platingStyle: 'scatter', displayName: 'Pecans', proTip: 'Toast for extra flavor', useOddNumbers: true },

  // SWEETS & EXTRAS
  chocolate: { role: 'pop', size: 'small', shape: 'irregular', color: 'brown', platingStyle: 'scatter', displayName: 'Chocolate', proTip: 'Break into jagged shards' },
  'dark chocolate': { role: 'pop', size: 'small', shape: 'irregular', color: 'brown', platingStyle: 'scatter', displayName: 'Dark Chocolate', proTip: 'Snap into irregular pieces' },

  // GIRL DINNER CLASSICS
  pizza: { role: 'anchor', size: 'large', shape: 'flat', color: 'mixed', platingStyle: 'pile', displayName: 'Pizza', proTip: 'Stack slices or fold, no shame', isBulky: true },
  'leftover pizza': { role: 'anchor', size: 'large', shape: 'flat', color: 'mixed', platingStyle: 'pile', displayName: 'Leftover Pizza', proTip: 'Cold is valid', isBulky: true },
  yogurt: { role: 'anchor', size: 'medium', shape: 'spreadable', color: 'white', platingStyle: 'spread', displayName: 'Yogurt', proTip: 'In bowl or eaten from container', needsContainer: true },
  granola: { role: 'filler', size: 'tiny', shape: 'irregular', color: 'brown', platingStyle: 'scatter', displayName: 'Granola', proTip: 'Sprinkle on top of yogurt' },

  // HERBS (garnish)
  rosemary: { role: 'pop', size: 'tiny', shape: 'long', color: 'green', platingStyle: 'scatter', displayName: 'Rosemary', proTip: 'Tuck sprigs into gaps' },
  thyme: { role: 'pop', size: 'tiny', shape: 'long', color: 'green', platingStyle: 'scatter', displayName: 'Thyme', proTip: 'Scatter small sprigs' },
  basil: { role: 'pop', size: 'tiny', shape: 'flat', color: 'green', platingStyle: 'scatter', displayName: 'Basil', proTip: 'Tear leaves, never cut' },
  mint: { role: 'pop', size: 'tiny', shape: 'flat', color: 'green', platingStyle: 'scatter', displayName: 'Mint', proTip: 'Fresh accent near fruit' },
};

const DEFAULT_INGREDIENT: IngredientData = {
  role: 'filler',
  size: 'medium',
  shape: 'irregular',
  color: 'neutral',
  platingStyle: 'pile',
  displayName: 'Unknown',
  proTip: 'Place where it fits',
};

// =============================================================================
// PART 3: VALIDATION FUNCTIONS
// =============================================================================

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator);
    }
  }
  return matrix[b.length][a.length];
}

function fuzzyMatch(input: string, target: string): boolean {
  return levenshteinDistance(input, target) <= 2 && input.length >= 3;
}

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
      const isValidForm = data.validForms.some(form => normalized.includes(form));
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
    return { valid: true, classification: { found: true, role: INGREDIENT_DATABASE[normalized].role, category: 'known', matched: normalized } };
  }

  for (const key of Object.keys(INGREDIENT_DATABASE)) {
    if (normalized.includes(key) || key.includes(normalized) || fuzzyMatch(normalized, key)) {
      return { valid: true, classification: { found: true, role: INGREDIENT_DATABASE[key].role, category: 'known', matched: key } };
    }
  }

  // Unknown but not obviously non-food
  return {
    valid: true,
    classification: { found: false, role: 'unknown', category: 'unknown', warning: "We don't recognize this, but we'll give it a shot!" },
  };
}

export function parseIngredients(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[,\n]+/)
    .map(item => item.trim().replace(/^(a |an |some |the |my |fresh |organic |homemade )/i, ''))
    .filter(item => item.length > 0)
    .filter((item, index, self) => self.indexOf(item) === index);
}

// =============================================================================
// PART 4: DINNER NAME DATABASE
// =============================================================================

const DINNER_DATABASE: Record<string, Omit<DinnerMatch, 'validation'>> = {
  'brie': { name: 'The French Affair', tip: 'Let the brie sit out 10 minutes.', template: 'minimalist' },
  'brie,crackers': { name: 'The French Affair', tip: 'Let the brie sit out 10 minutes.', template: 'minimalist' },
  'brie,crackers,grapes': { name: 'The French Affair', tip: 'Fold the salami into little roses.', template: 'wildGraze' },
  'hummus': { name: 'The Mediterranean Moment', tip: 'Make a well for olive oil.', template: 'mediterranean' },
  'hummus,pita': { name: 'The Mediterranean Moment', tip: 'Warm the pita 30 seconds.', template: 'mediterranean' },
  'hummus,pita,carrots': { name: 'The Healthy-ish Hour', tip: 'Carrots cancel out everything else.', template: 'mediterranean' },
  'hummus,pita,carrots,cucumber': { name: 'Spa Day Snacks', tip: 'Cucumber hydrates.', template: 'mediterranean' },
  'chips,salsa': { name: 'Fiesta Mode', tip: 'Salsa counts as a vegetable.', template: 'snackAttack' },
  'chips,salsa,guacamole': { name: "Guac O'Clock", tip: 'Double-dipping allowed.', template: 'snackAttack' },
  'chips,guacamole': { name: 'The Green Light', tip: 'Avocado is self-care.', template: 'snackAttack' },
  'chips,queso': { name: 'Cheese Pls', tip: 'Microwave for 20 seconds. Life-changing.', template: 'snackAttack' },
  'pizza': { name: 'The 11pm Compromise', tip: 'Cold pizza is valid.', template: 'pizzaNight' },
  'leftover pizza': { name: 'The Remix', tip: 'Day-old hits different.', template: 'pizzaNight' },
  'leftover pizza,grapes': { name: 'The Balance', tip: 'Grapes for emotional balance.', template: 'pizzaNight' },
  'cheese,crackers': { name: 'Adult Lunchable', tip: 'Couch is correct location.', template: 'minimalist' },
  'cheese': { name: 'The Audacity', tip: 'Just cheese? Respect.', template: 'minimalist' },
  'grapes': { name: 'The Minimalist', tip: 'Sometimes grapes are dinner.', template: 'minimalist' },
  'string cheese': { name: 'Inner Child Energy', tip: 'Peel it. You earned this.', template: 'casual' },
  'pickles': { name: 'The Pickle Person', tip: 'Pickle people understand.', template: 'minimalist' },
  'olives': { name: 'Mediterranean Vibes', tip: "You're basically in Italy.", template: 'minimalist' },
};

const VALIDATIONS = [
  "That's a real dinner. You're doing great.",
  "This is self-care. You earned this.",
  "The fridge provides. You listened.",
  "Dinner is whatever you say it is.",
  "You showed up for yourself today.",
  "No judgment here. Just vibes.",
];

export function findDinner(inputString: string): DinnerMatch {
  const items = parseIngredients(inputString).sort();
  const key = items.join(',');
  const validation = VALIDATIONS[Math.floor(Math.random() * VALIDATIONS.length)];

  // Exact match
  if (DINNER_DATABASE[key]) {
    return { ...DINNER_DATABASE[key], validation };
  }

  // Try subsets (longest first)
  for (let len = items.length; len > 0; len--) {
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

function combinations<T>(arr: T[], len: number): T[][] {
  if (len === 1) return arr.map(x => [x]);
  const result: T[][] = [];
  for (let i = 0; i <= arr.length - len; i++) {
    for (const tail of combinations(arr.slice(i + 1), len - 1)) {
      result.push([arr[i], ...tail]);
    }
  }
  return result;
}

// =============================================================================
// PART 5: INGREDIENT CLASSIFIER
// =============================================================================

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

    // Return default
    return { original: item, ...DEFAULT_INGREDIENT, displayName: item };
  });
}

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

// =============================================================================
// PART 6: TEMPLATE DEFINITIONS
// =============================================================================

const TEMPLATES: Record<string, Template> = {
  minimalist: {
    name: 'The Minimalist',
    conditions: (s) => s.total <= 3,
    description: 'Clean and simple. Each item gets breathing room.',
    layout: { style: 'asymmetric', negativeSpace: '50%+', boardShape: 'round plate' },
    rules: ['Place anchor off-center (rule of thirds)', 'Leave at least 40% of plate empty', 'Use odd numbers for grouped items', 'Create diagonal tension between items'],
    visualGuide: '+---------------------+\n|     +---+     o     |\n|     | A |           |\n|     +---+   o o     |\n+---------------------+',
  },
  anchor: {
    name: 'The Anchor',
    conditions: (s) => (s.hasLarge || s.hasBulky) && s.anchors.length === 1,
    description: 'One big thing surrounded by supporting cast.',
    layout: { style: 'radial', negativeSpace: '30%', boardShape: 'round plate' },
    rules: ['Large item commands the center', 'Smaller items orbit around the anchor', 'Create visual rays extending outward', 'Pops fill the perimeter'],
    visualGuide: '+---------------------+\n|  o    +-----+    o  |\n|       |  A  |       |\n|  o    +-----+    o  |\n+---------------------+',
  },
  snackLine: {
    name: 'The Snack Line',
    conditions: (s) => s.hasSpreadable && s.vehicles.length >= 1 && s.total <= 5,
    description: 'A dip and its entourage. Linear and functional.',
    layout: { style: 'linear', negativeSpace: '20%', boardShape: 'rectangular' },
    rules: ['Dip anchors one end', 'Dippers fan toward the other end', 'Create a gradient of item sizes', 'Everything should be grabbable'],
    visualGuide: '+---------------------------------+\n|  [DIP]  ===  ===  ===  . . .   |\n+---------------------------------+',
  },
  bento: {
    name: 'The Bento',
    conditions: (s) => s.total >= 4 && s.total <= 6 && s.anchors.length >= 2,
    description: 'Organized zones. Distinct islands of deliciousness.',
    layout: { style: 'grid', negativeSpace: '15%', boardShape: 'rectangular' },
    rules: ['Each food type gets its own island', 'Keep similar items together', 'Maintain small gaps between zones', 'Diagonal corners should contrast in color'],
    visualGuide: '+---------------------+\n| [A]     [F]         |\n| [V]     [P P]       |\n+---------------------+',
  },
  wildGraze: {
    name: 'The Wild Graze',
    conditions: (s) => s.total >= 4,
    description: 'Organic S-curve flow. The classic girl dinner spread.',
    layout: { style: 's-curve', negativeSpace: '25%', boardShape: 'round board' },
    rules: ['Create an S-curve with long items', 'Anchor items at curve endpoints', 'Scatter pops in odd-number clusters', 'Fill gaps with tiny items last', 'Nothing should be perfectly aligned'],
    visualGuide: '+-------------------------+\n|   [A]  ===              |\n|      ===  o o   [A]     |\n+-------------------------+',
  },
};

// =============================================================================
// PART 7: TEMPLATE SELECTION & VISUAL RULES
// =============================================================================

export function selectTemplate(summary: IngredientSummary): Template {
  const order = ['minimalist', 'anchor', 'snackLine', 'bento', 'wildGraze'];
  for (const key of order) {
    if (TEMPLATES[key].conditions(summary)) {
      return TEMPLATES[key];
    }
  }
  return TEMPLATES.wildGraze;
}

const VISUAL_RULES: Record<string, VisualRule> = {
  oddNumberCluster: {
    name: 'Odd Number Cluster',
    check: (summary) => summary.hasOddNumberItems || summary.hasSmallRound,
    instruction: 'Small round items MUST be in groups of 3, 5, or 7. NEVER 2 or 4.',
    appliesTo: ['grapes', 'olives', 'berries', 'nuts', 'cherry tomatoes'],
  },
  sCurve: {
    name: 'The S-Curve',
    check: (summary) => summary.hasLongItems,
    instruction: 'Arrange long items in a gentle S-curve to create visual movement.',
    appliesTo: ['crackers', 'carrots', 'celery', 'bacon', 'string cheese'],
  },
  fanArrangement: {
    name: 'Fan Arrangement',
    check: (summary) => summary.vehicles.length > 0,
    instruction: 'Fan flat items in overlapping arcs.',
    appliesTo: ['crackers', 'pita', 'apple', 'baguette'],
  },
  containerRule: {
    name: 'Container Rule',
    check: (summary) => summary.needsContainer,
    instruction: 'Place dips and loose items in small bowls or ramekins.',
    appliesTo: ['hummus', 'salsa', 'guacamole', 'ranch', 'olives', 'queso'],
  },
  colorDistribution: {
    name: 'Color Balance',
    check: () => true,
    instruction: "Distribute colors across the plate. Don't cluster same-colored items together.",
  },
  anchorPlacement: {
    name: 'Anchor Prominence',
    check: (summary) => summary.anchors.length > 0,
    instruction: 'Anchor items should be visually prominent - larger, centered, or at focal points.',
  },
};

export function getApplicableRules(summary: IngredientSummary): VisualRule[] {
  return Object.values(VISUAL_RULES).filter((rule) => rule.check(summary));
}

// =============================================================================
// PART 8: PROMPT BUILDER
// =============================================================================

export function buildImagePrompt(classified: ClassifiedIngredient[], template: Template, _rules: VisualRule[]): string {
  // Get all ingredient display names
  const ingredientNames = classified.map((i) => i.displayName).join(', ');

  // Determine the board/plate style based on template
  const boardStyle = template.layout.boardShape || 'rustic wooden board';

  // Build a simple, effective prompt
  return `Studio Ghibli-style watercolor illustration, overhead flat-lay perspective like an Instagram food photo.

A beautiful ${boardStyle} with ${ingredientNames} arranged in an aesthetic "${template.name}" layout.

Style: Soft watercolor textures, warm golden hour lighting, cozy and inviting atmosphere. Gentle shadows, creamy background with subtle linen texture.

The food looks delicious and carefully arranged. Dreamy, whimsical Ghibli aesthetic with rich warm colors. Perfect for social media sharing.

Overhead bird's-eye view, centered composition, soft natural lighting from the side.`.trim();
}

// =============================================================================
// PART 9: MAIN PROCESSING FUNCTION
// =============================================================================

function getTemplateReason(summary: IngredientSummary, template: Template): string {
  if (template.name === 'The Minimalist') return `Only ${summary.total} items - clean and simple`;
  if (template.name === 'The Anchor') return 'One large item dominates - centerpiece focus';
  if (template.name === 'The Snack Line') return 'Has dip + dippers - linear functional layout';
  if (template.name === 'The Bento') return 'Multiple anchors, moderate count - organized zones';
  return 'Good variety - organic S-curve flow';
}

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

// =============================================================================
// EXPORTS
// =============================================================================

export { INGREDIENT_DATABASE, TEMPLATES, VISUAL_RULES, SNARK_BANK, NON_FOOD_PATTERNS, DINNER_DATABASE };
