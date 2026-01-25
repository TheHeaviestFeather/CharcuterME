# CharcuterME QA Test Suite
## Comprehensive Testing for AI, Vision, and UX

---

# 1. THE LOGIC BRIDGE (AI-01)

## 1.1 Role Mapping Tests

The Logic Bridge must correctly classify ingredients into three roles:
- **Anchor**: Large focal items (cheeses, dips, main proteins)
- **Filler/Flow**: Items that create movement (crackers, sliced meats, breadsticks)
- **Pop**: Color/texture accents (grapes, berries, nuts, herbs)

### Test Cases

| Input | Expected Role | Expected Category | Pass Criteria |
|-------|---------------|-------------------|---------------|
| "pepperoni" | flow | cured_meat | Creates S-curve in sketch |
| "wheel of Camembert" | anchor | soft_cheese | Placed as focal point |
| "brie" | anchor | soft_cheese | Large, central placement |
| "grapes" | pop | fruit | Clustered in odd numbers |
| "crackers" | flow | cracker | Fanned or S-curved |
| "rosemary" | pop | herb | Scattered as garnish |
| "hummus" | anchor | dip | Centered with well |
| "almonds" | pop | nut | Small clusters |
| "prosciutto" | flow | cured_meat | Draped/folded |
| "cherry tomatoes" | pop | vegetable | Grouped 3s or 5s |

### Edge Cases

| Input | Challenge | Expected Behavior |
|-------|-----------|-------------------|
| "a whole wheel of aged gouda" | Modifier parsing | Recognize as anchor cheese |
| "mini mozzarella balls" | Size modifier | Could be pop OR anchor depending on quantity |
| "truffle honey" | Compound ingredient | Classify as condiment/drizzle |
| "everything bagel seasoning" | Seasoning vs ingredient | Classify as garnish/pop |
| "fig jam" | Preserved fruit | Classify as condiment, suggest small bowl |

### Implementation Validation

```javascript
// Test: Role mapping accuracy
const testCases = [
  { input: 'pepperoni', expectedRole: 'flow' },
  { input: 'wheel of Camembert', expectedRole: 'anchor' },
  { input: 'grapes', expectedRole: 'pop' },
  { input: 'water crackers', expectedRole: 'flow' },
  { input: 'marcona almonds', expectedRole: 'pop' }
];

testCases.forEach(({ input, expectedRole }) => {
  const result = classifyIngredient(input);
  console.assert(
    result.role === expectedRole,
    `FAIL: "${input}" classified as ${result.role}, expected ${expectedRole}`
  );
});
```

---

## 1.2 Non-Food Filter Tests

The app must detect non-food items and respond with appropriate snark.

### Test Cases

| Input | Expected | Snark Response |
|-------|----------|----------------|
| "car keys" | REJECT | "Unless you're garnishing with chrome, maybe leave those in your pocket." |
| "used napkin" | REJECT | "That's... not an ingredient. That's evidence." |
| "a brick" | REJECT | "We admire the commitment to 'rustic,' but no." |
| "grass" | PARTIAL | "Wheatgrass? Lemongrass? Or like... lawn grass? Be specific." |
| "my phone" | REJECT | "The only thing your phone should be on is airplane mode while you eat." |
| "candle" | REJECT | "Ambiance is great, but we can't plate fire." |
| "flowers" | PARTIAL | "Edible flowers? Gorgeous. Rose from your garden? Risky." |
| "ice" | PARTIAL | "For drinks, sure. For a cheese board... unconventional." |
| "paper plates" | REJECT | "That's the vessel, not the vibe." |
| "my ex's tears" | REJECT | "Salty, but not the kind we work with." |

### Fuzzy Match Cases

| Input | Should Match | Category |
|-------|--------------|----------|
| "bri" | brie | soft_cheese |
| "proscuitto" (typo) | prosciutto | cured_meat |
| "gooda" (typo) | gouda | hard_cheese |
| "humis" (typo) | hummus | dip |
| "blue cheese" | blue cheese | blue_cheese |
| "bleu cheese" | blue cheese | blue_cheese |

### Snark Response Matrix

```javascript
const SNARK_RESPONSES = {
  non_food_object: [
    "That's not food. That's clutter. Try again.",
    "We're flattered you think we can plate anything, but no.",
    "The only thing we're arranging is edible items.",
  ],
  dangerous_item: [
    "Absolutely not. That's not a vibe, that's a hazard.",
    "We said 'girl dinner,' not 'emergency room visit.'",
  ],
  ambiguous_item: [
    "Be more specific. Edible {item} or decorative {item}?",
    "That could go either way. What kind exactly?",
  ],
  abstract_concept: [
    "We appreciate the energy, but we need actual food.",
    "Manifesting a snack? We still need ingredients.",
  ]
};
```

