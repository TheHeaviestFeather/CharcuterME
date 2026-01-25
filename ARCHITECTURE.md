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
STEP 2: INSTANT VALIDATION (5 sec) ← THE AHA MOMENT
┌──────────────────────────────────────┐
│                                      │
│  Tonight's Dinner:                   │
│  "The French Affair"                 │
│                                      │
│  ✓ That's a real dinner.            │
│    You're doing great.               │
│                                      │
│  [See the Blueprint] [Just Eat →]   │
│                                      │
└──────────────────────────────────────┘
         │                    │
         ▼                    ▼
STEP 3A: THE BLUEPRINT       STEP 3B: DONE
(Optional - 10 sec)          (Exit happy)
┌──────────────────────────────────────┐
│  ┌────────────────────────────────┐  │
│  │    ╭───╮                       │  │
│  │    │ B │ ←── "Brie Wheel"      │  │
│  │    ╰───╯    (center stage)     │  │
│  │        ╲                       │  │
│  │    ═══════ ←── "Cracker River" │  │
│  │        ╱    (S-curve flow)     │  │
│  │    ○ ○ ○ ←── "Grape Trio"      │  │
│  │             (odd clusters)     │  │
│  └────────────────────────────────┘  │
│                                      │
│  💡 Pro tip: Let the brie sit out    │
│     10 min — it spreads like butter  │
│                                      │
│  [I Plated It! 📸]  [Start Over]    │
│                                      │
└──────────────────────────────────────┘
         │
         ▼
STEP 4: VIBE CHECK (10 sec)
┌──────────────────────────────────────┐
│  [User uploads photo of their plate] │
│                                      │
│  Analyzing your vibe...              │
│                                      │
└──────────────────────────────────────┘
         │
         ▼
STEP 5: FINAL VALIDATION + SHARE
┌──────────────────────────────────────┐
│                                      │
│  "The French Affair"                 │
│                                      │
│  VIBE CHECK: 78/100                  │
│  ─────────────────────────────       │
│  Rank: "Casual Elegance"             │
│                                      │
│  "The S-curve is giving main         │
│   character energy. The grape        │
│   placement? *Chef's kiss.*"         │
│                                      │
│  ┌────────────────────────────┐      │
│  │   [User's photo with       │      │
│  │    "NAILED IT" sticker]    │      │
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
| **1. The Name** | 0-5 sec | Instant name + validation | "Oh that's cute!" (smile) |
| **2. The Blueprint** | 5-15 sec | Visual guide appears | "I can do this" (confidence) |
| **3. The Vibe Check** | 30-60 sec | Photo scored + praised | "I did it!" (pride) |

**Key insight:** Each beat provides validation at a different stage:
- Beat 1: "Your ingredients are valid"
- Beat 2: "Here's how to make them beautiful"  
- Beat 3: "You did a great job"

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
              │  • Determine visual rules    │
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
    │ ingredients │  │ structured  │  │ user photo  │
    │ + template  │  │ prompt from │  │ + blueprint │
    │             │  │ logic bridge│  │ + rules     │
    │             │  │             │  │             │
    │ Output:     │  │ Output:     │  │ Output:     │
    │ name, tips, │  │ sketch      │  │ score,      │
    │ vibe label  │  │ image       │  │ feedback,   │
    │             │  │             │  │ sticker     │
    └─────────────┘  └─────────────┘  └─────────────┘
           │                 │                 │
           ▼                 ▼                 ▼
    ┌─────────────────────────────────────────────────┐
    │                 FRONTEND                        │
    │                                                 │
    │  Screen 1: Input                                │
    │  Screen 2: Name + Validation (instant)         │
    │  Screen 3: Blueprint (on demand)               │
    │  Screen 4: Camera                              │
    │  Screen 5: Vibe Check + Share                  │
    └─────────────────────────────────────────────────┘
```

---

## API Call Specifications

### CALL 1: The Namer (Instant Gratification)

**When:** Immediately after input
**Model:** Claude 3 Haiku (fast, cheap)
**Latency target:** <2 seconds

```javascript
// Input
{
  ingredients: ["brie", "crackers", "grapes", "salami"],
  template: "wild_graze",  // from logic bridge
  vibe: "girl_dinner"
}

// Prompt (see PROMPTS-GIRL-DINNER.md)

