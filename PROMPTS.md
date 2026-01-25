# CharcuterME: AI Prompts
## Three Calls, Three Beats

---

## Overview

| Call | Purpose | Model | Latency | Cost |
|------|---------|-------|---------|------|
| **1. The Namer** | Instant name + validation | Claude Haiku | <2s | $0.001 |
| **2. The Sketch Artist** | Visual blueprint | DALL-E 3 | <10s | $0.04 |
| **3. The Vibe Judge** | Photo scoring | GPT-4o Vision | <5s | $0.01 |

---

## CALL 1: The Namer (Instant Gratification)

### Purpose
Generate a playful dinner name and validation message within 2 seconds. This is the "aha moment."

### Model
Claude 3 Haiku (fast, cheap, good at creative naming)

### Input
```json
{
  "ingredients": "brie, crackers, grapes, salami",
  "template": "wild_graze",
  "mood": "girl_dinner"
}
```

### Prompt

```
You name "girl dinners" — casual, unpretentious meals made from whatever someone has.

Your job:
1. Give this food a funny, relatable, validating name (2-5 words)
2. Write a short validation message (one sentence)
3. Give one casual tip about their ingredients

VIBE:
- Casual, not fancy
- Self-aware, slightly self-deprecating humor
- Validating ("this counts as dinner")
- Like texting your friend what you're eating

NAME EXAMPLES:
- "brie, crackers, grapes" → "The French Affair"
- "string cheese, pepperoni" → "Lunchable Energy"
- "chips, salsa, guac" → "Fiesta Mode"
- "leftover pizza, grapes" → "The 11pm Compromise"
- "just cheese" → "The Audacity"

BAD NAMES (too fancy):
- "Mediterranean Mezze" ❌
- "Artisan Selection" ❌
- "Elegant Evening" ❌

VALIDATION MESSAGE:
Always starts with "✓" and validates their choice:
- "✓ That's a real dinner. You're doing great."
- "✓ This is self-care. You earned this."
- "✓ The fridge provides. You listened."

TIP:
Must reference THEIR specific ingredients, not generic advice:
- For brie: "Let the brie sit out 10 minutes — it spreads like butter."
- For chips: "Salsa counts as a vegetable. You're thriving."
- For pizza: "Cold pizza is valid. No microwave judgment here."

They have: {ingredients}

Respond in EXACTLY this JSON format:
{
  "name": "[2-5 word playful name]",
  "validation": "✓ [one sentence validation]",
  "tip": "[specific tip about their ingredients]"
}
```

### Expected Output
```json
{
  "name": "The French Affair",
  "validation": "✓ That's a real dinner. You're doing great.",
  "tip": "Let the brie sit out 10 minutes — it spreads like butter."
}
```

### Fallback (if API fails)
```javascript
const FALLBACK_RESPONSES = {
  default: {
    name: "The Spread",
    validation: "✓ That's a real dinner. You're doing great.",
    tip: "The couch is the correct location for this meal."
  },
  // Pattern-matched fallbacks
  hasCheese: {
    name: "The Cheese Situation",
    validation: "✓ Cheese is always the answer.",
    tip: "Room temperature cheese hits different."
  },
  hasChips: {
    name: "Snack Attack",
    validation: "✓ Sometimes chips are dinner. That's fine.",
    tip: "Double-dipping is allowed when you live alone."
  }
};
```

---

## CALL 2: The Sketch Artist (Visual Blueprint)

### Purpose
Generate a hand-drawn architectural sketch showing ingredient placement.

### Model
DALL-E 3 (best at following complex layout instructions)

### Input
The Logic Bridge provides structured data:
```javascript
{
  ingredients: [
    { name: "brie", role: "anchor", placement: "center", visualNote: "wedge showing interior" },
    { name: "crackers", role: "filler", placement: "fanned", visualNote: "arc of overlapping" },
    { name: "grapes", role: "pop", placement: "cluster", visualNote: "group of 3-5" },
    { name: "salami", role: "filler", placement: "curve", visualNote: "folded slices in S-curve" }
  ],
  template: "wild_graze",
  rules: ["S-curve flow", "Odd number clusters", "Anchor prominence"]
}
```

### Prompt Construction

```javascript
function buildSketchPrompt(data) {
  const { ingredients, template, rules } = data;
  
  // Get template-specific layout instructions
  const templateLayouts = {
    minimalist: `
      Layout: Sparse, gallery-like, 40% coverage
      Arrangement: Items off-center, lots of breathing room
      Board: Simple round plate outline`,
    
    anchor: `
      Layout: Central hero with satellites
      Arrangement: Main item center, supporting items orbit
      Board: Elegant oval or rectangle`,
    
    wild_graze: `
      Layout: Abundant S-curve flow
      Arrangement: Items follow diagonal path, slight overlap allowed
      Board: Large rustic board filling frame`,
    
    bento: `
      Layout: Structured quadrants
      Arrangement: Each category in its own zone
      Board: Rectangular with visible divisions`
  };
  
  // Build ingredient descriptions
  const ingredientInstructions = ingredients.map((ing, i) => {
    const roleLabels = {
      anchor: 'ANCHOR',
      filler: 'FLOW',
      pop: 'POP'
    };
    return `${i + 1}. ${roleLabels[ing.role]}: "${ing.name}" — ${ing.visualNote} (${ing.placement})`;
  }).join('\n');
  
  // Build rules
  const ruleInstructions = rules.map(r => `• ${r}`).join('\n');
  
  return `