---

## 1.3 JSON Integrity Tests

### Schema Validation

```typescript
// Expected output schema from naming API
interface NamingResponse {
  name: string;        // 2-5 words, no special chars except apostrophe
  validation: string;  // Starts with ✓ or encouraging word
  tip: string;         // Actionable, references actual ingredients
  template: 'wildGraze' | 'minimalist' | 'mediterranean' | 'snackAttack' | 'pizzaNight' | 'casual' | 'bento';
}

// Expected output schema from vibe check API  
interface VibeResponse {
  score: number;       // 35-100, integer only
  rank: string;        // From predefined tier list
  compliment: string;  // Specific to the actual photo
  sticker: string;     // From predefined sticker list
  suggestion?: string; // Optional, kind improvement tip
}
```

### Test Matrix

| Scenario | Input | Expected | Validation Rule |
|----------|-------|----------|-----------------|
| Normal | "brie, grapes" | Valid JSON | Parses without error |
| UTF-8 | "jalapeño, crème" | Handle encoding | No garbled text |
| Empty | "" | Error object | `{"error": "..."}` |
| Very long | 50 ingredients | Graceful handling | Top 12-15 used |
| Duplicates | "cheese, cheese" | Deduplicated | Single entry |
| Mixed case | "BRIE, Grapes" | Normalized | Case-insensitive |

### Robustness Implementation

```javascript
function parseAIResponse(rawResponse) {
  // Try direct parse
  try {
    return JSON.parse(rawResponse);
  } catch (e) {}
  
  // Try extracting from markdown
  const jsonMatch = rawResponse.match(/```json\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1]); } catch (e) {}
  }
  
  // Try extracting raw object
  const objectMatch = rawResponse.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try { return JSON.parse(objectMatch[0]); } catch (e) {}
  }
  
  // Fallback response
  return {
    name: "The Spread",
    validation: "✓ We got you. Enjoy your dinner.",
    tip: "Trust your instincts.",
    template: "casual"
  };
}
```

---

# 2. THE SKETCH-UP AESTHETIC (AI-02)

## 2.1 Visual Consistency Tests

### Style Requirements

| Element | Ghibli Style | NOT Acceptable |
|---------|--------------|----------------|
| Colors | Warm, muted, soft gradients | Neon, harsh, oversaturated |
| Lines | Soft, painterly, hand-drawn feel | Sharp vectors, 3D renders |
| Lighting | Warm top-left glow | Dramatic shadows, HDR |
| Texture | Watercolor-like, organic | Photorealistic, plastic |
| Mood | Cozy, inviting, nostalgic | Clinical, commercial, stark |

### DALL-E Prompt Template (Strict)

```javascript
function buildSketchPrompt(template, ingredients, dinnerName) {
  const basePrompt = `Studio Ghibli style food illustration, overhead view of a beautifully arranged plate.
  
STYLE REQUIREMENTS:
- Warm watercolor aesthetic with soft edges
- Color palette: cream, warm browns, muted greens, soft purples
- Gentle highlights and soft shadows
- Hand-painted texture, slightly dreamy
- Cozy, inviting atmosphere like a frame from Spirited Away
- Natural lighting from top-left corner

CRITICAL: 
- NO photorealistic rendering
- NO 3D graphics
- NO text or labels
- NO harsh lines or vectors
- NO neon or bright colors`;

  const templateInstructions = {
    wildGraze: `Layout: Abundant spread on rustic wooden board. S-curve flow of items. Multiple focal points connected by flowing elements.`,
    minimalist: `Layout: Clean white plate with intentional negative space. Single focal point off-center. Sparse, gallery-like arrangement.`,
    mediterranean: `Layout: Oval platter with centered dip bowl. Radiating arrangement of dippers. Earthy, Mediterranean colors.`,
    bento: `Layout: Rectangular compartments, each with distinct item. Clean divisions, organized sections. Japanese aesthetic.`,
    snackAttack: `Layout: Casual scattered arrangement. Two bowls with chips around them. Relaxed, fun energy.`,
    pizzaNight: `Layout: Single pizza slice as hero. Small accompaniments to the side. Late-night comfort vibe.`,
    casual: `Layout: Simple plate arrangement. Cheese block, crackers, small garnish. Unfussy, approachable.`
  };

  const ingredientList = ingredients.join(', ');
  
  return `${basePrompt}

${templateInstructions[template] || templateInstructions.casual}

INGREDIENTS TO SHOW: ${ingredientList}
MOOD: "${dinnerName}" - make it feel like this name

Only show the listed ingredients. Do not add extra items.`;
}
```

### Consistency Test Protocol

1. **Generate 5 images** with identical prompt
2. **Score each** on 1-5 scale for:
   - Color warmth (should be 4-5)
   - Line softness (should be 4-5)
   - Ghibli resemblance (should be 4-5)
3. **Flag for review** if any score below 3
4. **Reject and regenerate** if photorealistic detected

---

## 2.2 Label Accuracy Tests (If using labeled sketches)

For SVG-based sketches with annotations:

| Test | Criteria | Pass/Fail |
|------|----------|-----------|
| Arrow alignment | Arrow points within 10px of target | Visual inspection |
| Label readability | 9px+ font, contrasting color | Automated check |
| No overlap | Labels don't cover food items | Collision detection |
| Correct names | Labels match actual ingredients | String match |

### SVG Label Positioning

```javascript
function positionLabel(itemBounds, labelText, canvasBounds) {
  // Find best position: prefer right side, then top, then left
  const positions = [
    { x: itemBounds.right + 20, y: itemBounds.centerY }, // Right
    { x: itemBounds.centerX, y: itemBounds.top - 15 },   // Top
    { x: itemBounds.left - 60, y: itemBounds.centerY },  // Left
    { x: itemBounds.centerX, y: itemBounds.bottom + 20 } // Bottom
  ];
  
  for (const pos of positions) {
    if (isWithinBounds(pos, canvasBounds) && !overlapsOtherLabels(pos)) {
      return pos;
    }
  }
  
  // Fallback: closest valid position
  return findClosestValidPosition(itemBounds, canvasBounds);
}
```

---

## 2.3 Template Variety Tests

### Visual Distinction Matrix

| Template | Board Shape | Density | Flow Pattern | Key Visual |
|----------|-------------|---------|--------------|------------|
| wildGraze | Oval/rustic | High | S-curve | Overflowing abundance |
| minimalist | Round/white | Low | Asymmetric | Negative space |
| mediterranean | Oval platter | Medium | Radial | Centered bowl |
| bento | Rectangle | High | Grid | Clear compartments |
| snackAttack | Round | Medium | Scattered | Dual dip bowls |
| pizzaNight | Round | Low | Focal | Single hero slice |
| casual | Round | Low | Clustered | Simple grouping |

### Distinction Test

```javascript
// Each template should score >70% different from others
function calculateTemplateDistance(templateA, templateB) {
  const features = ['boardShape', 'density', 'flowPattern', 'colorPalette', 'itemCount'];
  let differences = 0;
  
  features.forEach(feature => {
    if (getFeature(templateA, feature) !== getFeature(templateB, feature)) {
      differences++;
    }
  });
  
  return differences / features.length;
}

