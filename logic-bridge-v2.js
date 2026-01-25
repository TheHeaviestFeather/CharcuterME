/**
 * CharcuterME Logic Bridge v2.0
 * Enhanced with non-food detection, stress test handling, and comprehensive validation
 */

// ═══════════════════════════════════════════════════════════════════════════════
// INGREDIENT DATABASE - Extended with categories and roles
// ═══════════════════════════════════════════════════════════════════════════════

const INGREDIENT_DATABASE = {
  // ANCHORS - Large focal items
  anchors: {
    soft_cheese: ['brie', 'camembert', 'burrata', 'mozzarella', 'ricotta', 'goat cheese', 'cream cheese', 'mascarpone'],
    hard_cheese: ['cheddar', 'gouda', 'parmesan', 'manchego', 'gruyere', 'aged gouda', 'pecorino', 'asiago'],
    blue_cheese: ['blue cheese', 'gorgonzola', 'roquefort', 'stilton'],
    dips: ['hummus', 'guacamole', 'salsa', 'tzatziki', 'baba ganoush', 'spinach dip', 'queso', 'ranch'],
    spreads: ['fig jam', 'honey', 'mustard', 'chutney', 'pesto', 'tapenade', 'nut butter', 'nutella'],
  },
  
  // FLOW - Items that create movement/S-curves
  flow: {
    cured_meat: ['salami', 'prosciutto', 'pepperoni', 'coppa', 'mortadella', 'sopressata', 'chorizo', 'ham'],
    crackers: ['crackers', 'water crackers', 'rice crackers', 'breadsticks', 'crostini', 'flatbread', 'pita', 'naan'],
    sliced: ['cucumber slices', 'apple slices', 'pear slices', 'bread slices'],
  },
  
  // POPS - Color and texture accents
  pops: {
    fruit: ['grapes', 'berries', 'strawberries', 'blueberries', 'raspberries', 'blackberries', 'figs', 'pomegranate', 'cherries', 'dried apricots', 'dried cranberries'],
    vegetables: ['cherry tomatoes', 'olives', 'pickles', 'cornichons', 'peppers', 'artichokes', 'sun-dried tomatoes', 'roasted peppers', 'carrots', 'celery', 'radishes', 'cucumber'],
    nuts: ['almonds', 'walnuts', 'pecans', 'cashews', 'pistachios', 'marcona almonds', 'candied nuts', 'mixed nuts'],
    herbs: ['rosemary', 'thyme', 'basil', 'mint', 'dill', 'chives', 'microgreens', 'edible flowers'],
  },
  
  // SPECIAL CATEGORIES
  special: {
    pizza: ['pizza', 'leftover pizza', 'pizza slice'],
    eggs: ['deviled eggs', 'hard boiled eggs', 'quail eggs'],
    seafood: ['smoked salmon', 'shrimp', 'crab', 'oysters', 'anchovies', 'sardines'],
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// NON-FOOD DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

const NON_FOOD_PATTERNS = {
  objects: {
    pattern: /\b(keys?|phone|wallet|napkin|paper|plastic|brick|rock|stone|glass|plate|bowl|fork|knife|spoon|cup|remote|charger|cable|shoe|sock|shirt|pants|hat|bag|purse|book|pen|pencil)\b/i,
    responses: [
      "That's not food. That's clutter. Let's focus on edibles.",
      "We're flattered you think we can plate anything, but no.",
      "Unless you're making an art installation, let's stick to food.",
    ]
  },
  
  body_parts: {
    pattern: /\b(finger|hand|hair|nail|toe|ear|nose|eye|teeth?|blood|skin)\b/i,
    responses: [
      "We're making a snack, not a crime scene.",
      "That's... concerning. Let's stick to grocery items.",
    ]
  },
  
  abstract: {
    pattern: /\b(love|hate|vibes?|energy|thoughts?|prayers?|feelings?|dreams?|hope|sadness|anger|chaos|nothing)\b/i,
    responses: [
      "We appreciate the energy, but we need actual food.",
      "Manifesting a snack? We still need ingredients.",
      "That's very philosophical, but also inedible.",
    ]
  },
  
  dangerous: {
    pattern: /\b(poison|bleach|cleaning|detergent|chemical|drug|medication|pill|tide pod|gasoline|antifreeze)\b/i,
    responses: [
      "That's not safe. Please don't put that on any plate.",
      "Absolutely not. That's a hazard, not an ingredient.",
    ],
    severity: 'high'
  },
  
  animals_live: {
    pattern: /\b(my (cat|dog|hamster|bird|fish|pet)|live (animal|bug|insect))\b/i,
    responses: [
      "Pets are friends, not food.",
      "We don't do live ingredients here.",
    ]
  },
  
  materials: {
    pattern: /\b(wood|metal|cotton|leather|rubber|concrete|dirt|sand|mud|grass(?! jelly)|lawn)\b/i,
    responses: [
      "That's a building material, not a snack material.",
      "We work with food, not hardware store inventory.",
    ]
  }
};

const AMBIGUOUS_ITEMS = {
  grass: {
    clarification: "Wheatgrass? Lemongrass? Or like... lawn grass? Be specific!",
    valid_forms: ['wheatgrass', 'lemongrass', 'grass jelly']
  },
  flowers: {
    clarification: "Edible flowers are gorgeous! But if you mean backyard roses, that's risky.",
    valid_forms: ['edible flowers', 'nasturtium', 'lavender', 'rose petals', 'chamomile']
  },
  ice: {
    clarification: "For drinks, sure. For a cheese board... that's unconventional.",
    valid_forms: ['ice cream', 'shaved ice']
  },
  leaves: {
    clarification: "Basil leaves? Mint leaves? Or random tree leaves?",
    valid_forms: ['basil leaves', 'mint leaves', 'bay leaves', 'grape leaves']
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SNARK RESPONSES
// ═══════════════════════════════════════════════════════════════════════════════

const SNARK_BANK = {
  brick: "We admire the commitment to 'rustic,' but we need actual food.",
  keys: "Those open doors, not appetites. What's actually in your fridge?",
  phone: "The only thing your phone should be on is airplane mode while you eat.",
  napkin: "That's... not an ingredient. That's evidence of eating.",
  candle: "Ambiance is great, but we can't plate fire.",
  car: "Unless your car runs on olive oil, it doesn't belong here.",
  sock: "We've heard of 'comfort food' but this isn't what that means.",
  grass: "Unless you're a cow at a Michelin restaurant, let's try again.",
  nothing: "Well, that's honest. But we need SOMETHING to work with.",
  everything: "Everything bagel seasoning? Sure. Literally everything? Let's narrow it down.",
  water: "Hydration is important, but we're building boards, not pools.",
  air: "Minimalism is chic, but even we need ingredients.",
  
  // Funny specific ones
  tears: "Salty, but not the kind we work with.",
  regret: "That's a breakfast emotion, not a dinner ingredient.",
  hopes_and_dreams: "Those go great with disappointment dip. Kidding. Give us real food.",
  my_ex: "Revenge is a dish best served cold, but not literally on this board.",
  student_loans: "Can't eat those, but cheese does help with the pain.",
};

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function validateIngredient(input) {
  const normalized = input.toLowerCase().trim();
  
  // Check for dangerous items first (high severity)
  if (NON_FOOD_PATTERNS.dangerous.pattern.test(normalized)) {
    return {
      valid: false,
      severity: 'high',
      category: 'dangerous',
      snark: NON_FOOD_PATTERNS.dangerous.responses[0],
      suggestion: "Let's stick to things from the grocery store, okay?"
    };
  }
  
  // Check for specific snarky items
  for (const [item, response] of Object.entries(SNARK_BANK)) {
    if (normalized.includes(item)) {
      return {
        valid: false,
        severity: 'low',
        category: 'non_food',
        snark: response
      };
    }
  }
  
  // Check ambiguous items
  for (const [item, data] of Object.entries(AMBIGUOUS_ITEMS)) {
    if (normalized === item || normalized.includes(` ${item}`) || normalized.includes(`${item} `)) {
      // Check if it's a valid form
      const isValidForm = data.valid_forms.some(form => normalized.includes(form));
      if (!isValidForm) {
        return {
          valid: false,
          severity: 'clarification',
          category: 'ambiguous',
          snark: data.clarification,
          validForms: data.valid_forms
        };
      }
    }
  }
  
  // Check all non-food patterns
  for (const [category, { pattern, responses }] of Object.entries(NON_FOOD_PATTERNS)) {
    if (pattern.test(normalized)) {
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      return {
        valid: false,
        severity: 'low',
        category,
        snark: randomResponse
      };
    }
  }
  
  // Check if it's in our food database
  const classification = classifyIngredient(normalized);
  if (classification.found) {
    return { valid: true, classification };
  }
  
  // Unknown but not obviously non-food - allow with warning
  return {
    valid: true,
    classification: {
      found: false,
      role: 'unknown',
      category: 'unknown',
      warning: "We don't recognize this, but we'll give it a shot!"
    }
  };
}

function validateIngredientList(inputString) {
  const items = parseIngredients(inputString);
  const results = {
    valid: [],
    invalid: [],
    ambiguous: [],
    warnings: []
  };
  
  items.forEach(item => {
    const validation = validateIngredient(item);
    if (validation.valid) {
      results.valid.push({ item, classification: validation.classification });
      if (validation.classification?.warning) {
        results.warnings.push({ item, warning: validation.classification.warning });
      }
    } else if (validation.severity === 'clarification') {
      results.ambiguous.push({ item, ...validation });
    } else {
      results.invalid.push({ item, ...validation });
    }
  });
  
  return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSIFICATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function classifyIngredient(input) {
  const normalized = input.toLowerCase().trim()
    .replace(/^(a |an |some |the |my |fresh |organic |homemade )/i, '')
    .replace(/\s+/g, ' ');
  
  // Check anchors
  for (const [subcategory, items] of Object.entries(INGREDIENT_DATABASE.anchors)) {
    for (const item of items) {
      if (normalized.includes(item) || fuzzyMatch(normalized, item)) {
        return { found: true, role: 'anchor', category: subcategory, matched: item };
      }
    }
  }
  
  // Check flow
  for (const [subcategory, items] of Object.entries(INGREDIENT_DATABASE.flow)) {
    for (const item of items) {
      if (normalized.includes(item) || fuzzyMatch(normalized, item)) {
        return { found: true, role: 'flow', category: subcategory, matched: item };
      }
    }
  }
  
  // Check pops
  for (const [subcategory, items] of Object.entries(INGREDIENT_DATABASE.pops)) {
    for (const item of items) {
      if (normalized.includes(item) || fuzzyMatch(normalized, item)) {
        return { found: true, role: 'pop', category: subcategory, matched: item };
      }
    }
  }
  
  // Check special
  for (const [subcategory, items] of Object.entries(INGREDIENT_DATABASE.special)) {
    for (const item of items) {
      if (normalized.includes(item) || fuzzyMatch(normalized, item)) {
        return { found: true, role: 'special', category: subcategory, matched: item };
      }
    }
  }
  
  return { found: false, role: 'unknown', category: 'unknown' };
}

function fuzzyMatch(input, target) {
  // Simple fuzzy matching for typos
  const distance = levenshteinDistance(input, target);
  return distance <= 2 && input.length >= 3;
}

function levenshteinDistance(a, b) {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[b.length][a.length];
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARSING AND NORMALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

function parseIngredients(input) {
  return input
    .toLowerCase()
    .split(/[,\n]+/)
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .filter((item, index, self) => self.indexOf(item) === index); // Dedupe
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRESS TEST HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

function handleMinimalistInput(ingredients) {
  // 1-2 items: Make it look intentional
  if (ingredients.length <= 2) {
    return {
      template: 'minimalist',
      approach: 'intentional_sparse',
      message: "Minimalism is elegant. Let's make these items shine.",
      styling: {
        negativeSpace: 'abundant',
        placement: 'asymmetric',
        mood: 'gallery-like'
      }
    };
  }
  return null;
}

function handleChaosInput(ingredients) {
  // 12+ items: Organize into zones
  if (ingredients.length >= 12) {
    const categorized = {
      anchors: [],
      flow: [],
      pops: []
    };
    
    ingredients.forEach(item => {
      const classification = classifyIngredient(item);
      if (classification.role === 'anchor') {
        categorized.anchors.push(item);
      } else if (classification.role === 'flow') {
        categorized.flow.push(item);
      } else {
        categorized.pops.push(item);
      }
    });
    
    // Select top items from each category
    const selected = [
      ...categorized.anchors.slice(0, 2),
      ...categorized.flow.slice(0, 4),
      ...categorized.pops.slice(0, 5)
    ];
    
    const overflow = ingredients.filter(i => !selected.includes(i));
    
    return {
      template: ingredients.length >= 15 ? 'bento' : 'wildGraze',
      approach: 'organized_abundance',
      primary: selected.slice(0, 12),
      overflow: overflow,
      message: overflow.length > 0 
        ? `Featuring ${selected.length} stars, with ${overflow.length} supporting players`
        : `All ${selected.length} items, beautifully arranged`,
      styling: {
        zones: true,
        grouping: 'by_category',
        flow: 's_curve'
      }
    };
  }
  return null;
}

function handleGarbageInput(validationResults) {
  // All items are invalid
  if (validationResults.valid.length === 0 && validationResults.invalid.length > 0) {
    const snarks = validationResults.invalid.map(i => i.snark);
    return {
      success: false,
      type: 'all_garbage',
      message: snarks[0], // Lead with first snark
      allSnarks: snarks,
      suggestion: "Try again with actual food items. We believe in you."
    };
  }
  
  // Mixed valid and invalid
  if (validationResults.invalid.length > 0) {
    const goodItems = validationResults.valid.map(v => v.item);
    const badItems = validationResults.invalid.map(i => i.item);
    
    return {
      success: true,
      type: 'mixed',
      message: `We can work with ${goodItems.join(', ')}. The ${badItems.join(', ')}? That stays in the drawer.`,
      usableItems: goodItems,
      rejectedItems: badItems
    };
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PROCESS FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

function processIngredients(inputString) {
  // Parse and validate
  const items = parseIngredients(inputString);
  
  if (items.length === 0) {
    return {
      success: false,
      error: 'empty',
      message: "Give us something to work with! What's in your fridge?"
    };
  }
  
  const validation = validateIngredientList(inputString);
  
  // Handle garbage input
  const garbageCheck = handleGarbageInput(validation);
  if (garbageCheck && !garbageCheck.success) {
    return garbageCheck;
  }
  
  const usableItems = garbageCheck?.usableItems || validation.valid.map(v => v.item);
  
  // Handle edge cases
  const minimalistCheck = handleMinimalistInput(usableItems);
  const chaosCheck = handleChaosInput(usableItems);
  
  // Determine template
  let template = 'casual';
  let finalItems = usableItems;
  let styling = {};
  
  if (minimalistCheck) {
    template = minimalistCheck.template;
    styling = minimalistCheck.styling;
  } else if (chaosCheck) {
    template = chaosCheck.template;
    finalItems = chaosCheck.primary;
    styling = chaosCheck.styling;
  } else {
    // Normal processing
    template = selectTemplate(usableItems);
  }
  
  return {
    success: true,
    items: finalItems,
    overflow: chaosCheck?.overflow || [],
    template,
    styling,
    validation: {
      rejected: validation.invalid,
      warnings: validation.warnings,
      ambiguous: validation.ambiguous
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE SELECTION
// ═══════════════════════════════════════════════════════════════════════════════

function selectTemplate(ingredients) {
  const classifications = ingredients.map(i => classifyIngredient(i));
  
  // Check for special items
  const hasSpecial = classifications.some(c => c.role === 'special');
  if (hasSpecial) {
    const specialItem = classifications.find(c => c.role === 'special');
    if (specialItem?.category === 'pizza') return 'pizzaNight';
  }
  
  // Check for Mediterranean indicators
  const medItems = ['hummus', 'pita', 'feta', 'tzatziki', 'olives', 'cucumber'];
  const hasMed = ingredients.some(i => medItems.some(m => i.includes(m)));
  if (hasMed) return 'mediterranean';
  
  // Check for snack attack (chips and dips)
  const snackItems = ['chips', 'salsa', 'guacamole', 'queso', 'tortilla'];
  const hasSnack = ingredients.some(i => snackItems.some(s => i.includes(s)));
  if (hasSnack) return 'snackAttack';
  
  // Count by role
  const roleCount = { anchor: 0, flow: 0, pop: 0 };
  classifications.forEach(c => {
    if (roleCount[c.role] !== undefined) roleCount[c.role]++;
  });
  
  // Few items = minimalist
  if (ingredients.length <= 3) return 'minimalist';
  
  // Many items = wild graze
  if (ingredients.length >= 8) return 'wildGraze';
  
  // Heavy on flow items
  if (roleCount.flow >= 3) return 'wildGraze';
  
  return 'casual';
}

// ═══════════════════════════════════════════════════════════════════════════════
// DINNER DATABASE
// ═══════════════════════════════════════════════════════════════════════════════

const DINNER_DATABASE = {
  // French/Elegant
  'brie': { name: 'The French Affair', tip: 'Let the brie sit out 10 minutes.', template: 'minimalist' },
  'brie,crackers': { name: 'The French Affair', tip: 'Let the brie sit out 10 minutes.', template: 'minimalist' },
  'brie,crackers,grapes': { name: 'The French Affair', tip: 'Let the brie sit out 10 minutes.', template: 'wildGraze' },
  'brie,crackers,grapes,salami': { name: 'The French Affair', tip: 'Fold the salami into little roses.', template: 'wildGraze' },
  'camembert,crackers': { name: 'The Parisian', tip: 'Score the top for oozy goodness.', template: 'minimalist' },
  
  // Mediterranean
  'hummus': { name: 'The Mediterranean Moment', tip: 'Make a well for olive oil.', template: 'mediterranean' },
  'hummus,pita': { name: 'The Mediterranean Moment', tip: 'Warm the pita 30 seconds.', template: 'mediterranean' },
  'hummus,pita,carrots': { name: 'The Healthy-ish Hour', tip: 'Carrots cancel out everything else.', template: 'mediterranean' },
  'hummus,pita,carrots,cucumber': { name: 'Spa Day Snacks', tip: 'Cucumber hydrates.', template: 'mediterranean' },
  'hummus,pita,carrots,cucumber,olives': { name: 'The Full Greek', tip: 'Kalamatas have the most drama.', template: 'mediterranean' },
  
  // Snack Attack
  'chips,salsa': { name: 'Fiesta Mode', tip: 'Salsa counts as a vegetable.', template: 'snackAttack' },
  'chips,salsa,guacamole': { name: "Guac O'Clock", tip: 'Double-dipping allowed.', template: 'snackAttack' },
  'chips,guacamole': { name: 'The Green Light', tip: 'Avocado is self-care.', template: 'snackAttack' },
  'chips,queso': { name: 'Cheese Pls', tip: 'Microwave for 20 seconds. Life-changing.', template: 'snackAttack' },
  
  // Pizza
  'pizza': { name: 'The 11pm Compromise', tip: 'Cold pizza is valid.', template: 'pizzaNight' },
  'leftover pizza': { name: 'The Remix', tip: 'Day-old hits different.', template: 'pizzaNight' },
  'leftover pizza,grapes': { name: 'The Balance', tip: 'Grapes for emotional balance.', template: 'pizzaNight' },
  
  // Simple/Casual
  'cheese,crackers': { name: 'Adult Lunchable', tip: 'Couch is correct location.', template: 'minimalist' },
  'cheese': { name: 'The Audacity', tip: 'Just cheese? Respect.', template: 'minimalist' },
  'grapes': { name: 'The Minimalist', tip: 'Sometimes grapes are dinner.', template: 'minimalist' },
  'string cheese': { name: 'Inner Child Energy', tip: 'Peel it. You earned this.', template: 'casual' },
  'pickles': { name: 'The Pickle Person', tip: 'Pickle people understand.', template: 'minimalist' },
  'olives': { name: 'Mediterranean Vibes', tip: 'You\'re basically in Italy.', template: 'minimalist' },
};

const VALIDATIONS = [
  "✓ That's a real dinner. You're doing great.",
  "✓ This is self-care. You earned this.",
  "✓ The fridge provides. You listened.",
  "✓ Dinner is whatever you say it is.",
  "✓ You showed up for yourself today.",
  "✓ No judgment here. Just vibes.",
];

function findDinner(inputString) {
  const items = parseIngredients(inputString).sort();
  const key = items.join(',');
  
  // Exact match
  if (DINNER_DATABASE[key]) {
    return {
      ...DINNER_DATABASE[key],
      validation: VALIDATIONS[Math.floor(Math.random() * VALIDATIONS.length)]
    };
  }
  
  // Try subsets (longest first)
  for (let len = items.length; len > 0; len--) {
    for (const combo of combinations(items, len)) {
      const comboKey = combo.join(',');
      if (DINNER_DATABASE[comboKey]) {
        return {
          ...DINNER_DATABASE[comboKey],
          validation: VALIDATIONS[Math.floor(Math.random() * VALIDATIONS.length)]
        };
      }
    }
  }
  
  // Try individual items
  for (const item of items) {
    for (const [dbKey, value] of Object.entries(DINNER_DATABASE)) {
      if (dbKey.includes(item)) {
        return {
          ...value,
          validation: VALIDATIONS[Math.floor(Math.random() * VALIDATIONS.length)]
        };
      }
    }
  }
  
  // Default
  const template = selectTemplate(items);
  return {
    name: 'The Spread',
    tip: 'The couch is the correct location.',
    template,
    validation: VALIDATIONS[Math.floor(Math.random() * VALIDATIONS.length)]
  };
}

function combinations(arr, len) {
  if (len === 1) return arr.map(x => [x]);
  const result = [];
  for (let i = 0; i <= arr.length - len; i++) {
    for (const tail of combinations(arr.slice(i + 1), len - 1)) {
      result.push([arr[i], ...tail]);
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// For ES Modules
export {
  validateIngredient,
  validateIngredientList,
  classifyIngredient,
  parseIngredients,
  processIngredients,
  selectTemplate,
  findDinner,
  handleMinimalistInput,
  handleChaosInput,
  handleGarbageInput,
  INGREDIENT_DATABASE,
  NON_FOOD_PATTERNS,
  SNARK_BANK,
  DINNER_DATABASE,
  VALIDATIONS
};

// For CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateIngredient,
    validateIngredientList,
    classifyIngredient,
    parseIngredients,
    processIngredients,
    selectTemplate,
    findDinner,
    handleMinimalistInput,
    handleChaosInput,
    handleGarbageInput,
    INGREDIENT_DATABASE,
    NON_FOOD_PATTERNS,
    SNARK_BANK,
    DINNER_DATABASE,
    VALIDATIONS
  };
}