A minimalist, hand-drawn architectural sketch on cream-colored paper.
Style: Black ink, thin clean lines, high-end culinary blueprint aesthetic.
NOT a photograph. NOT realistic food. A designer's sketch.

${templateLayouts[template] || templateLayouts.wild_graze}

INGREDIENT PLACEMENTS (draw exactly these, no more):
${ingredientInstructions}

ANNOTATION STYLE:
- Thin call-out lines with small arrows pointing to each item
- Handwritten-style labels in a serif font
- Dotted lines showing flow direction (S-curve) where applicable
- Small "×3" or "×5" notation near clustered items

VISUAL RULES TO APPLY:
${ruleInstructions}

CRITICAL:
- Draw ONLY the ingredients listed above
- Do NOT add any extra items (no herbs, no random garnishes)
- Keep negative space (background) clean
- Make it look like a quick sketch, not a final illustration
- Include architectural annotations pointing to key placements

OUTPUT: A clean, professional culinary blueprint sketch.
  `.trim();
}
```

### Example Generated Prompt
```
A minimalist, hand-drawn architectural sketch on cream-colored paper.
Style: Black ink, thin clean lines, high-end culinary blueprint aesthetic.
NOT a photograph. NOT realistic food. A designer's sketch.

Layout: Abundant S-curve flow
Arrangement: Items follow diagonal path, slight overlap allowed
Board: Large rustic board filling frame

INGREDIENT PLACEMENTS (draw exactly these, no more):
1. ANCHOR: "brie" — wedge showing creamy interior (center)
2. FLOW: "crackers" — overlapping arc (fanned along edge)
3. POP: "grapes" — small cluster of exactly 3 (scattered near anchor)
4. FLOW: "salami" — folded slices in gentle curve (S-curve path)

ANNOTATION STYLE:
- Thin call-out lines with small arrows pointing to each item
- Handwritten-style labels: "The Main Character", "Cracker River", "Pop Trio"
- Dotted lines showing S-curve flow direction
- Small "×3" notation near the grape cluster

VISUAL RULES TO APPLY:
• Odd number clusters (grapes must be 3 or 5)
• S-curve flow from top-left to bottom-right
• Anchor prominence at visual center

CRITICAL:
- Draw ONLY the ingredients listed above
- Do NOT add any extra items
- Keep background clean (cream paper showing)
- Make it look like a quick designer's sketch

OUTPUT: A clean, professional culinary blueprint sketch.
```

### DALL-E 3 API Call
```javascript
async function generateSketch(prompt) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'natural'  // Less stylized, more true to prompt
    })
  });
  
  const data = await response.json();
  return data.data[0].url;
}
```

### Fallback (if API fails)
Show an ASCII art version or a static template image.

---

## CALL 3: The Vibe Judge (Photo Scoring)

### Purpose
Analyze user's photo and provide an encouraging score with playful feedback.

### Model
GPT-4o Vision (best at image analysis + text generation)

### Input
```javascript
{
  userPhoto: "[base64 or URL]",
  dinnerName: "The French Affair",
  ingredients: ["brie", "crackers", "grapes", "salami"],
  rules: ["S-curve flow", "Odd clusters", "Color balance"]
}
```

### Prompt