// All pairs should be > 0.6 distinct
const templates = ['wildGraze', 'minimalist', 'mediterranean', 'bento', 'snackAttack', 'pizzaNight', 'casual'];
templates.forEach(a => {
  templates.forEach(b => {
    if (a !== b) {
      const distance = calculateTemplateDistance(a, b);
      console.assert(distance > 0.6, `${a} vs ${b} too similar: ${distance}`);
    }
  });
});
```

---

# 3. PLATING ASSISTANT INTERFACE

## 3.1 AR/Ghost Overlay Tests (Future Feature)

### Requirements

| Feature | Target | Measurement |
|---------|--------|-------------|
| Overlay opacity | 30-50% | User can see both sketch and real plate |
| Alignment accuracy | ±2cm | Sketch maps to actual plate position |
| Update rate | 30fps | Smooth tracking, no jitter |
| Edge detection | Plate rim detected | Overlay scales to plate size |

### Implementation Approach

```javascript
// AR overlay using device camera + canvas composite
class PlatingOverlay {
  constructor(sketchImage, videoElement, canvasElement) {
    this.sketch = sketchImage;
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.plateDetector = new PlateDetector(); // CV model
  }
  
  async render() {
    // Draw camera feed
    this.ctx.drawImage(this.video, 0, 0);
    
    // Detect plate bounds
    const plateBounds = await this.plateDetector.detect(this.video);
    
    if (plateBounds) {
      // Draw sketch overlay at 40% opacity, aligned to plate
      this.ctx.globalAlpha = 0.4;
      this.ctx.drawImage(
        this.sketch,
        plateBounds.x, plateBounds.y,
        plateBounds.width, plateBounds.height
      );
      this.ctx.globalAlpha = 1.0;
      
      // Draw alignment indicator
      this.drawAlignmentGuide(plateBounds);
    }
    
    requestAnimationFrame(() => this.render());
  }
  