// Output
{
  name: "The French Affair",
  validation: "That's a real dinner. You're doing great.",
  tip: "Let the brie sit out 10 min — it spreads like butter",
  vibeLabel: "Casual Elegance"
}
```

---

### CALL 2: The Sketch Artist (Visual Guide)

**When:** User taps "See the Blueprint"
**Model:** DALL-E 3
**Latency target:** <10 seconds

```javascript
// Input: Structured prompt from Logic Bridge
const sketchPrompt = `
A minimalist, hand-drawn architectural sketch on cream paper.
Style: Black ink, clean lines, culinary blueprint aesthetic.

LAYOUT: The Anchor (one hero item with satellites)
- Board/plate: Round, simple outline

INGREDIENT PLACEMENTS:
• ANCHOR: "Brie Wheel" - Large wedge at center-left, cut to show interior
  Label with thin arrow: "The Main Character"
  
• FILLER: "Salami Stream" - Folded slices in loose S-curve from anchor
  Dotted line showing flow direction
  
• FILLER: "Cracker Arc" - Fanned crackers along bottom edge
  Label: "The Foundation"
  
• POP: "Grape Trio" - Exactly 3 grapes clustered top-right
  Small circles with label: "The Pops"

VISUAL ELEMENTS:
- Thin architectural call-out lines with handwritten labels
- Small arrows showing placement direction
- Dotted S-curve showing "flow" of arrangement
- Clean negative space (30% of image)

DO NOT include any ingredients not listed above.
Make it look like a designer's quick sketch, not a photograph.
`;

// Output: Image URL
```

---

### CALL 3: The Vibe Judge (Photo Analysis)

**When:** User uploads their plated photo
**Model:** GPT-4o Vision
**Latency target:** <5 seconds

```javascript
// Input
{
  userPhoto: "[base64 or URL]",
  originalIngredients: ["brie", "crackers", "grapes", "salami"],
  blueprintRules: [
    "S-curve flow",
    "Odd number clusters (grapes should be 3 or 5)",
    "Anchor prominence (brie should be focal)",
    "Color distribution"
  ],
  dinnerName: "The French Affair"
}

// Prompt
const vibeCheckPrompt = `
You are the Vibe Judge for CharcuterME, a playful food styling app.

Analyze this photo of a "girl dinner" / grazing plate.

SCORING CRITERIA (be generous, this is for fun):
1. S-Curve Flow (0-25): Do items create visual movement?
2. Clustering (0-25): Are small items in odd groupings (3s, 5s)?
3. Color Balance (0-25): Are colors distributed, not clumped?
4. Overall Vibe (0-25): Does it look intentional and appetizing?

PERSONALITY:
- Be encouraging, not critical
- Find something to genuinely compliment
- Keep it playful and fun
- This is validation, not a cooking competition

OUTPUT FORMAT:
{
  "score": 78,
  "rank": "Casual Elegance",
  "compliment": "The S-curve is giving main character energy. The grape placement? *Chef's kiss.*",
  "stickerSuggestion": "NAILED IT",
  "oneImprovement": "Next time, fan those crackers just a bit more"
}

RANK SCALE:
90-100: "Graze Queen" / "Chef's Kiss"
75-89: "Casual Elegance" / "Main Character"  
60-74: "Solid Effort" / "Vibe Achieved"
40-59: "Chaotic Good" / "Art is Subjective"
<40: "Chaos Coordinator" / "Points for Trying"

Remember: The goal is to make them feel good about what they made.
Even a messy plate deserves encouragement.
`;

// Output
{
  score: 78,
  rank: "Casual Elegance",
  compliment: "The S-curve is giving main character energy...",
  stickerSuggestion: "NAILED IT",
  oneImprovement: "Next time, fan those crackers just a bit more"
}
```

---

## Sticker System

### Score-Based Sticker Selection

```javascript
const STICKERS = {
  legendary: {  // 90-100
    options: ["GRAZE QUEEN 👑", "CHEF'S KISS 💋", "100% THAT BOARD"],
    style: "gold, sparkly"
  },
  great: {  // 75-89
    options: ["MAIN CHARACTER ✨", "NAILED IT!", "CASUAL ELEGANCE"],
    style: "clean, confident"
  },
  good: {  // 60-74
    options: ["VIBE ACHIEVED ✓", "SOLID EFFORT", "WE LOVE TO SEE IT"],
    style: "friendly, warm"
  },
  chaotic: {  // 40-59
    options: ["CHAOTIC GOOD 🔥", "ART IS SUBJECTIVE", "IT'S GIVING... SOMETHING"],
    style: "playful, self-deprecating"
  },
  messy: {  // <40
    options: ["I TRIED 🤷", "POINTS FOR TRYING", "FRIDGE TO FLOOR"],
    style: "comic sans, bold"
  }
};

