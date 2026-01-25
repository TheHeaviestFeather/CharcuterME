# CharcuterME
## Turn Fridge Chaos Into Culinary Art

---

## The Experience (60 seconds)

```
INPUT → NAME → BLUEPRINT → PLATE → VIBE CHECK → SHARE
 (5s)   (5s)    (10s)      (30s)     (10s)      (done!)
```

### The Three Emotional Beats

| Beat | Time | What Happens | User Feels |
|------|------|--------------|------------|
| **1. The Name** | 0-5s | "The French Affair" | "Oh that's cute!" (smile) |
| **2. The Blueprint** | 5-15s | AI sketch appears | "I can do this" (confidence) |
| **3. The Vibe Check** | 30-60s | Score: 78 "NAILED IT!" | "I did it!" (pride) |

Every beat provides validation. Every exit is a win.

---

## Quick Start

### 1. Open the prototype
```bash
open charcuterme-prototype.html
```

### 2. Try it
- Enter: `brie, crackers, grapes, salami`
- Click "Make it a Spread"
- See your dinner named instantly
- (Optional) View the blueprint
- (Optional) Upload a photo for vibe check

### 3. For production
Replace `YOUR_CLAUDE_API_KEY` and `YOUR_OPENAI_API_KEY` with real keys (use a backend proxy to protect them).

---

## Files

| File | Purpose |
|------|---------|
| `charcuterme-prototype.html` | Working demo (all 5 screens) |
| `logic-bridge.js` | Classification engine |
| `ARCHITECTURE.md` | Full system design |
| `PROMPTS.md` | AI prompts for all 3 calls |

---

## The System

### Architecture
```
User Input → Logic Bridge → AI Calls → User Interface
              (classify)    (name,     (5 screens)
                            sketch,
                            score)
```

### AI Calls

| Call | Model | Purpose | Cost |
|------|-------|---------|------|
| 1. Namer | Claude Haiku | Instant name + validation | $0.001 |
| 2. Sketch | DALL-E 3 | Visual blueprint | $0.040 |
| 3. Judge | GPT-4o Vision | Photo scoring | $0.010 |

**Avg cost per session:** ~$0.02 (most users exit after naming)

---

## Key Design Decisions

### Why "Girl Dinner" vs "Charcuterie Board"?

| Charcuterie Framing | Girl Dinner Framing |
|---------------------|---------------------|
| "Culinary art" | "Whatever you have is enough" |
| Aspirational | Validating |
| "You should try this" | "You're already doing great" |

We lead with validation, not aspiration. The sketch is optional upgrade, not required.

### Why Three Beats?

Each beat catches users at different commitment levels:
- **40%** exit after name (got validation, happy)
- **30%** exit after blueprint (got guidance, inspired)
- **30%** complete full loop (got score + shareable)

No dead ends. Every exit is a win.

### Why Separate AI Calls?

1. **Speed** — Name in 2s (instant gratification)
2. **Cost** — Only pay for features users want
3. **Flexibility** — Can upgrade/change models per call

---

## Logic Bridge

The Logic Bridge classifies ingredients and selects templates:

```javascript
const { generateImagePrompt } = require('./logic-bridge');

const result = generateImagePrompt("brie, crackers, grapes");

console.log(result.debug.template);  // "Anchor Focus"
console.log(result.debug.anchors);   // ["brie"]
console.log(result.debug.fillers);   // ["crackers"]
console.log(result.debug.pops);      // ["grapes"]
console.log(result.prompt);          // Full prompt for DALL-E
```

### Templates

| Template | When | Layout |
|----------|------|--------|
| Minimalist | ≤3 items | Clean, sparse |
| Anchor Focus | 1 hero item | Center + satellites |
| Wild Graze | 5+ items | S-curve flow |
| Bento | 4+ categories | Grid zones |
| Casual Scatter | Default | Natural, imperfect |

### Visual Rules

| Rule | Applies When |
|------|--------------|
| Odd Number Cluster | Has grapes, olives, nuts |
| S-Curve Flow | Has crackers, carrots |
| Fan Arrangement | Has pita, apple slices |
| Container Rule | Has dips |

