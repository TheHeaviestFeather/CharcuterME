# Logic Bridge Updates v3.0

## Summary

The `buildImagePrompt` function in `src/lib/logic-bridge.ts` needs to be updated to match the new prompt style.

---

## Current vs New

### Current (in logic-bridge.ts)
```typescript
return `Studio Ghibli-style watercolor illustration, overhead flat-lay perspective like an Instagram food photo.

A beautiful ${boardStyle} with ${ingredientNames} arranged in an aesthetic "${template.name}" layout.

Style: Soft watercolor textures, warm golden hour lighting, cozy and inviting atmosphere. Gentle shadows, creamy background with subtle linen texture.

The food looks delicious and carefully arranged. Dreamy, whimsical Ghibli aesthetic with rich warm colors. Perfect for social media sharing.

Overhead bird's-eye view, centered composition, soft natural lighting from the side.`.trim();
```

### Issues
1. Says "overhead flat-lay" but Instagram food photos are typically 45-degree angle
2. Missing explicit negative constraints (NO text, NO hands, etc.)
3. Missing layout guidance based on template
4. No ingredient count limits

---

## Option A: Update logic-bridge.ts

Replace the `buildImagePrompt` function with:

```typescript
// =============================================================================
// PART 8: PROMPT BUILDER (Updated v3.0)
// =============================================================================

const LAYOUT_GUIDES: Record<string, string> = {
  'The Minimalist': 'Intentional negative space, single focal point placed slightly off-center using rule of thirds, gallery-like elegance with room to breathe',
  'The Wild Graze': 'Organic S-curve flow connecting all items naturally, clustered in pleasing odd numbers (3s and 5s), abundant but not cluttered',
  'The Anchor': 'Central anchor item with other items radiating outward in a natural spiral, hero-focused composition',
  'The Snack Line': 'Linear arrangement with dip as focal point, dippers fanned around it, functional yet aesthetic',
  'The Bento': 'Organized zones for each item type, clean visual separation between groups, satisfying orderly arrangement',
  'casual': 'Relaxed natural placement as if someone just set it down, effortlessly charming, not too perfect',
};

export function buildImagePrompt(
  classified: ClassifiedIngredient[], 
  template: Template, 
  _rules: VisualRule[]
): string {
  // Limit ingredients (DALL-E works better with fewer items)
  const limitedIngredients = classified.slice(0, 8);
  const ingredientNames = limitedIngredients.map((i) => i.displayName).join(', ');
  
  // Get layout guidance
  const layoutGuide = LAYOUT_GUIDES[template.name] || LAYOUT_GUIDES.casual;
  
  // Board/plate style
  const boardStyle = template.layout.boardShape || 'cute white ceramic plate';

  return `Studio Ghibli-style illustration, 45-degree angle like an Instagram food photo.

${ingredientNames} casually arranged on a ${boardStyle}, cozy girl dinner vibes.

STYLE:
- Soft, dreamy Ghibli watercolor textures
- Warm golden hour lighting from the left side
- Gentle, inviting shadows
- That magical Ghibli glow that makes everything look delicious
- Hand-painted feel, slightly whimsical
- Colors are warm and appetizing, never harsh or oversaturated

COMPOSITION:
- Creamy linen fabric background with soft natural folds
- Shallow depth of field, background gently blurred
- ${layoutGuide}
- Food looks delicious and effortlessly styled
- Cute but not trying too hard — casual elegance
- Centered composition with breathing room around the plate

MOOD:
- Cozy evening comfort food vibes
- Self-care energy
- Like a still frame from Kiki's Delivery Service or Howl's Moving Castle
- Warm, inviting, makes you want to reach in and grab something

CRITICAL - DO NOT INCLUDE:
- NO text, labels, writing, or watermarks of any kind
- NO hands, fingers, or people
- NO utensils, forks, knives, or chopsticks
- NO other food items beyond: ${ingredientNames}
- NO photorealistic 3D rendering
- NO harsh dramatic lighting or shadows
- NO busy or cluttered backgrounds

The final image should feel like a warm hug in food form.`.trim();
}
```

---

## Option B: Move Prompt Building to Route

If you prefer to keep the prompt building in the API route (as the new `sketch/route.ts` does), then:

1. The route builds its own prompt using `buildGhibliPrompt()`
2. The logic bridge's `buildImagePrompt()` is no longer used
3. Still call `processGirlDinner()` for template selection and rules

Update the route to ignore `processed.prompt`:

```typescript
// In sketch/route.ts
const processed = processGirlDinner(ingredients);
const template = processed.templateSelected;

// Build prompt in route, not from logic bridge
const prompt = buildGhibliPrompt(ingredientList, template);

// Use our prompt, not processed.prompt
const response = await openai.images.generate({
  prompt: prompt,  // NOT processed.prompt
  // ...
});
```

---

## Recommendation

**Use Option A** — keeps prompt logic centralized in logic-bridge.ts where template selection also happens. The route just calls `processGirlDinner()` and uses the returned `prompt`.

This maintains the architecture's intent:
```
Logic Bridge: Classification + Template + Prompt Building
Route: Just calls API with the prompt
```

---

## Files to Update

| File | Change |
|------|--------|
| `src/lib/logic-bridge.ts` | Replace `buildImagePrompt` function |
| `PROMPTS.md` | Already updated (use docs version) |
| `QA-TEST-SUITE.md` | Already updated |
| `ARCHITECTURE.md` | Apply updates from ARCHITECTURE-UPDATES.md |
| `README.md` | Already updated |

---

## Testing After Update

```bash
# Test that sketch generation still works
curl -X POST http://localhost:3000/api/sketch \
  -H "Content-Type: application/json" \
  -d '{"ingredients": "brie, crackers, grapes"}'

# Verify image has:
# - Ghibli aesthetic (warm, soft, dreamy)
# - 45-degree angle (not flat overhead)
# - Only listed ingredients
# - No text or labels
# - Creamy linen background
```
