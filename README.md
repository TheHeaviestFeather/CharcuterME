# CharcuterME Prompt Rewrites v3.0

## Overview

Three production-ready API routes with improved prompts:

| File | Model | Purpose |
|------|-------|---------|
| `api/name/route.ts` | Claude (any) | Girl dinner naming |
| `api/sketch/route.ts` | DALL-E 3 | Studio Ghibli-style food illustration |
| `api/vibe/route.ts` | GPT-4o | Photo scoring with context |

---

## Key Improvements

### 1. Namer (Claude)

**Before:**
```typescript
messages: [{ role: 'user', content: hugePromptWithEverything }]
```

**After:**
```typescript
system: SYSTEM_PROMPT,  // Personality & rules
messages: [{ role: 'user', content: `Name this girl dinner: ${ingredients}` }]
```

**Changes:**
- ✅ Proper system message (better role adherence)
- ✅ XML-structured examples (clearer pattern matching)
- ✅ Explicit bad examples (prevents "Mediterranean Mezze")
- ✅ Input sanitization (prevents prompt injection)
- ✅ Robust response parsing (handles markdown, code blocks)
- ✅ Model agnostic (`ANTHROPIC_API_KEY` works with any Claude model)
- ✅ Temperature 0.9 for creativity
- ✅ Prompt versioning for tracking

---

### 2. Sketch Artist (DALL-E 3)

**Before:**
```
A minimalist, hand-drawn architectural sketch on cream paper...
```

**After:**
```
Studio Ghibli-style illustration, 45-degree angle like an Instagram food photo.
${ingredients} casually arranged on a cute white plate, cozy girl dinner vibes.
Style: Soft dreamy Ghibli textures, warm golden hour lighting, gentle shadows...
```

**Changes:**
- ✅ Consistent Ghibli aesthetic (no more style confusion)
- ✅ Instagram-style angle (45 degrees, relatable)
- ✅ Warm, cozy mood throughout
- ✅ Explicit negative constraints (no text, no hands, no extra food)
- ✅ Template-based layouts (minimalist, wildGraze, bento, etc.)
- ✅ Max 8 ingredients (DALL-E works better with fewer items)
- ✅ Beautiful SVG fallback (not embarrassing ASCII)
- ✅ `style: 'natural'` for prompt accuracy

---

### 3. Vibe Judge (GPT-4o Vision)

**Before:**
```typescript
// Context passed to API but NOT used in prompt!
body: { photo, dinnerName, ingredients, rules }

// Prompt only said:
"Analyze this plate and give me a vibe score"
```

**After:**
```typescript
// Context INCLUDED in user message:
"Rate this girl dinner plate!
They named it: "The French Affair"
Ingredients they used: brie, crackers, grapes
Plating tips to look for: S-curve flow, Odd clusters"
```

**Changes:**
- ✅ Context actually used (dinnerName, ingredients, rules)
- ✅ Tier-based stickers (AI returns tier, we select sticker)
- ✅ Score floor IN prompt (not post-hoc adjustment)
- ✅ Edge case handling (blurry, not food, minimal)
- ✅ `detail: 'low'` for cost savings
- ✅ Temperature 0.7 for consistency
- ✅ Proper error responses for non-food images

---

## Cost Optimization

| Change | Savings |
|--------|---------|
| GPT-4o → GPT-4o-mini | ~70% on vibe checks |
| `detail: 'low'` | ~50% on vision tokens |
| Shorter prompts | ~30% on input tokens |
| Response caching | Variable |

To use GPT-4o-mini, set environment variable:
```bash
GPT_VISION_MODEL=gpt-4o-mini
```

---

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Optional
GPT_VISION_MODEL=gpt-4o          # or gpt-4o-mini for cost savings
```

---

## File Structure

```
api/
├── name/
│   └── route.ts      # Claude namer
├── sketch/
│   └── route.ts      # DALL-E Ghibli sketches  
└── vibe/
    └── route.ts      # GPT-4o vision scorer
```

---

## Testing Checklist

### Namer
- [ ] Returns valid JSON
- [ ] Name is 2-4 words
- [ ] Validation starts with ✓
- [ ] Tip references actual ingredients
- [ ] Responds < 2 seconds
- [ ] Handles emoji in input
- [ ] Rejects prompt injection attempts

### Sketch
- [ ] Image has Ghibli aesthetic
- [ ] Only listed ingredients appear
- [ ] No text/labels in image
- [ ] Warm lighting, soft shadows
- [ ] Falls back to SVG gracefully
- [ ] Responds < 15 seconds

### Vibe Check
- [ ] Score is 35-100
- [ ] Compliment is specific to photo
- [ ] Sticker matches score tier
- [ ] Handles blurry images
- [ ] Handles non-food gracefully
- [ ] Responds < 10 seconds

---

## Migration Steps

1. Replace files in `src/app/api/`:
   - `name/route.ts`
   - `sketch/route.ts`
   - `vibe/route.ts`

2. Test locally:
   ```bash
   npm run dev
   ```

3. Verify fallbacks work:
   - Disable API keys temporarily
   - Check SVG fallback renders
   - Check fallback names are good

4. Deploy to staging first

5. Monitor logs for `promptVersion` to track

---

## Prompt Versioning

All prompts include version tracking:

```typescript
const PROMPT_VERSION = 'namer_v3.0';

logger.info('Name generated', {
  promptVersion: PROMPT_VERSION,
  // ...
});
```

Use this for A/B testing and debugging.