function selectSticker(score, aiSuggestion) {
  const tier = score >= 90 ? 'legendary' 
             : score >= 75 ? 'great'
             : score >= 60 ? 'good'
             : score >= 40 ? 'chaotic'
             : 'messy';
  
  // Use AI suggestion if it matches tier, otherwise random from tier
  const tierStickers = STICKERS[tier].options;
  if (tierStickers.includes(aiSuggestion)) {
    return aiSuggestion;
  }
  return tierStickers[Math.floor(Math.random() * tierStickers.length)];
}
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
│  │ grapes, salami       │  │
│  └──────────────────────┘  │
│                            │
│  [Make it a Spread →]      │
│                            │
│  Just type what's in       │
│  your fridge. No fancy     │
│  ingredients required.     │
└────────────────────────────┘
```

### Screen 2: Instant Validation (THE AHA MOMENT)
```
┌────────────────────────────┐
│                            │
│  Tonight's Dinner:         │
│                            │
│  "The French Affair"       │
│                            │
│  ───────────────────────   │
│                            │
│  ✓ That's a real dinner.   │
│    You're doing great.     │
│                            │
│  ┌────────────────────┐    │
│  │ See the Blueprint  │    │
│  └────────────────────┘    │
│                            │
│  [Just Eat →]              │
│                            │
└────────────────────────────┘

Note: "Just Eat" exits happy.
"See the Blueprint" continues to visual guide.
```

### Screen 3: The Blueprint
```
┌────────────────────────────┐
│  "The French Affair"       │
│  ────────────────────────  │
│  ┌──────────────────────┐  │
│  │                      │  │
│  │   [AI-generated      │  │
│  │    sketch image      │  │
│  │    from DALL-E 3]    │  │
│  │                      │  │
│  └──────────────────────┘  │
│                            │
│  💡 Let the brie sit out   │
│     10 min to soften       │
│                            │
│  ┌────────────────────┐    │
│  │  I Plated It! 📸   │    │
│  └────────────────────┘    │
│                            │
│  [Start Over]              │
└────────────────────────────┘
```

### Screen 4: Camera
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
│  [Skip → Use Saved Photo]  │
└────────────────────────────┘
```

### Screen 5: Vibe Check Results
```
┌────────────────────────────┐
│  "The French Affair"       │
│  ────────────────────────  │
│                            │
│  VIBE CHECK                │
│  ┌──────────────────────┐  │
│  │        78            │  │
│  │  ████████████░░░░░   │  │
│  │  "Casual Elegance"   │  │
│  └──────────────────────┘  │
│                            │
│  "The S-curve is giving    │
│   main character energy.   │
│   *Chef's kiss.*"          │
│                            │
│  ┌──────────────────────┐  │
│  │  [Photo with         │  │
│  │   NAILED IT sticker] │  │
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
| After name | Name + validation | 40% |
| After blueprint | Name + visual guide | 30% |
| After vibe check | Full experience | 30% |

**Design principle:** Every exit is a happy exit. No dead ends.

---

## Implementation Phases

### Phase 1: MVP (Week 1)
- Input screen
- Name generation (Claude Haiku)
- Instant validation screen
- Skip blueprint/vibe check (just validation)

### Phase 2: Visual (Week 2)
- Add "See Blueprint" button
- DALL-E 3 sketch generation
- Blueprint display screen

### Phase 3: Vibe Check (Week 3)
- Camera integration
- GPT-4o Vision scoring
- Results screen with stickers

### Phase 4: Share (Week 4)
- Photo + sticker compositing
- Share to Instagram/TikTok
- Save to camera roll

---

## Cost Estimates (Per Session)

| Call | Model | Est. Cost |
|------|-------|-----------|
| Name | Claude Haiku | $0.001 |
| Sketch | DALL-E 3 | $0.04 |
| Vibe Check | GPT-4o Vision | $0.01 |
| **Total** | | **$0.05/session** |

If 60% of users stop at naming: **$0.02 avg/session**

---

## Summary: The Three-Beat Experience

```
BEAT 1: THE NAME (5 sec)
"Your ingredients have a name. You're valid."
→ Instant dopamine hit
→ 40% exit here (happy)

BEAT 2: THE BLUEPRINT (15 sec)
"Here's how to make it beautiful."
→ Confidence boost
→ 30% exit here (inspired)

BEAT 3: THE VIBE CHECK (30 sec)
"You did it! Here's your score."
→ Pride + shareability
→ 30% complete full loop
```

Every beat provides validation. Every exit is a win.
