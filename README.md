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
| **2. The Blueprint** | 5-15s | Ghibli-style illustration | "I can do this" (confidence) |
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
# Required
ANTHROPIC_API_KEY=sk-ant-...    # Claude API key
OPENAI_API_KEY=sk-...           # OpenAI API key

# Optional - Cost Optimization
GPT_VISION_MODEL=gpt-4o         # or gpt-4o-mini for 70% savings on vibe checks

# Optional - Feature Flags
ENABLE_DALLE=true
ENABLE_VIBE_CHECK=true
ENABLE_CLAUDE_NAMING=true
```

---

## Files

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | Full system design |
| `PROMPTS.md` | AI prompts for all 3 calls |
| `QA-TEST-SUITE.md` | Testing & validation |
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
| 1. Namer | Claude 3.5 Haiku | Instant name + validation | $0.001 |
| 2. Sketch | DALL-E 3 | Studio Ghibli illustration | $0.040 |
| 3. Judge | GPT-4o Vision | Photo scoring | $0.010 |

**With gpt-4o-mini:** Vibe check drops to $0.003 (~70% savings)

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

### Why Ghibli Style?

The illustration style matters:
- **Warm, inviting** — not clinical or commercial
- **Achievable** — looks like something they could make
- **Shareable** — aesthetic enough for social media
- **Cozy** — matches "girl dinner" comfort vibe

---

## Visual Style

All generated images follow the Studio Ghibli aesthetic:

| Element | Requirement |
|---------|-------------|
| Colors | Warm, muted, soft gradients |
| Lighting | Golden hour, top-left |
| Texture | Watercolor, hand-painted |
| Mood | Cozy, inviting, nostalgic |
| Angle | 45-degree (Instagram-style) |
| Background | Creamy linen, shallow DoF |

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
│    You're doing great.     │
│                            │
│  [See the Blueprint]       │
│  [Just Eat →]              │
└────────────────────────────┘
```

### 3. Blueprint (Ghibli Illustration)
```
┌────────────────────────────┐
│  "The French Affair"       │
│                            │
│  ┌──────────────────────┐  │
│  │                      │  │
│  │  [Ghibli-style       │  │
│  │   food illustration] │  │
│  │                      │  │
│  └──────────────────────┘  │
│                            │
│  💡 Room temp brie is      │
│     self-care              │
│                            │
│  [I Plated It! 📸]         │
└────────────────────────────┘
```

### 4. Vibe Check Results
```
┌────────────────────────────┐
│  VIBE CHECK                │
│                            │
│        78                  │
│  ████████████░░░░░         │
│  "Main Character"          │
│                            │
│  "The S-curve is giving    │
│   main character energy."  │
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

## Sticker System

Stickers are selected by tier (not exact match from AI):

| Score | Tier | Example Stickers |
|-------|------|------------------|
| 90-100 | `legendary` | GRAZE QUEEN 👑, CHEF'S KISS 💋 |
| 75-89 | `great` | NAILED IT!, MAIN CHARACTER ✨ |
| 60-74 | `good` | WE LOVE TO SEE IT, VIBE ACHIEVED ✓ |
| 45-59 | `chaotic` | CHAOTIC GOOD 🔥, ART IS SUBJECTIVE |
| 35-44 | `messy` | I TRIED 🤷, POINTS FOR TRYING |

AI returns `stickerTier`, client randomly selects from that tier's options.

---

## Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --grep "namer"
npm test -- --grep "sketch"
npm test -- --grep "vibe"
```

See `QA-TEST-SUITE.md` for full test coverage.

---

## Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

Required environment variables in Vercel:
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`

Optional:
- `GPT_VISION_MODEL` (defaults to `gpt-4o`)

---

## Cost Optimization

| Optimization | Savings |
|--------------|---------|
| GPT-4o-mini for vibe checks | 70% on vision calls |
| `detail: 'low'` for images | 50% on vision tokens |
| Exit after name (40% users) | Skip DALL-E cost |

Set `GPT_VISION_MODEL=gpt-4o-mini` to enable cheaper vision.

---

## License

MIT

---

*Built with 🧀 and chaos*
