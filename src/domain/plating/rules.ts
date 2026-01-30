/**
 * CharcuterME - Visual Rules
 * Rules for proper plating and visual composition
 */

import type { VisualRule, IngredientSummary } from '@/types';

// =============================================================================
// Visual Rules
// =============================================================================

export const VISUAL_RULES: Record<string, VisualRule> = {
  oddNumberCluster: {
    name: 'Odd Number Cluster',
    check: (summary) => summary.hasOddNumberItems || summary.hasSmallRound,
    instruction: 'Small round items MUST be in groups of 3, 5, or 7. NEVER 2 or 4.',
    appliesTo: ['grapes', 'olives', 'berries', 'nuts', 'cherry tomatoes'],
  },
  sCurve: {
    name: 'The S-Curve',
    check: (summary) => summary.hasLongItems,
    instruction: 'Arrange long items in a gentle S-curve to create visual movement.',
    appliesTo: ['crackers', 'carrots', 'celery', 'bacon', 'string cheese'],
  },
  fanArrangement: {
    name: 'Fan Arrangement',
    check: (summary) => summary.vehicles.length > 0,
    instruction: 'Fan flat items in overlapping arcs.',
    appliesTo: ['crackers', 'pita', 'apple', 'baguette'],
  },
  containerRule: {
    name: 'Container Rule',
    check: (summary) => summary.needsContainer,
    instruction: 'Place dips and loose items in small bowls or ramekins.',
    appliesTo: ['hummus', 'salsa', 'guacamole', 'ranch', 'olives', 'queso'],
  },
  colorDistribution: {
    name: 'Color Balance',
    check: () => true,
    instruction: "Distribute colors across the plate. Don't cluster same-colored items together.",
  },
  anchorPlacement: {
    name: 'Anchor Prominence',
    check: (summary) => summary.anchors.length > 0,
    instruction: 'Anchor items should be visually prominent - larger, centered, or at focal points.',
  },
};

// =============================================================================
// Rule Selection
// =============================================================================

/**
 * Get all visual rules that apply to the given ingredient summary
 */
export function getApplicableRules(summary: IngredientSummary): VisualRule[] {
  return Object.values(VISUAL_RULES).filter((rule) => rule.check(summary));
}

/**
 * Get rule by name
 */
export function getRule(ruleName: string): VisualRule | undefined {
  return VISUAL_RULES[ruleName];
}
