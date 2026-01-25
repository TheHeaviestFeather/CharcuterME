# CharcuterME
## Turn Fridge Chaos Into Culinary Art

---

## The Experience (60 seconds)

```
INPUT → REVEAL → PLATE → VIBE CHECK → SHARE
 (5s)   (10s)    (30s)     (10s)      (done!)
```

### The Three Emotional Beats

| Beat | Time | What Happens | User Feels |
|------|------|--------------|------------|
| **1. The Name** | 0-5s | "Cheese Is A Personality" | "lol that's me" (chuckle) |
| **2. The Blueprint** | 5-15s | Ghibli-style sketch appears | "I can do this" (confidence) |
| **3. The Vibe Check** | 30-60s | Score: 78 "UNDERSTOOD THE ASSIGNMENT" | "I did it!" (pride) |

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
| `src/lib/ai-clients.ts` | Shared AI client utilities |
| `src/lib/constants.ts` | Brand colors, model names, settings |

---

## The System

### Architecture
```
User Input → Logic Bridge → AI Calls → User Interface
              (classify)    (name,     (4 screens)
                            sketch,
                            score)
```

### AI Calls

| Call | Model | Purpose | Cost |
|------|-------|---------|------|
| 1. Namer | Claude Haiku | Snarky name + validation | $0.001 |
| 2. Sketch | DALL-E 3 | Ghibli-style blueprint | $0.040 |
| 3. Judge | GPT-4o Vision | Snarky photo scoring | $0.010 |

**Avg cost per session:** ~$0.02 (most users exit after naming)

---

## Key Design Decisions

### Why "Girl Dinner" Framing?

| Charcuterie Framing | Girl Dinner Framing |
|---------------------|---------------------|
| "Culinary art" | "Whatever you have is enough" |
| Aspirational | Validating with snarky humor |
| "You should try this" | "You looked in your fridge and said 'this is fine.' Iconic." |

We lead with validation AND humor, not aspiration.

### Why Three Beats?

Each beat catches users at different commitment levels:
- **40%** exit after name (got validation, happy)
- **30%** exit after blueprint (got guidance, inspired)
- **30%** complete full loop (got score + shareable)

No dead ends. Every exit is a win.

---

## Screens (4-Screen Flow)

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

### 2. Reveal (Combined Name + Blueprint)
```
┌────────────────────────────┐
│  Tonight's Dinner:         │
│                            │
│  "Cheese Is A Personality" │
│                            │
│  "Your calcium intake is   │
│   giving main character    │
│   energy."                 │
│                            │
│  [Ghibli-style sketch]     │
│                            │
│  💡 Room temp brie is      │
│     self-care.             │
│                            │
│  [I Plated It! 📸]         │
│  [Start Over]              │
└────────────────────────────┘
```

### 3. Camera
```
┌────────────────────────────┐
│  [Camera / Upload]         │
│                            │
│  [Check My Vibe]           │
└────────────────────────────┘
```

### 4. Results
```
┌────────────────────────────┐
│  VIBE CHECK: 78            │
│  "Main Character"          │
│                            │
│  "The grape placement is   │
│   giving 'I read one       │
│   article about plating.'  │
│   We're obsessed."         │
│                            │
│  [Photo + UNDERSTOOD THE   │
│   ASSIGNMENT sticker]      │
│                            │
│  [Share] [Save] [Again]    │
└────────────────────────────┘
```

---

## Stickers

| Score | Rank | Stickers |
|-------|------|----------|
| 90-100 | Graze Girlboss | "SLAY", "NO NOTES", "OBSESSED" |
| 75-89 | Main Character | "ATE THAT UP", "UNDERSTOOD THE ASSIGNMENT" |
| 60-74 | Chaotic Good | "TRUST THE PROCESS", "VALID" |
| 40-59 | Beautiful Disaster | "CHAOS IS ART", "STILL ATE THO" |

**Minimum score:** 40 (we're not monsters)

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
| Resilience | Circuit breakers, retry logic, timeouts |

---

## Success Metric

> **Did they chuckle at the name?**

Everything else is secondary.

---

*Whatever you have is enough.*
