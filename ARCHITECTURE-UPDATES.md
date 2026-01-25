# CharcuterME Architecture Updates v3.0

This document describes changes to the existing ARCHITECTURE.md. Apply these updates to keep documentation in sync with the new prompt implementations.

---

## 1. Environment Variables

### Add to `.env.example`:

```bash
# AI Providers (Required)
ANTHROPIC_API_KEY=sk-ant-...    # Claude API key
OPENAI_API_KEY=sk-...           # OpenAI API key

# Model Configuration (Optional)
GPT_VISION_MODEL=gpt-4o         # Options: gpt-4o, gpt-4o-mini (70% cheaper)

# Feature Flags (Optional)
ENABLE_DALLE=true
ENABLE_VIBE_CHECK=true
ENABLE_CLAUDE_NAMING=true
```

---

## 2. API Call Specifications

### Update CALL 1: The Namer

**Change:** Now uses proper system/user message separation.

```typescript
// OLD (everything in user message)
messages: [{ role: 'user', content: hugePromptWithEverything }]

// NEW (separated)
{
  model: 'claude-3-5-haiku-20241022',
  max_tokens: 200,
  temperature: 0.9,
  system: SYSTEM_PROMPT,  // Personality, rules, examples
  messages: [{ role: 'user', content: `Name this girl dinner: ${ingredients}` }]
}
```

### Update CALL 2: The Sketch Artist

**Change:** Style changed from "architectural sketch" to "Studio Ghibli illustration".

```
// OLD
A minimalist, hand-drawn architectural sketch on cream paper.
Style: Black ink, clean lines, culinary blueprint aesthetic.

// NEW
Studio Ghibli-style illustration, 45-degree angle like an Instagram food photo.
${ingredients} casually arranged on a cute white ceramic plate, cozy girl dinner vibes.
Style: Soft dreamy Ghibli textures, warm golden hour lighting, gentle shadows.
Creamy linen background, shallow depth of field.
```

**Visual comparison:**

| Aspect | Old (Architectural) | New (Ghibli) |
|--------|---------------------|--------------|
| Style | Black ink line drawing | Soft watercolor |
| Colors | Monochrome | Warm, golden |
| Angle | Overhead flat | 45-degree Instagram |
| Mood | Technical, blueprint | Cozy, inviting |
| Labels | Yes, with arrows | No text at all |

### Update CALL 3: The Vibe Judge

**Change 1:** Context is now actually used in the prompt.

```typescript
// OLD (context passed but not used)
const userMessage = "Analyze this plate and give me a vibe score";

// NEW (context included)
const userMessage = `Rate this girl dinner plate!
They named it: "${dinnerName}"
Ingredients they used: ${ingredients}
Plating tips to look for: ${rules.join(', ')}`;
```

**Change 2:** Returns `stickerTier` instead of `sticker`.

```typescript
// OLD (AI picks exact sticker - inconsistent)
{ sticker: "NAILED IT" }  // Sometimes "NAILED IT!", "Nailed It!", etc.

// NEW (AI picks tier, client selects sticker)
{ stickerTier: "great" }  // Always consistent
// Client then: selectSticker("great") → "NAILED IT!"
```

---

## 3. Sticker System

### Replace the sticker selection logic:

```typescript
// =============================================================================
// Sticker Selection (Tier-Based)
// =============================================================================

type StickerTier = 'legendary' | 'great' | 'good' | 'chaotic' | 'messy';

const STICKERS: Record<StickerTier, string[]> = {
  legendary: [  // 90-100
    'GRAZE QUEEN 👑',
    "CHEF'S KISS 💋",
    '100% THAT BOARD',
    'PERFECTION EXISTS',
    'ACTUAL FOOD STYLIST',
  ],
  great: [  // 75-89
    'NAILED IT!',
    'MAIN CHARACTER ✨',
    'UNDERSTOOD THE ASSIGNMENT',
    'CASUAL ELEGANCE',
    'WE BOW',
  ],
  good: [  // 60-74
    'WE LOVE TO SEE IT',
    'VIBE ACHIEVED ✓',
    'SOLID EFFORT',
    'YES CHEF',
    'DOING AMAZING',
  ],
  chaotic: [  // 45-59
    'CHAOTIC GOOD 🔥',
    'ART IS SUBJECTIVE',
    "IT'S GIVING... SOMETHING",
    'ABSTRACT ENERGY',
    'VIBES OVER RULES',
  ],
  messy: [  // 35-44
    'I TRIED 🤷',
    'POINTS FOR TRYING',
    'FRIDGE TO FLOOR',
    'EFFORT NOTED',
    'CHAOS COORDINATOR',
  ],
};

function selectSticker(tier: StickerTier): string {
  const options = STICKERS[tier];
  return options[Math.floor(Math.random() * options.length)];
}

function getTierFromScore(score: number): StickerTier {
  if (score >= 90) return 'legendary';
  if (score >= 75) return 'great';
  if (score >= 60) return 'good';
  if (score >= 45) return 'chaotic';
  return 'messy';
}
```

---

## 4. Score Tiers

### Update score guide:

