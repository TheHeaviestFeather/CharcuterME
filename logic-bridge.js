/**
 * CharcuterME - Logic Bridge System
 * The "Creative Director" Layer
 * 
 * This module classifies ingredients, selects templates, and builds structured prompts.
 * It sits between user input and AI generation to ensure consistency.
 * 
 * Flow: User Input → Classification → Template Selection → Structured Prompt → AI
 */

// =============================================================================
// PART 1: INGREDIENT CLASSIFICATION DATABASE
// =============================================================================

/**
 * Every ingredient is tagged with properties that determine plating logic.
 * 
 * ROLE DEFINITIONS:
 * - anchor: Large/important items that command visual attention (30-40% of visual weight)
 * - filler: Medium items that create structure and bulk
 * - pop: Small accent items that add color and visual interest
 * - vehicle: Things you put other things on (crackers, bread, chips)
 * 
 * PLATING STYLES:
 * - stack: Pile vertically
 * - scatter: Distribute randomly
 * - cluster: Group tightly in odd numbers
 * - spread: Smear or pour
 * - fan: Arrange in overlapping arc
 * - pile: Loose heap
 */

const INGREDIENT_DATABASE = {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CHEESES (Mostly Anchors)
  // ═══════════════════════════════════════════════════════════════════════════
  
  'brie': {
    role: 'anchor',
    size: 'large',
    shape: 'round',
    color: 'cream',
    platingStyle: 'spread',
    displayName: 'Brie Wheel',
    proTip: 'Cut a wedge to show the creamy interior'
  },
  'cheddar': {
    role: 'anchor',
    size: 'medium',
    shape: 'cube',
    color: 'orange',
    platingStyle: 'stack',
    displayName: 'Cheddar Cubes',
    proTip: 'Stack in a small pyramid'
  },
  'gouda': {
    role: 'anchor',
    size: 'medium',
    shape: 'wedge',
    color: 'yellow',
    platingStyle: 'scatter',
    displayName: 'Gouda Wedges',
    proTip: 'Break into rustic chunks'
  },
  'goat cheese': {
    role: 'anchor',
    size: 'medium',
    shape: 'log',
    color: 'white',
    platingStyle: 'spread',
    displayName: 'Goat Cheese',
    proTip: 'Crumble loosely or slice the log'
  },
  'feta': {
    role: 'filler',
    size: 'small',
    shape: 'cube',
    color: 'white',
    platingStyle: 'scatter',
    displayName: 'Feta Crumbles',
    proTip: 'Crumble by hand for organic shapes'
  },
  'mozzarella': {
    role: 'anchor',
    size: 'medium',
    shape: 'round',
    color: 'white',
    platingStyle: 'cluster',
    displayName: 'Fresh Mozz',
    proTip: 'Tear by hand, don\'t slice'
  },
  'cream cheese': {
    role: 'anchor',
    size: 'medium',
    shape: 'spreadable',
    color: 'white',
    platingStyle: 'spread',
    displayName: 'Cream Cheese',
    proTip: 'Spread thick in one spot'
  },
  'string cheese': {
    role: 'filler',
    size: 'small',
    shape: 'long',
    color: 'white',
    platingStyle: 'fan',
    displayName: 'String Cheese',
    proTip: 'Peel into strips for fancy vibes',
    isLongItem: true
  },
  'parmesan': {
    role: 'filler',
    size: 'small',
    shape: 'shard',
    color: 'yellow',
    platingStyle: 'scatter',
    displayName: 'Parm Shards',
    proTip: 'Break into jagged shards'
  },
  'cheese': {
    role: 'anchor',
    size: 'medium',
    shape: 'cube',
    color: 'yellow',
    platingStyle: 'stack',
    displayName: 'Cheese',
    proTip: 'Cut into bite-sized pieces'
  },
  'manchego': {
    role: 'anchor',
    size: 'medium',
    shape: 'wedge',
    color: 'yellow',
    platingStyle: 'fan',
    displayName: 'Manchego',
    proTip: 'Cut into thin triangular slices'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROTEINS (Fillers & Anchors)
  // ═══════════════════════════════════════════════════════════════════════════
  
  'salami': {
    role: 'filler',
    size: 'small',
    shape: 'round',
    color: 'red',
    platingStyle: 'fan',
    displayName: 'Salami',
    proTip: 'Fold in half or roll into cones'
  },
  'prosciutto': {
    role: 'filler',
    size: 'medium',
    shape: 'flat',
    color: 'pink',
    platingStyle: 'pile',
    displayName: 'Prosciutto',
    proTip: 'Loosely bunch into ribbons, never lay flat'
  },
  'pepperoni': {
    role: 'filler',
    size: 'small',
    shape: 'round',
    color: 'red',
    platingStyle: 'scatter',
    displayName: 'Pepperoni',
    proTip: 'Overlap in a snaking line',
    isSmallRound: true
  },
  'ham': {
    role: 'filler',
    size: 'medium',
    shape: 'flat',
    color: 'pink',
    platingStyle: 'pile',
    displayName: 'Ham',
    proTip: 'Fold into quarters and stack'
  },
  'turkey': {
    role: 'filler',
    size: 'medium',
    shape: 'flat',
    color: 'tan',
    platingStyle: 'pile',
    displayName: 'Turkey',
    proTip: 'Roll loosely into cylinders'
  },
  'smoked salmon': {
    role: 'anchor',
    size: 'medium',
    shape: 'flat',
    color: 'orange',
    platingStyle: 'pile',
    displayName: 'Smoked Salmon',
    proTip: 'Drape elegantly, show the color'
  },
  'bacon': {
    role: 'filler',
    size: 'small',
    shape: 'long',
    color: 'brown',
    platingStyle: 'pile',
    displayName: 'Bacon',
    proTip: 'Break into pieces or leave whole',
    isLongItem: true
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FRUITS (Mostly Pops)
  // ═══════════════════════════════════════════════════════════════════════════
  
  'grapes': {
    role: 'pop',
    size: 'small',
    shape: 'round',
    color: 'purple',
    platingStyle: 'cluster',
    displayName: 'Grapes',
    proTip: 'Keep in small clusters of 3-5',
    isSmallRound: true,
    useOddNumbers: true
  },
  'apple': {
    role: 'filler',
    size: 'medium',
    shape: 'flat',
    color: 'red',
    platingStyle: 'fan',
    displayName: 'Apple Slices',
    proTip: 'Fan in an arc, skin side up'
  },
  'strawberries': {
    role: 'pop',
    size: 'small',
    shape: 'irregular',
    color: 'red',
    platingStyle: 'scatter',
    displayName: 'Strawberries',
    proTip: 'Halve to show the red interior',
    isSmallRound: true,
    useOddNumbers: true
  },
  'blueberries': {
    role: 'pop',
    size: 'tiny',
    shape: 'round',
    color: 'blue',
    platingStyle: 'scatter',
    displayName: 'Blueberries',
    proTip: 'Scatter in gaps as color pops',
    isSmallRound: true,
    useOddNumbers: true
  },
  'raspberries': {
    role: 'pop',
    size: 'tiny',
    shape: 'round',
    color: 'red',
    platingStyle: 'scatter',
    displayName: 'Raspberries',
    proTip: 'Use to fill small gaps',
    isSmallRound: true,
    useOddNumbers: true
  },
  'figs': {
    role: 'pop',
    size: 'small',
    shape: 'round',
    color: 'purple',
    platingStyle: 'cluster',
    displayName: 'Figs',
    proTip: 'Quarter to show the pink interior',
    useOddNumbers: true
  },
  'melon': {
    role: 'filler',
    size: 'medium',
    shape: 'wedge',
    color: 'orange',
    platingStyle: 'fan',
    displayName: 'Melon',
    proTip: 'Cut into thin wedges or balls'
  },
  'banana': {
    role: 'filler',
    size: 'medium',
    shape: 'round',
    color: 'yellow',
    platingStyle: 'fan',
    displayName: 'Banana',
    proTip: 'Slice into rounds'
  },
  'berries': {
    role: 'pop',
    size: 'tiny',
    shape: 'round',
    color: 'mixed',
    platingStyle: 'scatter',
    displayName: 'Mixed Berries',
    proTip: 'Scatter in gaps',
    isSmallRound: true,
    useOddNumbers: true
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VEGETABLES (Fillers & Pops)
  // ═══════════════════════════════════════════════════════════════════════════
  
  'cucumber': {
    role: 'filler',
    size: 'small',
    shape: 'round',
    color: 'green',
    platingStyle: 'fan',
    displayName: 'Cucumber',
    proTip: 'Slice on an angle for larger ovals'
  },
  'carrots': {
    role: 'filler',
    size: 'small',
    shape: 'long',
    color: 'orange',
    platingStyle: 'fan',
    displayName: 'Carrot Sticks',
    proTip: 'Stand upright in a cup or fan out',
    isLongItem: true
  },
  'cherry tomatoes': {
    role: 'pop',
    size: 'small',
    shape: 'round',
    color: 'red',
    platingStyle: 'scatter',
    displayName: 'Cherry Tomatoes',
    proTip: 'Halve some, leave others whole',
    isSmallRound: true,
    useOddNumbers: true
  },
  'tomatoes': {
    role: 'filler',
    size: 'medium',
    shape: 'round',
    color: 'red',
    platingStyle: 'fan',
    displayName: 'Tomatoes',
    proTip: 'Slice thick for structure'
  },
  'celery': {
    role: 'filler',
    size: 'small',
    shape: 'long',
    color: 'green',
    platingStyle: 'fan',
    displayName: 'Celery',
    proTip: 'Fill the groove with spread',
    isLongItem: true
  },
  'pickles': {
    role: 'pop',
    size: 'small',
    shape: 'long',
    color: 'green',
    platingStyle: 'scatter',
    displayName: 'Pickles',
    proTip: 'Slice lengthwise into spears'
  },
  'olives': {
    role: 'pop',
    size: 'small',
    shape: 'round',
    color: 'green',
    platingStyle: 'scatter',
    displayName: 'Olives',
    proTip: 'Scatter in odd-numbered clusters',
    isSmallRound: true,
    useOddNumbers: true
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CARBS / VEHICLES
  // ═══════════════════════════════════════════════════════════════════════════
  
  'crackers': {
    role: 'vehicle',
    size: 'small',
    shape: 'flat',
    color: 'tan',
    platingStyle: 'fan',
    displayName: 'Crackers',
    proTip: 'Fan in an arc or stack vertically',
    isLongItem: true
  },
  'bread': {
    role: 'vehicle',
    size: 'medium',
    shape: 'irregular',
    color: 'tan',
    platingStyle: 'pile',
    displayName: 'Bread',
    proTip: 'Tear by hand for rustic look'
  },
  'baguette': {
    role: 'vehicle',
    size: 'medium',
    shape: 'round',
    color: 'tan',
    platingStyle: 'fan',
    displayName: 'Baguette',
    proTip: 'Slice on angle, toast optional',
    isLongItem: true
  },
  'pita': {
    role: 'vehicle',
    size: 'medium',
    shape: 'flat',
    color: 'tan',
    platingStyle: 'fan',
    displayName: 'Pita',
    proTip: 'Cut into triangles, stack or fan'
  },
  'chips': {
    role: 'vehicle',
    size: 'small',
    shape: 'irregular',
    color: 'tan',
    platingStyle: 'pile',
    displayName: 'Chips',
    proTip: 'Pile loosely'
  },
  'pretzels': {
    role: 'vehicle',
    size: 'small',
    shape: 'irregular',
    color: 'brown',
    platingStyle: 'scatter',
    displayName: 'Pretzels',
    proTip: 'Scatter around edges'
  },
  'tortilla chips': {
    role: 'vehicle',
    size: 'small',
    shape: 'flat',
    color: 'tan',
    platingStyle: 'fan',
    displayName: 'Tortilla Chips',
    proTip: 'Fan around a dip bowl'
  },
  'bagel chips': {
    role: 'vehicle',
    size: 'small',
    shape: 'round',
    color: 'tan',
    platingStyle: 'fan',
    displayName: 'Bagel Chips',
    proTip: 'Stack or fan in a line'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DIPS & SPREADS (Anchors)
  // ═══════════════════════════════════════════════════════════════════════════
  
  'hummus': {
    role: 'anchor',
    size: 'medium',
    shape: 'spreadable',
    color: 'tan',
    platingStyle: 'spread',
    displayName: 'Hummus',
    proTip: 'Swirl and make a well for olive oil',
    needsContainer: true
  },
  'salsa': {
    role: 'anchor',
    size: 'medium',
    shape: 'spreadable',
    color: 'red',
    platingStyle: 'spread',
    displayName: 'Salsa',
    proTip: 'Serve in a small bowl',
    needsContainer: true
  },
  'guacamole': {
    role: 'anchor',
    size: 'medium',
    shape: 'spreadable',
    color: 'green',
    platingStyle: 'spread',
    displayName: 'Guac',
    proTip: 'Pile high, it oxidizes if spread thin',
    needsContainer: true
  },
  'ranch': {
    role: 'filler',
    size: 'small',
    shape: 'spreadable',
    color: 'white',
    platingStyle: 'spread',
    displayName: 'Ranch',
    proTip: 'Small bowl or ramekin',
    needsContainer: true
  },
  'mustard': {
    role: 'filler',
    size: 'small',
    shape: 'spreadable',
    color: 'yellow',
    platingStyle: 'spread',
    displayName: 'Mustard',
    proTip: 'Dollop or small dish',
    needsContainer: true
  },
  'peanut butter': {
    role: 'anchor',
    size: 'medium',
    shape: 'spreadable',
    color: 'tan',
    platingStyle: 'spread',
    displayName: 'Peanut Butter',
    proTip: 'Big scoop, eat directly'
  },
  'jam': {
    role: 'filler',
    size: 'small',
    shape: 'spreadable',
    color: 'red',
    platingStyle: 'spread',
    displayName: 'Jam',
    proTip: 'Dollop near cheese'
  },
  'honey': {
    role: 'pop',
    size: 'tiny',
    shape: 'spreadable',
    color: 'gold',
    platingStyle: 'spread',
    displayName: 'Honey',
    proTip: 'Drizzle over cheese at the end'
  },
  'queso': {
    role: 'anchor',
    size: 'medium',
    shape: 'spreadable',
    color: 'yellow',
    platingStyle: 'spread',
    displayName: 'Queso',
    proTip: 'Warm bowl, keep it melty',
    needsContainer: true
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NUTS (Fillers)
  // ═══════════════════════════════════════════════════════════════════════════
  
  'almonds': {
    role: 'filler',
    size: 'tiny',
    shape: 'irregular',
    color: 'tan',
    platingStyle: 'scatter',
    displayName: 'Almonds',
    proTip: 'Scatter in gaps, odd numbers',
    isSmallRound: true,
    useOddNumbers: true
  },
  'walnuts': {
    role: 'filler',
    size: 'tiny',
    shape: 'irregular',
    color: 'brown',
    platingStyle: 'scatter',
    displayName: 'Walnuts',
    proTip: 'Break into smaller pieces',
    useOddNumbers: true
  },
  'cashews': {
    role: 'filler',
    size: 'tiny',
    shape: 'irregular',
    color: 'tan',
    platingStyle: 'scatter',
    displayName: 'Cashews',
    proTip: 'Scatter liberally',
    useOddNumbers: true
  },
  'nuts': {
    role: 'filler',
    size: 'tiny',
    shape: 'irregular',
    color: 'brown',
    platingStyle: 'scatter',
    displayName: 'Mixed Nuts',
    proTip: 'Fill gaps at the end',
    useOddNumbers: true
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SWEETS (Pops)
  // ═══════════════════════════════════════════════════════════════════════════
  
  'chocolate': {
    role: 'pop',
    size: 'small',
    shape: 'irregular',
    color: 'brown',
    platingStyle: 'scatter',
    displayName: 'Chocolate',
    proTip: 'Break into jagged shards'
  },
  'dark chocolate': {
    role: 'pop',
    size: 'small',
    shape: 'irregular',
    color: 'brown',
    platingStyle: 'scatter',
    displayName: 'Dark Chocolate',
    proTip: 'Snap into irregular pieces'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GIRL DINNER CLASSICS
  // ═══════════════════════════════════════════════════════════════════════════
  
  'pizza': {
    role: 'anchor',
    size: 'large',
    shape: 'flat',
    color: 'mixed',
    platingStyle: 'pile',
    displayName: 'Pizza',
    proTip: 'Stack slices or fold, no shame',
    isBulky: true
  },
  'leftover pizza': {
    role: 'anchor',
    size: 'large',
    shape: 'flat',
    color: 'mixed',
    platingStyle: 'pile',
    displayName: 'Leftover Pizza',
    proTip: 'Cold is valid',
    isBulky: true
  },
  'yogurt': {
    role: 'anchor',
    size: 'medium',
    shape: 'spreadable',
    color: 'white',
    platingStyle: 'spread',
    displayName: 'Yogurt',
    proTip: 'In bowl or eaten from container',
    needsContainer: true
  },
  'granola': {
    role: 'filler',
    size: 'tiny',
    shape: 'irregular',
    color: 'brown',
    platingStyle: 'scatter',
    displayName: 'Granola',
    proTip: 'Sprinkle on top of yogurt'
  }
};

// Default for unknown ingredients
const DEFAULT_INGREDIENT = {
  role: 'filler',
  size: 'medium',
  shape: 'irregular',
  color: 'neutral',
  platingStyle: 'pile',
  displayName: null,
  proTip: 'Place where it fits'
};


// =============================================================================
// PART 2: INGREDIENT CLASSIFIER
// =============================================================================

/**
 * Classifies a list of user ingredients into tagged objects
 */
function classifyIngredients(userInput) {
  const items = Array.isArray(userInput) 
    ? userInput 
    : userInput.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  
  return items.map(item => {
    // Try exact match
    if (INGREDIENT_DATABASE[item]) {
      return {
        original: item,
        ...INGREDIENT_DATABASE[item],
        displayName: INGREDIENT_DATABASE[item].displayName || item
      };
    }
    
    // Try partial match
    for (const [key, data] of Object.entries(INGREDIENT_DATABASE)) {
      if (item.includes(key) || key.includes(item)) {
        return {
          original: item,
          ...data,
          displayName: data.displayName || item
        };
      }
    }
    
    // Return default
    return {
      original: item,
      ...DEFAULT_INGREDIENT,
      displayName: item
    };
  });
}

/**
 * Summarizes classified ingredients for template selection
 */
function summarizeIngredients(classified) {
  return {
    total: classified.length,
    anchors: classified.filter(i => i.role === 'anchor'),
    fillers: classified.filter(i => i.role === 'filler'),
    pops: classified.filter(i => i.role === 'pop'),
    vehicles: classified.filter(i => i.role === 'vehicle'),
    
    // Special flags
    hasLarge: classified.some(i => i.size === 'large'),
    hasBulky: classified.some(i => i.isBulky),
    hasSmallRound: classified.some(i => i.isSmallRound),
    hasLongItems: classified.some(i => i.isLongItem),
    hasSpreadable: classified.some(i => i.shape === 'spreadable'),
    needsContainer: classified.some(i => i.needsContainer),
    hasOddNumberItems: classified.some(i => i.useOddNumbers)
  };
}


// =============================================================================
// PART 3: TEMPLATE DEFINITIONS
// =============================================================================

const TEMPLATES = {
  
  minimalist: {
    name: 'The Minimalist',
    conditions: (s) => s.total <= 3,
    description: 'Clean and simple. Each item gets breathing room.',
    layout: {
      style: 'asymmetric',
      negativeSpace: '50%+',
      boardShape: 'round plate'
    },
    rules: [
      'Place anchor off-center (rule of thirds)',
      'Leave at least 40% of plate empty',
      'Use odd numbers for any grouped items',
      'Create diagonal tension between items'
    ],
    visualGuide: `
      ┌─────────────────────┐
      │                     │
      │     ┌───┐           │
      │     │ A │     ○     │
      │     └───┘           │
      │           ○ ○       │
      │                     │
      └─────────────────────┘
    `
  },
  
  anchor: {
    name: 'The Anchor',
    conditions: (s) => (s.hasLarge || s.hasBulky) && s.anchors.length === 1,
    description: 'One big thing surrounded by supporting cast.',
    layout: {
      style: 'radial',
      negativeSpace: '30%',
      boardShape: 'round plate'
    },
    rules: [
      'Large item commands the center',
      'Smaller items orbit around the anchor',
      'Create visual rays extending outward',
      'Pops fill the perimeter'
    ],
    visualGuide: `
      ┌─────────────────────┐
      │    ○     ○          │
      │       ┌─────┐       │
      │  ○    │     │   ○   │
      │       │  A  │       │
      │       │     │       │
      │    ○  └─────┘  ○    │
      │                     │
      └─────────────────────┘
    `
  },
  
  snackLine: {
    name: 'The Snack Line',
    conditions: (s) => s.hasSpreadable && s.vehicles.length >= 1 && s.total <= 5,
    description: 'A dip and its entourage. Linear and functional.',
    layout: {
      style: 'linear',
      negativeSpace: '20%',
      boardShape: 'rectangular'
    },
    rules: [
      'Dip anchors one end',
      'Dippers fan toward the other end',
      'Create a gradient of item sizes',
      'Everything should be grabbable'
    ],
    visualGuide: `
      ┌─────────────────────────────────┐
      │  ┌───┐                          │
      │  │DIP│  ═══  ═══  ═══  ░ ░ ░   │
      │  └───┘                          │
      └─────────────────────────────────┘
    `
  },
  
  bento: {
    name: 'The Bento',
    conditions: (s) => s.total >= 4 && s.total <= 6 && s.anchors.length >= 2,
    description: 'Organized zones. Distinct islands of deliciousness.',
    layout: {
      style: 'grid',
      negativeSpace: '15%',
      boardShape: 'rectangular'
    },
    rules: [
      'Each food type gets its own "island"',
      'Keep similar items together',
      'Maintain small gaps between zones',
      'Diagonal corners should contrast in color'
    ],
    visualGuide: `
      ┌─────────────────────┐
      │ ┌─────┐   ┌─────┐   │
      │ │  A  │   │  F  │   │
      │ └─────┘   └─────┘   │
      │                     │
      │ ┌─────┐   ┌─────┐   │
      │ │  V  │   │ P P │   │
      │ └─────┘   └─────┘   │
      └─────────────────────┘
    `
  },
  
  wildGraze: {
    name: 'The Wild Graze',
    conditions: (s) => s.total >= 4,
    description: 'Organic S-curve flow. The classic girl dinner spread.',
    layout: {
      style: 's-curve',
      negativeSpace: '25%',
      boardShape: 'round board'
    },
    rules: [
      'Create an S-curve with long items',
      'Anchor items at curve endpoints',
      'Scatter pops in odd-number clusters',
      'Fill gaps with tiny items last',
      'Nothing should be perfectly aligned'
    ],
    visualGuide: `
      ┌─────────────────────────┐
      │   ┌───┐                 │
      │   │ A │  ═══            │
      │   └───┘   ═══  ○ ○      │
      │        ═══   ░░░        │
      │    ○ ○   ░░░   ┌───┐    │
      │        ░░░     │ A │    │
      │   ○            └───┘    │
      └─────────────────────────┘
      
      A = Anchors (at curve points)
      ═ = Vehicles (forming S-curve)
      ░ = Fillers (bridging)
      ○ = Pops (scattered in odd clusters)
    `
  }
};


// =============================================================================
// PART 4: TEMPLATE SELECTION ENGINE
// =============================================================================

function selectTemplate(summary) {
  // Priority order matters - most specific conditions first
  const order = ['minimalist', 'anchor', 'snackLine', 'bento', 'wildGraze'];
  
  for (const key of order) {
    if (TEMPLATES[key].conditions(summary)) {
      return TEMPLATES[key];
    }
  }
  
  return TEMPLATES.wildGraze; // Default
}


// =============================================================================
// PART 5: VISUAL RULES ENGINE
// =============================================================================

const VISUAL_RULES = {
  
  oddNumberCluster: {
    name: 'Odd Number Cluster',
    check: (summary) => summary.hasOddNumberItems || summary.hasSmallRound,
    instruction: 'Small round items (grapes, olives, berries, nuts) MUST be in groups of 3, 5, or 7. NEVER 2 or 4.',
    appliesTo: ['grapes', 'olives', 'berries', 'nuts', 'cherry tomatoes']
  },
  
  sCurve: {
    name: 'The S-Curve',
    check: (summary) => summary.hasLongItems,
    instruction: 'Arrange long items (crackers, carrots, celery) in a gentle S-curve to create visual movement.',
    appliesTo: ['crackers', 'carrots', 'celery', 'bacon', 'string cheese']
  },
  
  fanArrangement: {
    name: 'Fan Arrangement',
    check: (summary) => summary.vehicles.length > 0,
    instruction: 'Fan flat items (crackers, pita, apple slices) in overlapping arcs.',
    appliesTo: ['crackers', 'pita', 'apple', 'baguette', 'bagel chips']
  },
  
  containerRule: {
    name: 'Container Rule',
    check: (summary) => summary.needsContainer,
    instruction: 'Place dips and loose items in small bowls or ramekins.',
    appliesTo: ['hummus', 'salsa', 'guacamole', 'ranch', 'olives', 'queso']
  },
  
  colorDistribution: {
    name: 'Color Balance',
    check: () => true, // Always applies
    instruction: 'Distribute colors across the plate. Don\'t cluster same-colored items together.'
  },
  
  anchorPlacement: {
    name: 'Anchor Prominence',
    check: (summary) => summary.anchors.length > 0,
    instruction: 'Anchor items should be visually prominent - larger, centered, or at focal points.'
  }
};

function getApplicableRules(summary) {
  return Object.values(VISUAL_RULES).filter(rule => rule.check(summary));
}


// =============================================================================
// PART 6: PROMPT BUILDER
// =============================================================================

function buildImagePrompt(classified, template, rules) {
  // Sort by role for placement priority
  const anchors = classified.filter(i => i.role === 'anchor');
  const vehicles = classified.filter(i => i.role === 'vehicle');
  const fillers = classified.filter(i => i.role === 'filler');
  const pops = classified.filter(i => i.role === 'pop');
  
  // Build placement list
  const placements = [
    ...anchors.map((i, idx) => `ANCHOR ${idx + 1}: "${i.displayName}" - ${i.proTip}`),
    ...vehicles.map((i, idx) => `VEHICLE ${idx + 1}: "${i.displayName}" - ${i.proTip}`),
    ...fillers.map((i, idx) => `FILLER ${idx + 1}: "${i.displayName}" - ${i.proTip}`),
    ...pops.map((i, idx) => `POP ${idx + 1}: "${i.displayName}" - ${i.proTip}`)
  ];
  
  // Build rules section
  const rulesList = rules.map(r => `• ${r.instruction}`).join('\n');
  
  return `
═══════════════════════════════════════════════════════════════
CHARCUTERME IMAGE GENERATION PROMPT
═══════════════════════════════════════════════════════════════

STYLE: Warm hand-drawn illustration, casual and inviting

═══════════════════════════════════════════════════════════════
TEMPLATE: ${template.name.toUpperCase()}
═══════════════════════════════════════════════════════════════
${template.description}

Layout: ${template.layout.style}
Negative Space: ${template.layout.negativeSpace}
Plate/Board: ${template.layout.boardShape}

${template.visualGuide}

═══════════════════════════════════════════════════════════════
TEMPLATE RULES:
═══════════════════════════════════════════════════════════════
${template.rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

═══════════════════════════════════════════════════════════════
INGREDIENT PLACEMENTS (ONLY DRAW THESE):
═══════════════════════════════════════════════════════════════
${placements.join('\n')}

═══════════════════════════════════════════════════════════════
VISUAL RULES (MUST FOLLOW):
═══════════════════════════════════════════════════════════════
${rulesList}

═══════════════════════════════════════════════════════════════
CRITICAL CONSTRAINTS:
═══════════════════════════════════════════════════════════════
1. Draw ONLY the ingredients listed above
2. Do NOT add any ingredients not in the list
3. Follow the "${template.name}" layout exactly
4. Apply ALL visual rules
5. Vibe: Casual "girl dinner" energy
6. This should look like real food someone actually has

═══════════════════════════════════════════════════════════════
`.trim();
}


// =============================================================================
// PART 7: MAIN FUNCTION
// =============================================================================

function processGirlDinner(userInput) {
  // Step 1: Classify
  const classified = classifyIngredients(userInput);
  
  // Step 2: Summarize
  const summary = summarizeIngredients(classified);
  
  // Step 3: Select template
  const template = selectTemplate(summary);
  
  // Step 4: Get applicable rules
  const rules = getApplicableRules(summary);
  
  // Step 5: Build prompt
  const prompt = buildImagePrompt(classified, template, rules);
  
  return {
    input: userInput,
    classified,
    summary: {
      total: summary.total,
      anchors: summary.anchors.map(a => a.displayName),
      fillers: summary.fillers.map(f => f.displayName),
      pops: summary.pops.map(p => p.displayName),
      vehicles: summary.vehicles.map(v => v.displayName)
    },
    templateSelected: template.name,
    templateReason: getTemplateReason(summary, template),
    rulesApplied: rules.map(r => r.name),
    prompt
  };
}

function getTemplateReason(summary, template) {
  if (template.name === 'The Minimalist') return `Only ${summary.total} items → clean and simple`;
  if (template.name === 'The Anchor') return 'One large item dominates → centerpiece focus';
  if (template.name === 'The Snack Line') return 'Has dip + dippers → linear functional layout';
  if (template.name === 'The Bento') return 'Multiple anchors, moderate count → organized zones';
  return 'Good variety → organic S-curve flow';
}


// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  classifyIngredients,
  summarizeIngredients,
  selectTemplate,
  getApplicableRules,
  buildImagePrompt,
  processGirlDinner,
  INGREDIENT_DATABASE,
  TEMPLATES,
  VISUAL_RULES
};


// =============================================================================
// TEST
// =============================================================================

if (require.main === module) {
  console.log('\n🍽️  CharcuterME Logic Bridge - Test\n');
  console.log('═'.repeat(60));
  
  const tests = [
    'cheese, crackers',
    'brie, prosciutto, grapes, crackers, honey',
    'hummus, pita, carrots, cucumber',
    'pizza, grapes',
    'cheddar, salami, olives, crackers, grapes, almonds'
  ];
  
  tests.forEach((input, i) => {
    console.log(`\n[Test ${i + 1}] "${input}"`);
    console.log('-'.repeat(40));
    
    const result = processGirlDinner(input);
    console.log(`Template: ${result.templateSelected}`);
    console.log(`Why: ${result.templateReason}`);
    console.log(`Rules: ${result.rulesApplied.join(', ')}`);
  });
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n📝 Full Prompt for "brie, crackers, grapes":\n');
  console.log(processGirlDinner('brie, crackers, grapes').prompt);
}