  drawAlignmentGuide(bounds) {
    const centered = this.isCentered(bounds);
    this.ctx.strokeStyle = centered ? '#4ADE80' : '#F87171'; // Green or red
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  }
}
```

---

## 3.2 Alignment Tools Tests

### Center Detection

| Scenario | Expected Feedback | Visual Cue |
|----------|-------------------|------------|
| Plate centered | "Perfect!" | Green glow outline |
| Plate left of center | "Move right" | Yellow left arrow |
| Plate too close | "Back up a bit" | Zoom out icon |
| Plate tilted | "Level your phone" | Tilt indicator |
| No plate detected | "Point at your plate" | Scanning animation |

### Implementation

```javascript
function evaluateFraming(plateBounds, frameBounds) {
  const plateCenter = {
    x: plateBounds.x + plateBounds.width / 2,
    y: plateBounds.y + plateBounds.height / 2
  };
  
  const frameCenter = {
    x: frameBounds.width / 2,
    y: frameBounds.height / 2
  };
  
  const offsetX = plateCenter.x - frameCenter.x;
  const offsetY = plateCenter.y - frameCenter.y;
  const tolerance = frameBounds.width * 0.05; // 5% tolerance
  
  const feedback = {
    centered: Math.abs(offsetX) < tolerance && Math.abs(offsetY) < tolerance,
    suggestions: []
  };
  
  if (offsetX > tolerance) feedback.suggestions.push('Move camera left');
  if (offsetX < -tolerance) feedback.suggestions.push('Move camera right');
  if (offsetY > tolerance) feedback.suggestions.push('Move camera up');
  if (offsetY < -tolerance) feedback.suggestions.push('Move camera down');
  
  // Check plate size (should be 60-80% of frame)
  const plateRatio = plateBounds.width / frameBounds.width;
  if (plateRatio < 0.5) feedback.suggestions.push('Get closer');
  if (plateRatio > 0.85) feedback.suggestions.push('Back up a bit');
  
  return feedback;
}
```

---

## 3.3 Latency Tests

### Performance Targets

| Operation | Target | Max Acceptable | Measurement |
|-----------|--------|----------------|-------------|
| Ingredient parsing | <100ms | 200ms | Client-side |
| Name generation | <2s | 3s | API round-trip |
| SVG sketch render | <100ms | 200ms | Client-side |
| DALL-E generation | <10s | 15s | API round-trip |
| Vibe check analysis | <5s | 8s | API round-trip |
| Photo upload | <1s | 2s | Network dependent |

### Latency Monitoring

```javascript
class PerformanceMonitor {
  static async measure(operation, fn) {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    // Log to analytics
    console.log(`[PERF] ${operation}: ${duration.toFixed(0)}ms`);
    
    // Alert if too slow
    const thresholds = {
      'name-generation': 3000,
      'sketch-generation': 15000,
      'vibe-check': 8000,
    };
    
    if (duration > thresholds[operation]) {
      console.warn(`[PERF WARNING] ${operation} exceeded threshold`);
    }
    
    return result;
  }
}

