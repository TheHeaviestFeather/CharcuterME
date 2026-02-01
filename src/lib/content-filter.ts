/**
 * Content Filter
 * Basic safety filter for AI-generated content
 * Catches obvious inappropriate outputs before they reach users
 */

// Patterns that should trigger a fallback response
const BLOCKED_PATTERNS = [
  // Violence
  /\b(kill|murder|suicide|bomb|terrorist|shooting)\b/i,
  // Explicit
  /\b(porn|xxx|nsfw|nude|naked|sex(?!y\b))\b/i,
  // Slurs and hate speech (partial list - expand as needed)
  /\b(n[i1]gg|f[a4]gg|r[e3]t[a4]rd)\b/i,
  // Drug references (hard drugs)
  /\b(cocaine|heroin|meth|fentanyl)\b/i,
];

// Words that are fine in food context but might be flagged elsewhere
const FOOD_CONTEXT_ALLOWLIST = [
  'killer', // "killer cheese"
  'die', // "to die for"
  'hot', // "hot sauce"
  'crack', // "cracker"
  'high', // "high quality"
  'loaded', // "loaded nachos"
  'smoked', // "smoked salmon"
  'baked', // "baked goods"
];

/**
 * Check if content contains blocked patterns
 * Returns true if content should be filtered
 */
export function shouldFilterContent(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Check allowlist first - these are OK in food context
  for (const allowed of FOOD_CONTEXT_ALLOWLIST) {
    if (lowerText.includes(allowed)) {
      // Check if it's actually in a food context by looking at surrounding words
      // For now, just allow these words
      continue;
    }
  }

  // Check blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }

  return false;
}

/**
 * Filter AI output - returns safe fallback if content is inappropriate
 */
export function filterName(name: string, fallback: string = 'The Spread'): string {
  if (shouldFilterContent(name)) {
    return fallback;
  }
  return name;
}

/**
 * Filter validation/tip text
 */
export function filterText(text: string, fallback: string = ''): string {
  if (shouldFilterContent(text)) {
    return fallback;
  }
  return text;
}

/**
 * Filter entire response object
 */
export interface NamerResponse {
  name: string;
  validation: string;
  tip: string;
  wildcard?: string;
}

export function filterNamerResponse(
  response: NamerResponse,
  fallback: NamerResponse
): NamerResponse {
  // If any field is problematic, return the entire fallback
  if (
    shouldFilterContent(response.name) ||
    shouldFilterContent(response.validation) ||
    shouldFilterContent(response.tip) ||
    (response.wildcard && shouldFilterContent(response.wildcard))
  ) {
    return fallback;
  }
  return response;
}
