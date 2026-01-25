# CharcuterME: Unified Product Architecture
## From Sketch → Vibe Check → Emotional Validation

---

## The Combined User Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER JOURNEY (60 seconds)                          │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: INPUT (5 sec)
┌──────────────────┐
│ "What do you     │
│  have?"          │
│                  │
│ [brie, crackers, │
│  grapes, salami] │
│                  │
│    [Go] ────────────┐
└──────────────────┘  │
                      ▼
STEP 2: REVEAL - THE AHA MOMENT (10 sec)
┌──────────────────────────────────────┐
│                                      │
│  Tonight's Dinner:                   │
│  "Cheese Is A Personality"           │
│                                      │
│  "Your calcium intake is giving      │
│   main character energy."            │
│                                      │
│  [Ghibli-style sketch loading...]    │
│                                      │
│  💡 Room temp brie is self-care.     │
│     Cold brie is a cry for help.     │
│                                      │
│  [I Plated It! 📸]  [Start Over]     │
│                                      │
└──────────────────────────────────────┘
         │
         ▼
STEP 3: CAMERA (capture photo)
┌──────────────────────────────────────┐
│  [User takes/uploads photo]          │
│                                      │
│  Analyzing your vibe...              │
│                                      │
└──────────────────────────────────────┘
         │
         ▼
