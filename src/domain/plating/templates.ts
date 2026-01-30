/**
 * CharcuterME - Plating Templates
 * Template definitions for different plating styles
 */

import type { Template, IngredientSummary } from '@/types';

// =============================================================================
// Template Definitions
// =============================================================================

export const TEMPLATES: Record<string, Template> = {
  minimalist: {
    name: 'The Minimalist',
    conditions: (s) => s.total <= 3,
    description: 'Clean and simple. Each item gets breathing room.',
    layout: { style: 'asymmetric', negativeSpace: '50%+', boardShape: 'round plate' },
    rules: [
      'Place anchor off-center (rule of thirds)',
      'Leave at least 40% of plate empty',
      'Use odd numbers for grouped items',
      'Create diagonal tension between items',
    ],
    visualGuide: `+---------------------+
|     +---+     o     |
|     | A |           |
|     +---+   o o     |
+---------------------+`,
  },
  anchor: {
    name: 'The Anchor',
    conditions: (s) => (s.hasLarge || s.hasBulky) && s.anchors.length === 1,
    description: 'One big thing surrounded by supporting cast.',
    layout: { style: 'radial', negativeSpace: '30%', boardShape: 'round plate' },
    rules: [
      'Large item commands the center',
      'Smaller items orbit around the anchor',
      'Create visual rays extending outward',
      'Pops fill the perimeter',
    ],
    visualGuide: `+---------------------+
|  o    +-----+    o  |
|       |  A  |       |
|  o    +-----+    o  |
+---------------------+`,
  },
  snackLine: {
    name: 'The Snack Line',
    conditions: (s) => s.hasSpreadable && s.vehicles.length >= 1 && s.total <= 5,
    description: 'A dip and its entourage. Linear and functional.',
    layout: { style: 'linear', negativeSpace: '20%', boardShape: 'rectangular' },
    rules: [
      'Dip anchors one end',
      'Dippers fan toward the other end',
      'Create a gradient of item sizes',
      'Everything should be grabbable',
    ],
    visualGuide: `+---------------------------------+
|  [DIP]  ===  ===  ===  . . .   |
+---------------------------------+`,
  },
  bento: {
    name: 'The Bento',
    conditions: (s) => s.total >= 4 && s.total <= 6 && s.anchors.length >= 2,
    description: 'Organized zones. Distinct islands of deliciousness.',
    layout: { style: 'grid', negativeSpace: '15%', boardShape: 'rectangular' },
    rules: [
      'Each food type gets its own island',
      'Keep similar items together',
      'Maintain small gaps between zones',
      'Diagonal corners should contrast in color',
    ],
    visualGuide: `+---------------------+
| [A]     [F]         |
| [V]     [P P]       |
+---------------------+`,
  },
  wildGraze: {
    name: 'The Wild Graze',
    conditions: (s) => s.total >= 4,
    description: 'Organic S-curve flow. The classic girl dinner spread.',
    layout: { style: 's-curve', negativeSpace: '25%', boardShape: 'round board' },
    rules: [
      'Create an S-curve with long items',
      'Anchor items at curve endpoints',
      'Scatter pops in odd-number clusters',
      'Fill gaps with tiny items last',
      'Nothing should be perfectly aligned',
    ],
    visualGuide: `+-------------------------+
|   [A]  ===              |
|      ===  o o   [A]     |
+-------------------------+`,
  },
};

// =============================================================================
// Template Selection
// =============================================================================

/**
 * Select the best template based on ingredient summary
 */
export function selectTemplate(summary: IngredientSummary): Template {
  const order = ['minimalist', 'anchor', 'snackLine', 'bento', 'wildGraze'];
  for (const key of order) {
    if (TEMPLATES[key].conditions(summary)) {
      return TEMPLATES[key];
    }
  }
  return TEMPLATES.wildGraze;
}

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): Template {
  return TEMPLATES[templateId] || TEMPLATES.wildGraze;
}

/**
 * Get template reason explanation
 */
export function getTemplateReason(summary: IngredientSummary, template: Template): string {
  if (template.name === 'The Minimalist') return `Only ${summary.total} items - clean and simple`;
  if (template.name === 'The Anchor') return 'One large item dominates - centerpiece focus';
  if (template.name === 'The Snack Line') return 'Has dip + dippers - linear functional layout';
  if (template.name === 'The Bento') return 'Multiple anchors, moderate count - organized zones';
  return 'Good variety - organic S-curve flow';
}

// =============================================================================
// Template-specific Layout Prompts for Image Generation
// =============================================================================

export const TEMPLATE_LAYOUT_PROMPTS: Record<string, string> = {
  minimalist: `
LAYOUT: Minimalist — sparse, gallery-like arrangement with lots of breathing room.
- Items placed off-center using rule of thirds
- At least 40% of the plate is empty (negative space)
- Each item has breathing room, nothing crowded
- Asymmetric placement creates visual tension`,

  anchor: `
LAYOUT: Anchor — one hero item with supporting cast orbiting around it.
- Main/largest item commands the center of the plate
- Smaller items arranged in a loose circle around the anchor
- Visual rays extending outward from center
- Supporting items don't compete with the hero`,

  snackLine: `
LAYOUT: Snack Line — linear, functional arrangement like a grazing line.
- Items arranged in a diagonal line across the plate
- Dip/spread anchors one end if present
- Dippers and small items fan toward the other end
- Gradient of item sizes from large to small`,

  bento: `
LAYOUT: Bento — organized zones with distinct islands of food.
- Plate visually divided into sections/zones
- Each food type grouped in its own area
- Small gaps between different food zones
- Diagonal corners have contrasting colors`,

  wildGraze: `
LAYOUT: Wild Graze — abundant S-curve flow, classic grazing spread.
- Items follow a loose S-curve or diagonal flow
- Anchor items at the curve endpoints
- Small items scattered in odd-number clusters (3s, 5s)
- Organic, natural arrangement — nothing perfectly aligned
- Gaps filled with tiny accent items`,
};