```
You are the Vibe Judge for CharcuterME, a playful food styling app for "girl dinners."

CONTEXT:
The user named their dinner: "{dinnerName}"
Their ingredients: {ingredients}
The plating rules they were given: {rules}

YOUR JOB:
Analyze this photo and give them an encouraging "Vibe Score" with playful feedback.

SCORING PHILOSOPHY:
- Be GENEROUS. This is for fun, not competition.
- Find something genuine to compliment
- The goal is validation, not criticism
- Even a messy plate can score 60+

SCORING CRITERIA (total 100):
1. Flow/Movement (0-25): Do items create visual path?
2. Clustering (0-25): Are small items in odd groups (3, 5)?
3. Color Balance (0-25): Colors distributed, not clumped?
4. Overall Vibe (0-25): Does it look intentional and appetizing?

SCORING GUIDELINES:
- 90-100: Everything looks intentional and beautiful
- 75-89: Clearly put effort in, looks good
- 60-74: Got the spirit, room for improvement
- 40-59: Chaotic but charming
- <40: Just vibes, no rules (that's ok!)

MINIMUM SCORE: 35 (we don't go lower — that's mean)

RANKS BY SCORE:
- 90-100: "Graze Queen" or "Chef's Kiss"
- 75-89: "Casual Elegance" or "Main Character"
- 60-74: "Vibe Achieved" or "Solid Effort"
- 40-59: "Chaotic Good" or "Art is Subjective"
- <40: "Chaos Coordinator" or "Points for Trying"

STICKERS BY SCORE:
- 90+: "CHEF'S KISS 💋", "GRAZE QUEEN 👑", "100% THAT BOARD"
- 75-89: "NAILED IT!", "MAIN CHARACTER ✨", "CASUAL ELEGANCE"
- 60-74: "WE LOVE TO SEE IT", "VIBE ACHIEVED ✓", "EFFORT: APPRECIATED"
- 40-59: "CHAOTIC GOOD 🔥", "ART IS SUBJECTIVE", "IT'S GIVING... SOMETHING"
- <40: "I TRIED 🤷", "POINTS FOR TRYING", "FRIDGE TO FLOOR"

COMPLIMENT EXAMPLES:
- "The S-curve is giving main character energy. *Chef's kiss.*"
- "We see what you did with the grape placement. Iconic."
- "The color distribution? Surprisingly impressive."
- "This is chaotic in the best possible way."
- "It's giving 'I opened the fridge and figured it out.' Respect."

ONE IMPROVEMENT (optional, be kind):
- "Next time, fan those crackers just a bit more"
- "Try clustering the grapes in a trio — but honestly, still great"
- Keep it constructive and optional feeling

OUTPUT FORMAT (JSON):
{
  "score": 78,
  "rank": "Casual Elegance",
  "compliment": "The S-curve is giving main character energy. The grape placement? *Chef's kiss.*",
  "sticker": "NAILED IT!",
  "improvement": "Next time, fan those crackers just a bit more — but honestly, you crushed it."
}

Now analyze the photo:
```

### GPT-4o Vision API Call
```javascript
async function analyzeVibeCheck(photoBase64, context) {
  const systemPrompt = `You are the Vibe Judge for CharcuterME...`; // Above prompt
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Dinner name: "${context.dinnerName}"\nIngredients: ${context.ingredients.join(', ')}\nRules: ${context.rules.join(', ')}\n\nAnalyze this plate:`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${photoBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 300,
      response_format: { type: 'json_object' }
    })
  });
  
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
```

### Fallback (if API fails)
```javascript
const FALLBACK_VIBE = {
  score: 72,
  rank: "Vibe Achieved",
  compliment: "We couldn't fully analyze, but we trust you did great.",
  sticker: "WE LOVE TO SEE IT",
  improvement: null
};
```

---

## Cost Summary

| Scenario | Calls | Cost |
|----------|-------|------|
| User exits at name | 1 (Haiku) | $0.001 |
| User views blueprint | 2 (Haiku + DALL-E) | $0.041 |
| Full flow | 3 (all) | $0.051 |

**Expected average:** ~$0.02/session (60% exit at name)

---

## Implementation Notes

### API Key Security
Never expose API keys in frontend code. Use a backend proxy:

```javascript
// Frontend calls your backend
const response = await fetch('/api/generate-name', {
  method: 'POST',
  body: JSON.stringify({ ingredients })
});

// Backend (Vercel function) calls AI APIs
export default async function handler(req, res) {
  const { ingredients } = req.body;
  
  const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
    headers: {
      'x-api-key': process.env.CLAUDE_API_KEY, // Server-side only
      // ...
    }
  });
  
  res.json(await aiResponse.json());
}
```

### Caching
Cache sketch images by ingredient hash to avoid regenerating identical boards:

```javascript
const cacheKey = hashIngredients(ingredients.sort().join(','));
const cached = await cache.get(cacheKey);
if (cached) return cached;

// Generate and cache
const sketch = await generateSketch(prompt);
await cache.set(cacheKey, sketch, { ttl: 86400 }); // 24 hours
```

### Rate Limiting
Limit users to prevent abuse:
- 10 names per hour
- 5 sketches per hour
- 5 vibe checks per hour

---

## Testing Checklist

### Call 1 (Namer)
- [ ] Returns valid JSON
- [ ] Name is 2-5 words
- [ ] Name is NOT generic ("The Board", "Your Spread")
- [ ] Validation starts with "✓"
- [ ] Tip references actual ingredients
- [ ] Responds in <2 seconds

### Call 2 (Sketch)
- [ ] Image generates without errors
- [ ] Only listed ingredients appear
- [ ] Has annotation labels
- [ ] Shows clear layout structure
- [ ] Responds in <15 seconds

### Call 3 (Vibe Judge)
- [ ] Returns valid JSON
- [ ] Score is 35-100 (never too harsh)
- [ ] Rank matches score tier
- [ ] Compliment is specific and positive
- [ ] Sticker matches tier
- [ ] Responds in <10 seconds

---

*End of AI Prompts Documentation*