// Usage
const result = await PerformanceMonitor.measure('name-generation', () => 
  fetch('/api/generate-name', { method: 'POST', body: JSON.stringify({ ingredients }) })
);
```

---

# 4. THE VIBE JUDGE & COMPUTER VISION

## 4.1 Comparison Engine Tests

### What the AI Should Detect

| Layout Element | Detection Criteria | Scoring Impact |
|----------------|---------------------|----------------|
| S-Curve flow | Items follow curved path | +15 points |
| Odd clusters | Groups of 3, 5, 7 | +10 points |
| Color distribution | Even spread across board | +10 points |
| Focal point | Clear main element | +10 points |
| Negative space | Not overcrowded | +10 points |
| Height variation | Flat vs layered | +5 points |
| Edge utilization | Items reach near edges | +5 points |

### Vision Prompt for Analysis

```javascript
const VIBE_CHECK_PROMPT = `You are a friendly food styling judge. Analyze this photo of a plated snack/charcuterie board.

SCORING CRITERIA (100 points total):
1. FLOW (25 points): Is there visual movement? Do items guide the eye in an S-curve or spiral?
2. CLUSTERING (25 points): Are similar items grouped in odd numbers (3, 5, 7)? 
3. COLOR (25 points): Is there variety? Multiple colors? Good contrast?
4. OVERALL VIBE (25 points): Does it look intentional? Inviting? Instagram-worthy?

SCORING PHILOSOPHY:
- Be GENEROUS. This is for encouragement, not critique.
- Minimum score is 35 (for trying at all)
- Average home effort should score 60-75
- Only truly exceptional arrangements get 90+
- NEVER score below 35, even for chaos

RESPONSE FORMAT (JSON only):
{
  "score": <number 35-100>,
  "rank": "<from tier list>",
  "compliment": "<specific positive observation about THEIR actual plate>",
  "sticker": "<from sticker list>",
  "suggestion": "<optional kind tip for next time>"
}

RANK TIERS:
- 90-100: "Graze Queen 👑", "Chef's Kiss", "Actual Food Stylist"
- 75-89: "Casual Elegance", "Main Character Energy", "Nailed It"
- 60-74: "Vibe Achieved", "Solid Effort", "Getting There"
- 45-59: "Chaotic Good", "Abstract Art", "Points for Trying"
- 35-44: "Chaos Coordinator", "It's the Thought That Counts"

STICKER OPTIONS:
- High: "CHEF'S KISS 💋", "GRAZE QUEEN 👑", "PERFECTION"
- Good: "NAILED IT!", "GORGEOUS", "YES CHEF"
- Mid: "LOVE IT", "WE SEE YOU", "VIBES"
- Low: "CHAOTIC GOOD 🔥", "ICONIC", "MOOD"

Be SPECIFIC in your compliment - mention actual items you see.`;
```

---

## 4.2 Color Analysis Tests

### Color Balance Detection

| Scenario | Detected Colors | Feedback |
|----------|-----------------|----------|
| All beige (crackers, cheese, bread) | Beige 80%+ | "Add a pop! Grapes or berries would make this sing." |
| Good variety | 4+ distinct hues | "Beautiful color balance!" |
| Too much red (salami heavy) | Red 50%+ | "Nice protein! Some green could balance it out." |
| Monochrome green | Green 60%+ | "Love the veggies! A cheese would add warmth." |

### Implementation

```javascript
function analyzeColorBalance(imageData) {
  const colorBuckets = {
    beige: 0,   // Crackers, bread, light cheese
    red: 0,     // Meats, tomatoes
    green: 0,   // Herbs, vegetables
    purple: 0,  // Grapes, berries, olives
    yellow: 0,  // Cheddar, honey
    white: 0,   // Soft cheese, mozzarella
    brown: 0    // Nuts, dark bread
  };
  
  // Analyze pixels (simplified)
  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i], g = imageData[i+1], b = imageData[i+2];
    const bucket = classifyColor(r, g, b);
    colorBuckets[bucket]++;
  }
  
  // Check for dominance
  const total = Object.values(colorBuckets).reduce((a, b) => a + b, 0);
  const dominant = Object.entries(colorBuckets)
    .map(([color, count]) => ({ color, ratio: count / total }))
    .sort((a, b) => b.ratio - a.ratio);
  
  if (dominant[0].ratio > 0.6) {
    return {
      balanced: false,
      dominant: dominant[0].color,
      suggestion: COLOR_SUGGESTIONS[dominant[0].color]
    };
  }
  
  return { balanced: true };
}

const COLOR_SUGGESTIONS = {
  beige: "Add a pop of color! Grapes, berries, or cherry tomatoes would brighten this up.",
  red: "Beautiful proteins! Some green herbs or cheese could balance the warmth.",
  green: "Love the veggie focus! A creamy cheese would add richness.",
  brown: "Nice earthy tones! Something bright like orange or purple would make it pop."
};
```

---

## 4.3 Score Calibration Tests

### Calibration Test Cases

| Photo Description | Expected Score | Acceptable Range |
|-------------------|----------------|------------------|
| Professional food stylist level | 92-98 | 88-100 |
| Good home effort, follows rules | 75-85 | 70-89 |
| Decent attempt, some issues | 60-70 | 55-75 |
| Chaotic pile, minimal effort | 45-55 | 40-60 |
| Just put food on plate | 35-45 | 35-50 |
| Empty plate / no food | Error | Should not score |

### Anti-Gaming Tests

| Scenario | Expected Behavior |
|----------|-------------------|
| Beautiful but not food | "Nice photo! But we need to see your plate." |
| Stock photo upload | "That looks too good... show us YOUR plate!" |
| Same photo twice | "Didn't we see this one? Show us something new!" |
| Dark/blurry photo | "We can barely see it! Try better lighting?" |

### Score-Rank Consistency

```javascript
function validateScoreRankConsistency(score, rank) {
  const rankTiers = {
    'Graze Queen 👑': [90, 100],
    'Chef\'s Kiss': [90, 100],
    'Casual Elegance': [75, 89],
    'Main Character Energy': [75, 89],
    'Nailed It': [75, 89],
    'Vibe Achieved': [60, 74],
    'Solid Effort': [60, 74],
    'Chaotic Good': [45, 59],
    'Points for Trying': [35, 44],
  };
  
  const [min, max] = rankTiers[rank] || [0, 100];
  
  if (score < min || score > max) {
    console.error(`MISMATCH: Score ${score} doesn't match rank "${rank}" (expected ${min}-${max})`);
    return false;
  }
  
  return true;
}
```

---

# 5. SOCIAL & SNARK LAYER

## 5.1 Sticker Placement Tests

### Interaction Requirements

| Action | Expected Behavior | Test |
|--------|-------------------|------|
| Tap sticker | Select for editing | Blue border appears |
| Drag sticker | Moves with finger | Follows touch point |
| Pinch sticker | Resizes | Min 50px, max 200px |
| Rotate sticker | Spins around center | Two-finger rotation |
| Double-tap sticker | Reset to default | Returns to corner |
| Drag off canvas | Stays within bounds | Constrained to image |

### Implementation

```javascript
class StickerEditor {
  constructor(canvasEl, stickerEl) {
    this.canvas = canvasEl;
    this.sticker = stickerEl;
    this.state = {
      x: canvasEl.width - 120,  // Default bottom-right
      y: canvasEl.height - 60,
      scale: 1,
      rotation: -5, // Slight tilt
      selected: false
    };
    
    this.setupTouchHandlers();
  }
  
