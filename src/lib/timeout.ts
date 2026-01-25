// =============================================================================
// Timeout Wrapper
// Prevents AI calls from hanging indefinitely
// =============================================================================

export class TimeoutError extends Error {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(`${errorMessage} after ${ms}ms`, ms));
    }, ms);
  });

  try {
    const result = await Promise.race([promise, timeout]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

// Preset timeouts for different operations
export const TIMEOUTS = {
  DALLE_IMAGE: 45000,    // DALL-E can take up to 30-40s
  CLAUDE_NAMING: 15000,  // Claude Haiku is fast
  GPT_VIBE_CHECK: 30000, // GPT-4o vision takes a bit longer
  DEFAULT: 30000,
} as const;