STEP 4: RESULTS + SHARE
┌──────────────────────────────────────┐
│                                      │
│  "Cheese Is A Personality"           │
│                                      │
│  VIBE CHECK: 78/100                  │
│  ─────────────────────────────       │
│  Rank: "Main Character"              │
│                                      │
│  "The grape placement is giving      │
│   'I read one article about          │
│   plating.' We're obsessed."         │
│                                      │
│  ┌────────────────────────────┐      │
│  │   [User's photo with       │      │
│  │    "UNDERSTOOD THE         │      │
│  │     ASSIGNMENT" sticker]   │      │
│  └────────────────────────────┘      │
│                                      │
│  [Share to Stories] [Save] [Again]   │
│                                      │
└──────────────────────────────────────┘
```

---

## The Three Emotional Beats

| Beat | Timing | What Happens | Emotion |
|------|--------|--------------|---------|
| **1. The Name** | 0-5 sec | Snarky name + validation | "lol that's me" (chuckle) |
| **2. The Blueprint** | 5-15 sec | Ghibli-style visual guide | "I can do this" (confidence) |
| **3. The Vibe Check** | 30-60 sec | Photo scored + roasted lovingly | "I did it!" (pride) |

**Key insight:** Each beat provides validation with snarky millennial humor:
- Beat 1: "Your ingredients are valid (and we're going to lovingly roast you)"
- Beat 2: "Here's how to make them Instagram-worthy"
- Beat 3: "You understood the assignment (or beautifully failed trying)"

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │   User Input    │
                    │  (ingredients)  │
                    └────────┬────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │      LOGIC BRIDGE            │
              │  (Classification Engine)     │
              │                              │
              │  • Categorize ingredients    │
              │  • Select template           │
              │  • Build Ghibli-style prompt │
              │  • Generate structured data  │
              └──────────────┬───────────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │   CALL 1    │  │   CALL 2    │  │   CALL 3    │
    │   (Name)    │  │  (Sketch)   │  │(Vibe Check) │
    │             │  │             │  │             │
    │ Claude      │  │ DALL-E 3    │  │ GPT-4o      │
    │ Haiku       │  │             │  │ Vision      │
    │             │  │             │  │             │
    │ Input:      │  │ Input:      │  │ Input:      │
    │ ingredients │  │ Ghibli      │  │ user photo  │
    │             │  │ prompt from │  │ + context   │
    │             │  │ logic bridge│  │             │
    │             │  │             │  │             │
    │ Output:     │  │ Output:     │  │ Output:     │
    │ snarky name │  │ sketch      │  │ score,      │
    │ validation, │  │ image       │  │ snarky      │
    │ tip         │  │             │  │ feedback    │
    └─────────────┘  └─────────────┘  └─────────────┘
           │                 │                 │
           ▼                 ▼                 ▼
    ┌─────────────────────────────────────────────────┐
    │                 FRONTEND                        │
    │                                                 │
    │  Screen 1: Input                                │
    │  Screen 2: Reveal (name + blueprint combined)   │
    │  Screen 3: Camera                               │
    │  Screen 4: Vibe Check + Share                   │
    └─────────────────────────────────────────────────┘
```

---

## Shared Utilities

### AI Clients (`src/lib/ai-clients.ts`)
```typescript
// Lazy-loaded singleton clients
getOpenAIClient()     // For DALL-E and GPT-4o
getAnthropicClient()  // For Claude Haiku
resetClients()        // For testing/key rotation
```

### Constants (`src/lib/constants.ts`)
```typescript
COLORS = { mocha, coral, lavender, cream }
AI_MODELS = { naming: 'claude-3-haiku', sketch: 'dall-e-3', vibe: 'gpt-4o' }
DALLE_SETTINGS = { size: '1024x1024', quality: 'standard', style: 'natural' }
MIN_VIBE_SCORE = 40
```

### Resilience Patterns
- **Circuit Breakers** - Prevent cascade failures (`src/lib/circuit-breaker.ts`)
- **Retry Logic** - Exponential backoff (`src/lib/retry.ts`)
- **Timeouts** - Configurable per-call (`src/lib/timeout.ts`)
- **Feature Flags** - Quick enable/disable (`src/lib/feature-flags.ts`)

---

## API Call Specifications

### CALL 1: The Namer (Snarky Millennial Bestie)

**When:** Immediately after input
**Model:** Claude 3 Haiku (fast, cheap)
**Latency target:** <2 seconds

```javascript
// Input
{
  ingredients: "brie, crackers, grapes"
}

// Output
{
  name: "Cheese Is A Personality",
  validation: "Your calcium intake is giving main character energy.",
  tip: "Room temp brie is self-care. Cold brie is a cry for help."
}
```

**Personality:** Chaotic millennial bestie who names "girl dinners" with extremely online humor - self-deprecating but validating, like your funniest friend lovingly roasting your life choices.

---

### CALL 2: The Sketch Artist (Ghibli Style)

**When:** User submits ingredients (parallel with naming)
**Model:** DALL-E 3
**Latency target:** <10 seconds

```javascript
// Prompt (built by logic-bridge.ts)
`Studio Ghibli-style illustration, 45-degree angle like an Instagram food photo.

Brie, Crackers, Grapes casually arranged on a simple plate, styled for social media.

Style: Soft dreamy textures, warm golden hour lighting, cozy and inviting atmosphere.
Gentle shadows, creamy background with subtle linen texture.

The food looks delicious and effortlessly arranged. Dreamy, whimsical Ghibli aesthetic
with rich warm colors. Casual "girl dinner" vibes - cute but not trying too hard.

Angled perspective like a food blogger photo, soft natural lighting from the side.`

// Output: Image URL from Azure blob storage
```

---

### CALL 3: The Vibe Judge (Snarky Millennial)

**When:** User uploads their plated photo
**Model:** GPT-4o Vision
**Latency target:** <5 seconds

```javascript
// Input
{
  photo: "[base64]",
  dinnerName: "Cheese Is A Personality",
  ingredients: "brie, crackers, grapes",
  rules: ["S-curve flow", "Odd clusters"]
}

// Output
{
  score: 78,
  rank: "Main Character",
  compliment: "The grape placement is giving 'I read one article about plating.' We're obsessed.",
  sticker: "UNDERSTOOD THE ASSIGNMENT",
  improvement: "Maybe fan the crackers next time but also, rules are a construct."
}
```

**Personality:** Chaotic millennial bestie who rates with snarky but supportive humor - roasts lovingly, never mean. Uses phrases like "this is giving...", "no notes", "understood the assignment".

---

## Sticker System

### Score-Based Sticker Selection

```javascript
const STICKERS = {
  legendary: {  // 90-100
    ranks: ["Graze Girlboss", "Pinterest Made Real", "Influencer Energy"],
    stickers: ["GRAZE QUEEN", "SLAY", "NO NOTES", "OBSESSED"]
  },
  great: {  // 75-89
    ranks: ["Main Character", "Understood The Assignment", "Suspiciously Competent"],
    stickers: ["ATE THAT UP", "MAIN CHARACTER", "UNDERSTOOD THE ASSIGNMENT"]
  },
  good: {  // 60-74
    ranks: ["Chaotic Good", "It's Giving Effort", "We See You Trying"],
    stickers: ["TRUST THE PROCESS", "IT'S THE EFFORT", "VALID"]
  },
  chaotic: {  // 40-59
    ranks: ["Beautiful Disaster", "Chaos Coordinator", "Art Is Subjective Bestie"],
    stickers: ["CHAOS IS ART", "POINTS FOR TRYING", "STILL ATE THO"]
  }
};

// Minimum score is 40 - we're not monsters
```

---

## Screen-by-Screen Specifications

### Screen 1: Input
```
┌────────────────────────────┐
│  CharcuterME               │
│                            │
│  What do you have?         │
│  ┌──────────────────────┐  │
│  │ brie, crackers,      │  │
│  │ grapes               │  │
│  └──────────────────────┘  │
│                            │
│  [Make it a Spread →]      │
│                            │
│  Just type what's in       │
│  your fridge. No fancy     │
│  ingredients required.     │
└────────────────────────────┘
```

### Screen 2: Reveal (Combined Name + Blueprint)
```
┌────────────────────────────┐
│  Tonight's Dinner:         │
│                            │
│  "Cheese Is A Personality" │
│  ────────────────────────  │
│                            │
│  "Your calcium intake is   │
│   giving main character    │
│   energy."                 │
│                            │
│  ┌──────────────────────┐  │
│  │                      │  │
│  │   [Ghibli-style      │  │
│  │    sketch image      │  │
│  │    from DALL-E 3]    │  │
│  │                      │  │
│  └──────────────────────┘  │
│                            │
│  💡 Room temp brie is      │
│     self-care.             │
│                            │
│  ┌────────────────────┐    │
│  │  I Plated It! 📸   │    │
│  └────────────────────┘    │
│                            │
│  [Start Over]              │
└────────────────────────────┘
```

### Screen 3: Camera
```
┌────────────────────────────┐
│  Show us your spread!      │
│  ────────────────────────  │
│  ┌──────────────────────┐  │
│  │                      │  │
│  │                      │  │
│  │    [Camera View]     │  │
│  │                      │  │
│  │                      │  │
│  └──────────────────────┘  │
│                            │
│       [ 📸 Capture ]       │
│                            │
│  [Upload from Gallery]     │
└────────────────────────────┘
```

### Screen 4: Vibe Check Results
```
┌────────────────────────────┐
│  "Cheese Is A Personality" │
│  ────────────────────────  │
│                            │
│  VIBE CHECK                │
│  ┌──────────────────────┐  │
│  │        78            │  │
│  │  ████████████░░░░░   │  │
│  │  "Main Character"    │  │
│  └──────────────────────┘  │
│                            │
│  "The grape placement is   │
│   giving 'I read one       │
│   article about plating.'  │
│   We're obsessed."         │
│                            │
│  ┌──────────────────────┐  │
│  │  [Photo with         │  │
│  │   UNDERSTOOD THE     │  │
│  │   ASSIGNMENT]        │  │
│  └──────────────────────┘  │
│                            │
│  [Share] [Save] [Again]    │
└────────────────────────────┘
```

---

## Exit Points (All Valid)

Users can exit happy at multiple points:

| Exit Point | What They Got | % Expected |
|------------|---------------|------------|
| After reveal | Name + validation + blueprint | 70% |
| After vibe check | Full experience | 30% |

**Design principle:** Every exit is a happy exit. No dead ends.

---

## Cost Estimates (Per Session)

| Call | Model | Est. Cost |
|------|-------|-----------|
| Name | Claude Haiku | $0.001 |
| Sketch | DALL-E 3 | $0.04 |
| Vibe Check | GPT-4o Vision | $0.01 |
| **Total** | | **$0.05/session** |

If 70% of users stop at reveal: **$0.02 avg/session**

---

## Summary: The Three-Beat Experience

```
BEAT 1: THE NAME (5 sec)
"Your ingredients have a snarky name. You're valid (and roasted)."
→ Instant chuckle
→ 40% exit here (happy)

BEAT 2: THE BLUEPRINT (15 sec)
"Here's a dreamy Ghibli-style visualization."
→ Confidence boost
→ 30% exit here (inspired)

BEAT 3: THE VIBE CHECK (30 sec)
"You did it! Here's your score (and more loving roasts)."
→ Pride + shareability
→ 30% complete full loop
```

Every beat provides validation with humor. Every exit is a win.