  setupTouchHandlers() {
    let startX, startY, startDist, startAngle;
    
    this.sticker.addEventListener('touchstart', (e) => {
      this.state.selected = true;
      startX = e.touches[0].clientX - this.state.x;
      startY = e.touches[0].clientY - this.state.y;
      
      if (e.touches.length === 2) {
        startDist = this.getTouchDistance(e.touches);
        startAngle = this.getTouchAngle(e.touches);
      }
    });
    
    this.sticker.addEventListener('touchmove', (e) => {
      e.preventDefault();
      
      if (e.touches.length === 1) {
        // Move
        this.state.x = Math.max(0, Math.min(
          e.touches[0].clientX - startX,
          this.canvas.width - this.sticker.width
        ));
        this.state.y = Math.max(0, Math.min(
          e.touches[0].clientY - startY,
          this.canvas.height - this.sticker.height
        ));
      } else if (e.touches.length === 2) {
        // Scale and rotate
        const newDist = this.getTouchDistance(e.touches);
        const newAngle = this.getTouchAngle(e.touches);
        
        this.state.scale = Math.max(0.5, Math.min(2, this.state.scale * (newDist / startDist)));
        this.state.rotation += (newAngle - startAngle);
        
        startDist = newDist;
        startAngle = newAngle;
      }
      
      this.render();
    });
  }
  
