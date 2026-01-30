/**
 * AI Response Parsers
 * Handles parsing and sanitizing responses from different AI providers
 */

// =============================================================================
// Types
// =============================================================================

export interface NamerResult {
  name: string;
  validation: string;
  tip: string;
  wildcard?: string;
}

export interface VibeResult {
  score: number;
  rank: string;
  compliment: string;
  sticker: string;
  improvement?: string;
}

// =============================================================================
// Emoji Stripping
// =============================================================================

/**
 * Comprehensive emoji and special character removal
 * Handles Unicode emoji ranges, variation selectors, and common symbols
 */
export function stripEmojis(text: string): string {
  return text
    // Remove emoji and pictographic characters
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
    .replace(/[\u{231A}-\u{231B}]/gu, '')   // Watch, Hourglass
    .replace(/[\u{23E9}-\u{23F3}]/gu, '')   // Media controls
    .replace(/[\u{23F8}-\u{23FA}]/gu, '')   // More media
    .replace(/[\u{25AA}-\u{25AB}]/gu, '')   // Squares
    .replace(/[\u{25B6}]/gu, '')            // Play button
    .replace(/[\u{25C0}]/gu, '')            // Reverse button
    .replace(/[\u{25FB}-\u{25FE}]/gu, '')   // More squares
    .replace(/[\u{2934}-\u{2935}]/gu, '')   // Arrows
    .replace(/[\u{2B05}-\u{2B07}]/gu, '')   // More arrows
    .replace(/[\u{2B1B}-\u{2B1C}]/gu, '')   // Large squares
    .replace(/[\u{2B50}]/gu, '')            // Star
    .replace(/[\u{2B55}]/gu, '')            // Circle
    .replace(/[\u{3030}]/gu, '')            // Wavy dash
    .replace(/[\u{303D}]/gu, '')            // Part alternation mark
    .replace(/[\u{3297}]/gu, '')            // Circled Ideograph Congratulation
    .replace(/[\u{3299}]/gu, '')            // Circled Ideograph Secret
    .replace(/[\u{200D}]/gu, '')            // Zero Width Joiner
    .replace(/[\u{20E3}]/gu, '')            // Combining Enclosing Keycap
    .trim();
}

// =============================================================================
// JSON Extraction
// =============================================================================

/**
 * Extract JSON object from a string that may contain markdown or other text
 */
export function extractJson(text: string): string | null {
  // Try to find JSON in the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : null;
}

/**
 * Safely parse JSON with fallback
 */
export function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    // Try extracting JSON from markdown/text
    const extracted = extractJson(text);
    if (extracted) {
      try {
        return JSON.parse(extracted) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

// =============================================================================
// Claude Response Parser
// =============================================================================

interface RawNamerResponse {
  name?: string;
  validation?: string;
  tip?: string;
  wildcard?: string;
}

/**
 * Parse Claude's response for dinner naming
 * Handles emoji stripping, JSON extraction, and field validation
 */
export function parseClaudeNamerResponse(raw: string): NamerResult | null {
  // First strip emojis from the raw response
  const cleaned = stripEmojis(raw);

  const parsed = safeJsonParse<RawNamerResponse>(cleaned);
  if (!parsed) return null;

  // Validate required fields
  if (!parsed.name || !parsed.validation || !parsed.tip) {
    return null;
  }

  return {
    name: stripEmojis(String(parsed.name)).slice(0, 50),
    validation: stripEmojis(String(parsed.validation)).slice(0, 150),
    tip: stripEmojis(String(parsed.tip)).slice(0, 200),
    wildcard: parsed.wildcard
      ? stripEmojis(String(parsed.wildcard)).slice(0, 100)
      : undefined,
  };
}

// =============================================================================
// GPT Response Parser
// =============================================================================

interface RawVibeResponse {
  score?: number;
  rank?: string;
  compliment?: string;
  sticker?: string;
  improvement?: string;
}

/**
 * Parse GPT's response for vibe check
 * Handles JSON extraction and field normalization
 */
export function parseGPTVibeResponse(raw: string): VibeResult | null {
  const parsed = safeJsonParse<RawVibeResponse>(raw);
  if (!parsed) return null;

  return {
    score: Math.min(100, Math.max(0, Number(parsed.score) || 50)),
    rank: String(parsed.rank || 'Mystery Chef'),
    compliment: String(parsed.compliment || 'You tried and that counts!'),
    sticker: String(parsed.sticker || ''),
    improvement: parsed.improvement ? String(parsed.improvement) : undefined,
  };
}

// =============================================================================
// Generic Response Parser
// =============================================================================

/**
 * Generic AI response parser with provider-specific handling
 */
export function parseAIResponse<T>(
  raw: string,
  _provider: 'claude' | 'gpt' | 'vertex',
  type: 'namer' | 'vibe'
): T | null {
  switch (type) {
    case 'namer':
      return parseClaudeNamerResponse(raw) as T | null;
    case 'vibe':
      return parseGPTVibeResponse(raw) as T | null;
    default:
      return safeJsonParse<T>(raw);
  }
}
