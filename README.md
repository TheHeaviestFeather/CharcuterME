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

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

Create a `.env.local` file:
```bash
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key
```

---

## Files

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | Full system design |
| `PROMPTS.md` | AI prompts for all 3 calls |
| `src/lib/logic-bridge.ts` | Classification engine |

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

We lead with validation, not aspiration.

### Why Three Beats?

Each beat catches users at different commitment levels:
- **40%** exit after name (got validation, happy)
- **30%** exit after blueprint (got guidance, inspired)
- **30%** complete full loop (got score + shareable)

No dead ends. Every exit is a win.

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
| 90-100 | Graze Queen | "CHEF'S KISS", "100% THAT BOARD" |
| 75-89 | Casual Elegance | "NAILED IT!", "MAIN CHARACTER" |
| 60-74 | Vibe Achieved | "WE LOVE TO SEE IT", "SOLID EFFORT" |
| 40-59 | Chaotic Good | "ART IS SUBJECTIVE", "IT'S GIVING..." |
| <40 | Chaos Coordinator | "I TRIED", "POINTS FOR TRYING" |

**Minimum score:** 35 (we're not mean)

---

## Brand Colors

| Use | Color | Hex |
|-----|-------|-----|
| Primary | Mocha | `#A47864` |
| Secondary | Lavender | `#A78BFA` |
| Accent | Coral | `#FF6F61` |
| Neutral | Cream | `#FAF9F7` |

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Frontend | Next.js 14 + React + TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| AI - Naming | Claude 3 Haiku |
| AI - Sketches | DALL-E 3 |
| AI - Vision | GPT-4o |

---

## Success Metric

> **Did they smile at the name?**

Everything else is secondary.

---

*Whatever you have is enough.*