---

## Screens

### 1. Input
```
┌────────────────────────────┐
│  CharcuterME               │
│                            │
│  What do you have?         │
│  ┌──────────────────────┐  │
│  │ brie, crackers...    │  │
│  └──────────────────────┘  │
│                            │
│  [Make it a Spread →]      │
└────────────────────────────┘
```

### 2. Name (THE AHA MOMENT)
```
┌────────────────────────────┐
│  Tonight's Dinner:         │
│                            │
│  "The French Affair"       │
│                            │
│  ✓ That's a real dinner.   │
│                            │
│  [See the Blueprint]       │
│  [Just Eat →]              │
└────────────────────────────┘
```

### 3. Blueprint
```
┌────────────────────────────┐
│  [AI-generated sketch]     │
│                            │
│  💡 Let the brie sit out   │
│     10 min to soften       │
│                            │
│  [I Plated It! 📸]         │
└────────────────────────────┘
```

### 4. Camera
```
┌────────────────────────────┐
│  [Camera / Upload]         │
│                            │
│  [Check My Vibe ✨]        │
└────────────────────────────┘
```

### 5. Results
```
┌────────────────────────────┐
│  VIBE CHECK: 78            │
│  "Casual Elegance"         │
│                            │
│  [Photo + NAILED IT!]      │
│                            │
│  [Share] [Save] [Again]    │
└────────────────────────────┘
```

---

## Stickers

| Score | Rank | Stickers |
|-------|------|----------|
| 90-100 | Graze Queen | "CHEF'S KISS 💋", "100% THAT BOARD" |
| 75-89 | Casual Elegance | "NAILED IT!", "MAIN CHARACTER ✨" |
| 60-74 | Vibe Achieved | "WE LOVE TO SEE IT", "SOLID EFFORT" |
| 40-59 | Chaotic Good | "ART IS SUBJECTIVE", "IT'S GIVING..." |
| <40 | Chaos Coordinator | "I TRIED 🤷", "POINTS FOR TRYING" |

**Minimum score:** 35 (we're not mean)

---

## Brand Colors

| Use | Color | Hex |
|-----|-------|-----|
| Primary | Mocha Mousse | `#A47864` |
| Secondary | Digital Lavender | `#A78BFA` |
| Accent | Hyper-Coral | `#FF6F61` |
| Neutral | Cloud Dancer | `#F0EDE9` |
| Ink | Architectural Charcoal | `#2B2B2B` |

---

## Tech Stack (Production)

| Layer | Tool |
|-------|------|
| Frontend | React Native or Flutter |
| Backend | Vercel Functions (Node.js) |
| Auth | Firebase Auth (optional) |
| Storage | Firebase Storage (for photos) |
| AI - Naming | Claude 3 Haiku |
| AI - Sketches | DALL-E 3 |
| AI - Vision | GPT-4o |

---

## Roadmap

### Phase 1: MVP (This)
- ✅ Text input
- ✅ Name generation
- ✅ Blueprint (demo)
- ✅ Photo upload
- ✅ Vibe scoring (demo)
- ✅ Stickers

### Phase 2: Polish
- [ ] Real DALL-E 3 integration
- [ ] Real GPT-4o Vision integration
- [ ] Photo compositing with stickers
- [ ] Social sharing
- [ ] Save to camera roll

### Phase 3: Scale
- [ ] Fridge scan (photo → ingredients)
- [ ] Community gallery
- [ ] Brand partnerships
- [ ] AR plating guide

---

## Success Metric

> **Did they smile at the name?**

Everything else is secondary.

---

## Run Tests

```bash
# Test the logic bridge
node logic-bridge.js

# Open the prototype
open charcuterme-prototype.html
```

---

## Credits

Merged from:
- **CharcuterME PRD** — Product vision, brand kit, roadmap
- **Scraps to Spread** — Logic Bridge implementation, prompts, prototypes

---

*Whatever you have is enough.*
