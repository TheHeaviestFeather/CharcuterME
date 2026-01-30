/**
 * Caption Generation Utilities
 *
 * Centralized caption formatting for social sharing.
 */

const HASHTAGS = '#CharcuterME #GirlDinner #FoodVibes';

export interface CaptionOptions {
  dinnerName: string;
  validation?: string;
  vibeScore?: string;
  vibeCategory?: string;
}

/**
 * Generate a shareable caption for the dinner
 */
export function generateCaption(options: CaptionOptions): string {
  const { dinnerName, validation, vibeScore, vibeCategory } = options;

  const parts: string[] = [`Tonight's dinner: "${dinnerName}"`];

  // Add vibe score if available
  if (vibeScore && vibeCategory) {
    parts.push(`Vibe Score: ${vibeScore} - ${vibeCategory}`);
  }

  // Add validation (clean any leading checkmarks)
  if (validation) {
    const cleanValidation = validation.replace(/^[✓✔]\s*/, '');
    if (vibeScore) {
      parts.push(`"${cleanValidation}"`);
    } else {
      parts.push(cleanValidation);
    }
  }

  parts.push(HASHTAGS);

  return parts.join('\n\n');
}

/**
 * Generate a simple caption without vibe score
 */
export function generateSimpleCaption(dinnerName: string): string {
  return `Tonight's dinner: "${dinnerName}"\n\n${HASHTAGS}`;
}