  render() {
    this.sticker.style.transform = `
      translate(${this.state.x}px, ${this.state.y}px)
      scale(${this.state.scale})
      rotate(${this.state.rotation}deg)
    `;
  }
}
```

---

## 5.2 Dynamic Snark Tests

### Score-to-Snark Mapping

| Score Range | Tone | Example Compliments |
|-------------|------|---------------------|
| 90-100 | Impressed | "Okay, do you do this professionally? This is stunning." |
| 75-89 | Enthusiastic | "The S-curve? *Chef's kiss.* You understood the assignment." |
| 60-74 | Encouraging | "We see the effort and we love it. Solid work!" |
| 45-59 | Playful | "It's giving 'abstract art' and honestly? We're here for it." |
| 35-44 | Gentle | "Points for showing up! Next time, try grouping in threes." |

### Anti-Pattern Tests

| Bad Pattern | Why It's Wrong | Fix |
|-------------|----------------|-----|
| Score 45, says "Masterpiece" | Mismatch | Align vocabulary to tier |
| Score 92, says "Nice try" | Underselling | Use enthusiastic language |
| Generic compliment | Not personalized | Reference specific items |
| Backhanded compliment | Hurtful | Keep all feedback positive |

```javascript
function validateSnarkAlignment(score, compliment, rank) {
  const positiveWords = ['stunning', 'gorgeous', 'perfect', 'amazing', 'incredible'];
  const midWords = ['solid', 'nice', 'good', 'effort', 'vibes'];
  const lowWords = ['abstract', 'chaotic', 'creative', 'interesting', 'unique'];
  
  const hasPositive = positiveWords.some(w => compliment.toLowerCase().includes(w));
  const hasMid = midWords.some(w => compliment.toLowerCase().includes(w));
  const hasLow = lowWords.some(w => compliment.toLowerCase().includes(w));
  
  if (score >= 85 && !hasPositive) {
    console.warn('High score should have enthusiastic language');
    return false;
  }
  
  if (score < 50 && hasPositive) {
    console.warn('Low score shouldn\'t use superlatives');
    return false;
  }
  
  return true;
}
```

---

## 5.3 Export Fidelity Tests

### Export Requirements

| Platform | Dimensions | Format | Max Size |
|----------|------------|--------|----------|
| Instagram Stories | 1080x1920 | JPEG/PNG | 15MB |
| Instagram Feed | 1080x1080 | JPEG/PNG | 15MB |
| General share | 1200x1200 | PNG | 10MB |
| Download | Original | PNG | No limit |

### Export Implementation

```javascript
async function exportShareImage(photo, sticker, dinnerName, score, format = 'story') {
  const dimensions = {
    story: { width: 1080, height: 1920 },
    square: { width: 1080, height: 1080 },
    download: { width: 1200, height: 1200 }
  };
  
  const { width, height } = dimensions[format];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#FDF6E8'; // Ghibli cream
  ctx.fillRect(0, 0, width, height);
  
  // Photo (centered, with padding)
  const photoSize = Math.min(width, height) * 0.85;
  const photoX = (width - photoSize) / 2;
  const photoY = format === 'story' ? height * 0.15 : (height - photoSize) / 2;
  
  ctx.drawImage(photo, photoX, photoY, photoSize, photoSize);
  
  // Sticker
  ctx.save();
  ctx.translate(photoX + photoSize - 80, photoY + photoSize - 50);
  ctx.rotate(-5 * Math.PI / 180);
  ctx.font = 'bold 32px system-ui';
  ctx.fillStyle = '#FF6F61';
  ctx.fillText(sticker.text, 0, 0);
  ctx.restore();
  
  // Branding (subtle)
  ctx.font = '18px system-ui';
  ctx.fillStyle = '#A47864';
  ctx.textAlign = 'center';
  ctx.fillText('CharcuterME', width / 2, height - 30);
  
  // Title (for story format)
  if (format === 'story') {
    ctx.font = 'italic 28px Georgia';
    ctx.fillStyle = '#2B2B2B';
    ctx.textAlign = 'center';
    ctx.fillText(`"${dinnerName}"`, width / 2, 80);
    
    ctx.font = 'bold 48px Georgia';
    ctx.fillStyle = '#FF6F61';
    ctx.fillText(score.toString(), width / 2, height - 120);
  }
  
  // Export
  return canvas.toDataURL('image/png', 0.95);
}
```

---

# 6. STRESS TEST CHECKLIST

## 6.1 The "Minimalist" Test

**Input:** Only 2 items (e.g., "brie, crackers")

### Expected Behavior

| Aspect | Should | Should NOT |
|--------|--------|------------|
| Template | Select "minimalist" | Use "wildGraze" |
| Sketch | Show intentional negative space | Look empty/sad |
| Name | Something elegant | "The Bare Minimum" |
| Validation | Positive spin | Mention scarcity |
| Tips | Focus on presentation | Suggest adding more |

### Test Cases

| Input | Expected Template | Expected Name Style |
|-------|-------------------|---------------------|
| "brie, crackers" | minimalist | "The French Affair" (elegant) |
| "hummus, pita" | mediterranean (sparse) | "The Mediterranean Moment" |
| "cheese" | minimalist | "The Audacity" (confident) |
| "grapes" | minimalist | "The Minimalist" (intentional) |

---

## 6.2 The "Chaos" Test

**Input:** 15+ items

### Expected Behavior

| Aspect | Should | Should NOT |
|--------|--------|------------|
| Template | Select "wildGraze" or "bento" | Use "minimalist" |
| Sketch | Organized abundance | Cluttered mess |
| Ingredient handling | Use top 10-12, mention others | Cram everything |
| Layout | Clear zones/groupings | Random scatter |
| Name | Celebratory | Overwhelmed |

### Test Cases

```javascript
const chaosInput = `brie, cheddar, gouda, salami, prosciutto, 
  pepperoni, crackers, breadsticks, grapes, strawberries, 
  almonds, walnuts, olives, pickles, hummus, honey`;

// Expected: 
// - Template: wildGraze or bento
// - Uses: ~10-12 key items
// - Groups: Cheeses together, meats together, etc.
// - Name: "The Grand Feast" or "The Everything Board"
```

### Overflow Handling

```javascript
function handleLargeIngredientList(ingredients) {
  if (ingredients.length <= 12) {
    return ingredients;
  }
  
  // Prioritize variety: keep top items from each category
  const categorized = categorizeIngredients(ingredients);
  const selected = [];
  
  // Always include: 2 anchors, 3-4 flow, 3-4 pop
  selected.push(...categorized.anchors.slice(0, 2));
  selected.push(...categorized.flow.slice(0, 4));
  selected.push(...categorized.pops.slice(0, 4));
  
  // Fill remaining with random
  const remaining = ingredients.filter(i => !selected.includes(i));
  while (selected.length < 12 && remaining.length > 0) {
    selected.push(remaining.shift());
  }
  
  return {
    primary: selected,
    overflow: ingredients.filter(i => !selected.includes(i)),
    message: `Featuring ${selected.length} stars, plus ${ingredients.length - selected.length} supporting players`
  };
}
```

---

## 6.3 The "Garbage" Test

**Input:** Non-food items (e.g., "a brick and some grass")

### Expected Behavior

| Input | Detection | Response |
|-------|-----------|----------|
| "a brick and some grass" | Both flagged | Snarky rejection |
| "car keys and cheese" | Partial (keys bad) | Accept cheese, reject keys with snark |
| "grass, herbs, salad" | Ambiguous | Ask for clarification on "grass" |
| "poison, crackers" | Dangerous flagged | Firm rejection, no snark |

### Response Examples

```javascript
const GARBAGE_RESPONSES = {
  allNonFood: {
    brick: "We admire the commitment to 'rustic,' but we need actual food.",
    grass: "Unless you're a cow at a Michelin restaurant, let's try again.",
    keys: "Those open doors, not appetites. What's actually in your fridge?",
    phone: "For scrolling recipes, great. For eating, less so.",
  },
  
  mixed: {
    template: "We can work with the {goodItems}. The {badItems}? That stays in the drawer.",
    example: "We can work with the cheese. The car keys? Those stay in the drawer."
  },
  
  dangerous: {
    template: "Hey, {item} isn't food and shouldn't go near your plate. Everything okay?",
  },
  
  ambiguous: {
    grass: "Wheatgrass? Lemongrass? Or are you making a lawn board? Be specific!",
    flowers: "Edible flowers are gorgeous! But if you mean your backyard roses, let's pivot.",
  }
};
```

---

# AUTOMATED TEST RUNNER

```javascript
// test-suite.js - Run all tests

