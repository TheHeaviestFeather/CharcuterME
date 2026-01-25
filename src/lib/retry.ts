// =============================================================================
// Retry Logic with Exponential Backoff
// For resilient AI API calls
// =============================================================================

import { logger } from './logger';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: Error) => boolean;
}

const defaultShouldRetry = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  return (
    message.includes('rate limit') ||
    message.includes('timeout') ||
    message.includes('503') ||
    message.includes('529') ||
    message.includes('500') ||
    message.includes('network') ||
    message.includes('econnreset') ||
    message.includes('socket')
  );
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = defaultShouldRetry,
  } = options;

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries || !shouldRetry(lastError)) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );

      logger.warn('Retry attempt failed, retrying', {
        attempt: attempt + 1,
        maxRetries,
        delayMs: Math.round(delay),
        error: lastError.message,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