| Score | Tier | Ranks |
|-------|------|-------|
| 90-100 | `legendary` | "Graze Queen", "Chef's Kiss" |
| 85-89 | `great` | "Chef's Kiss", "Main Character" |
| 75-84 | `great` | "Main Character", "Casual Elegance" |
| 65-74 | `good` | "Vibe Achieved", "Solid Effort" |
| 55-64 | `good` | "Casual Elegance" |
| 45-54 | `chaotic` | "Chaotic Good", "Art is Subjective" |
| 35-44 | `messy` | "Points for Trying", "Chaos Coordinator" |

**Note:** Minimum score is 35. This is enforced IN the prompt, not post-hoc.

---

## 5. Response Flow

### Update the vibe check response flow:

```
┌─────────────────────────────────────────────────────────┐
│                    VIBE CHECK FLOW                      │
└─────────────────────────────────────────────────────────┘

  User Photo + Context (name, ingredients, rules)
                    │
                    ▼
         ┌─────────────────────┐
         │     GPT-4o Vision   │
         │                     │
         │  Returns:           │
         │  - score (35-100)   │
         │  - rank             │
         │  - stickerTier      │  ← NEW: tier, not sticker
         │  - compliment       │
         │  - improvement      │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  Client-Side Logic  │
         │                     │
         │  selectSticker(tier)│  ← Picks random from tier
         │                     │
         │  Returns:           │
         │  - sticker string   │
         └──────────┬──────────┘
                    │
                    ▼
            Final Response:
            {
              score: 78,
              rank: "Main Character",
              stickerTier: "great",
              sticker: "NAILED IT!",  ← Added by client
              compliment: "...",
              improvement: null
            }
```

---

## 6. Edge Case Handling

### Add to vibe check section:

```typescript
// Edge cases handled in prompt:

// Blurry/Dark Image
{
  score: 65-70,
  stickerTier: "good",
  compliment: "We can't quite see everything, but the vibes are radiating through.",
  improvement: null
}

// Not Food (returns error)
{
  error: "not_food",
  message: "That doesn't look like food to us! Show us your spread."
}

// Empty Plate
{
  score: 40-50,
  stickerTier: "messy",
  compliment: "The empty plate tells a story. You finished strong.",
  improvement: null
}

// Minimal (just crackers)
{
  score: 50-60,
  stickerTier: "chaotic",
  compliment: "Less is more and you understood that assignment.",
  improvement: null
}
```

---

## 7. Input Sanitization

### Add section on security:

```typescript
// All user input is sanitized before inclusion in prompts:

function sanitizeIngredients(raw: string): string {
  return raw
    .replace(/[{}"'`<>]/g, '')  // Remove JSON/XML breaking chars
    .replace(/\n/g, ', ')        // Newlines to commas
    .replace(/\s+/g, ' ')        // Collapse whitespace
    .trim()
    .slice(0, 500);              // Hard limit
}

// This prevents:
// - Prompt injection attacks
// - JSON parsing issues
// - Excessively long inputs
```

---

## 8. Prompt Versioning

### Add section on tracking:

```typescript
// All prompts include version tracking:

const PROMPT_VERSION = 'namer_v3.0';

logger.info('Generated', {
  action: 'generate_name',
  promptVersion: PROMPT_VERSION,
  duration: Date.now() - startTime,
  model: MODEL,
});

// Benefits:
// - A/B testing different prompts
// - Debugging issues by version
// - Rolling back if needed
```

---

## 9. Cost Optimization

### Add/update cost section:

| Call | Model | Cost | Alternative |
|------|-------|------|-------------|
| Name | Claude 3.5 Haiku | $0.001 | - |
| Sketch | DALL-E 3 | $0.040 | - |
| Vibe | GPT-4o | $0.010 | GPT-4o-mini: $0.003 |

To use the cheaper vision model:
```bash
GPT_VISION_MODEL=gpt-4o-mini
```

This saves ~70% on vibe checks with similar quality for this use case.

---

## 10. SVG Fallback

### Update fallback description:

The SVG fallback is now visually appealing, not embarrassing:

```
OLD:
+-------------------+
|    +---+   o o    |
|    | B |          |  ← ASCII art (embarrassing)
+-------------------+

NEW:
┌─────────────────────┐
│  [Beautiful SVG]    │
│  - Plate outline    │
│  - Ingredient dots  │  ← Proper design
│  - Ghibli sparkles  │
│  - Brand colors     │
│  "imagine the       │
│   ghibli magic ✨"  │
└─────────────────────┘
```

---

## Summary of Breaking Changes

1. **Vibe response structure changed:**
   - Added: `stickerTier` field
   - `sticker` is now added client-side, not from API

2. **Sketch style changed:**
   - From: Architectural blueprint (black ink)
   - To: Studio Ghibli (warm watercolor)

3. **Context usage:**
   - Vibe check now requires `dinnerName`, `ingredients`, `rules`
   - These are used in the prompt, not just passed through

4. **Environment variables:**
   - Added: `GPT_VISION_MODEL` (optional)

---

*Apply these changes to ARCHITECTURE.md to keep documentation in sync.*
