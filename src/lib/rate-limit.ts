/**
 * CharcuterME - Rate Limiting
 * Upstash rate limiting to prevent API abuse
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

// =============================================================================
// Configuration
// =============================================================================

// Rate limits per endpoint (requests per window)
const RATE_LIMITS = {
  // Name generation: 20 requests per minute (generous for normal use)
  name: { requests: 20, window: '1 m' as const },
  // Sketch generation: 10 per minute (expensive, slower)
  sketch: { requests: 10, window: '1 m' as const },
  // Vibe check: 10 per minute (expensive GPT-4o Vision)
  vibe: { requests: 10, window: '1 m' as const },
  // Global fallback
  default: { requests: 30, window: '1 m' as const },
} as const;

// =============================================================================
// Rate Limiter Instances (Lazy Initialization)
// =============================================================================

let rateLimiters: Map<string, Ratelimit> | null = null;

function getRateLimiters(): Map<string, Ratelimit> | null {
  if (rateLimiters) return rateLimiters;

  const url = process.env.CHARCUTERME_STORAGE_KV_REST_API_URL;
  const token = process.env.CHARCUTERME_STORAGE_KV_REST_API_TOKEN;

  if (!url || !token) {
    logger.warn('Redis not configured - rate limiting disabled');
    return null;
  }

  try {
    const redis = new Redis({ url, token });

    rateLimiters = new Map();

    // Create a rate limiter for each endpoint
    for (const [key, config] of Object.entries(RATE_LIMITS)) {
      rateLimiters.set(
        key,
        new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(config.requests, config.window),
          prefix: `ratelimit:${key}:`,
          analytics: true,
        })
      );
    }

    logger.info('Rate limiters initialized');
    return rateLimiters;
  } catch (error) {
    logger.error('Failed to initialize rate limiters', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

// =============================================================================
// Rate Limit Check
// =============================================================================

export type RateLimitEndpoint = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a request
 * Returns null if rate limiting is not configured (allows request)
 */
export async function checkRateLimit(
  request: NextRequest,
  endpoint: RateLimitEndpoint = 'default'
): Promise<RateLimitResult | null> {
  const limiters = getRateLimiters();
  if (!limiters) return null; // Rate limiting disabled, allow request

  const limiter = limiters.get(endpoint) || limiters.get('default');
  if (!limiter) return null;

  // Get identifier: prefer IP, fallback to a hash of user-agent
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'anonymous';

  try {
    const result = await limiter.limit(ip);

    if (!result.success) {
      logger.warn('Rate limit exceeded', {
        endpoint,
        ip: ip.slice(0, 10) + '***', // Partial IP for privacy
        remaining: result.remaining,
        reset: result.reset,
      });
    }

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    logger.error('Rate limit check failed', {
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // On error, allow the request (fail open)
    return null;
  }
}

/**
 * Create a rate limit exceeded response
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests. Please slow down.',
      retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
      },
    }
  );
}

/**
 * Middleware helper to apply rate limiting
 * Usage: const limited = await applyRateLimit(request, 'name');
 *        if (limited) return limited;
 */
export async function applyRateLimit(
  request: NextRequest,
  endpoint: RateLimitEndpoint
): Promise<NextResponse | null> {
  const result = await checkRateLimit(request, endpoint);

  // No rate limiting configured or check failed - allow request
  if (!result) return null;

  // Rate limit exceeded - return 429 response
  if (!result.success) {
    return rateLimitResponse(result);
  }

  // Within limits - allow request
  return null;
}
