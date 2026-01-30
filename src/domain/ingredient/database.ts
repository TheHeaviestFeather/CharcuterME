/**
 * CharcuterME - Ingredient Database
 * Comprehensive ingredient classification data for plating recommendations
 */

import type { IngredientData } from '@/types';

// =============================================================================
// Default Ingredient Data
// =============================================================================

export const DEFAULT_INGREDIENT: IngredientData = {
  role: 'filler',
  size: 'medium',
  shape: 'irregular',
  color: 'neutral',
  platingStyle: 'pile',
  displayName: 'Unknown',
  proTip: 'Place where it fits',
};

// =============================================================================
// Ingredient Classification Database
// =============================================================================

export const INGREDIENT_DATABASE: Record<string, IngredientData> = {
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

/**
 * Get ingredient data by name (case-insensitive)
 */
export function getIngredient(name: string): IngredientData | undefined {
  return INGREDIENT_DATABASE[name.toLowerCase().trim()];
}

/**
 * Get all ingredient names
 */
export function getIngredientNames(): string[] {
  return Object.keys(INGREDIENT_DATABASE);
}