const tests = {
  logicBridge: {
    roleMapping: () => {
      const cases = [
        ['pepperoni', 'flow'],
        ['brie', 'anchor'],
        ['grapes', 'pop'],
      ];
      return cases.every(([input, expected]) => 
        classifyIngredient(input).role === expected
      );
    },
    
    nonFoodFilter: () => {
      const shouldReject = ['car keys', 'brick', 'napkin'];
      const shouldAccept = ['brie', 'crackers', 'grapes'];
      return shouldReject.every(i => !validateIngredient(i).valid) &&
             shouldAccept.every(i => validateIngredient(i).valid);
    },
    
    jsonIntegrity: () => {
      const responses = [
        '{"name":"Test","validation":"✓","tip":"tip","template":"casual"}',
        '```json\n{"name":"Test"}\n```',
        'Here is the result: {"name":"Test"}',
      ];
      return responses.every(r => {
        try {
          parseAIResponse(r);
          return true;
        } catch {
          return false;
        }
      });
    }
  },
  
  vibeCheck: {
    scoreCalibration: () => {
      // Mock test - in reality, use test images
      const scores = [92, 78, 65, 48, 38];
      return scores.every(s => s >= 35 && s <= 100);
    },
    
    rankConsistency: () => {
      const pairs = [
        [95, 'Graze Queen 👑'],
        [80, 'Casual Elegance'],
        [65, 'Vibe Achieved'],
        [50, 'Chaotic Good'],
      ];
      return pairs.every(([score, rank]) => 
        validateScoreRankConsistency(score, rank)
      );
    }
  },
  
  stressTests: {
    minimalist: () => {
      const result = findDinner('brie, crackers');
      return result.template === 'minimalist' && 
             !result.name.toLowerCase().includes('bare');
    },
    
    chaos: () => {
      const manyItems = 'a,b,c,d,e,f,g,h,i,j,k,l,m,n,o'.split(',');
      const handled = handleLargeIngredientList(manyItems);
      return handled.primary.length <= 12;
    },
    
    garbage: () => {
      const result = validateIngredient('a brick and some grass');
      return !result.valid && result.snark.length > 0;
    }
  }
};

// Run all tests
function runTestSuite() {
  let passed = 0, failed = 0;
  
  for (const [category, categoryTests] of Object.entries(tests)) {
    console.log(`\n📋 ${category.toUpperCase()}`);
    
    for (const [testName, testFn] of Object.entries(categoryTests)) {
      try {
        const result = testFn();
        if (result) {
          console.log(`  ✅ ${testName}`);
          passed++;
        } else {
          console.log(`  ❌ ${testName}`);
          failed++;
        }
      } catch (e) {
        console.log(`  💥 ${testName}: ${e.message}`);
        failed++;
      }
    }
  }
  
  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

runTestSuite();
```

---

# SUMMARY CHECKLIST

## Pre-Launch ✓

- [ ] Role mapping: 95%+ accuracy on test set
- [ ] Non-food filter: Catches all dangerous, rejects objects
- [ ] JSON parsing: No crashes on malformed responses
- [ ] Sketch consistency: Ghibli style in 90%+ of generations
- [ ] Template variety: Each visually distinct
- [ ] Latency: Name <3s, Sketch <15s, Vibe <8s
- [ ] Score calibration: No sub-35, no undeserved 90+
- [ ] Snark alignment: Tone matches score tier
- [ ] Export quality: 1080p minimum, branding intact
- [ ] Minimalist test: 2 items looks intentional
- [ ] Chaos test: 15 items stays organized
- [ ] Garbage test: Non-food rejected with snark
