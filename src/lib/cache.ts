/**
 * CharcuterME - Redis Cache Layer
 * Upstash Redis caching for API responses
 */

import { Redis } from '@upstash/redis';
import { logger } from './logger';

// =============================================================================
// Configuration
// =============================================================================

// Cache TTLs in seconds
export const CACHE_TTL = {
  dinnerName: 60 * 60 * 24, // 24 hours - same ingredients = same name
  sketch: 60 * 60 * 24 * 7, // 7 days - images are expensive to generate
  vibe: 60 * 60, // 1 hour - vibe checks can vary
} as const;

// Cache key prefixes
const CACHE_PREFIX = {
  dinnerName: 'name:',
  sketch: 'sketch:',
  vibe: 'vibe:',
} as const;

// =============================================================================
// Redis Client (Lazy Initialization)
// =============================================================================

let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redis) return redis;

  const url = process.env.CHARCUTERME_STORAGE_KV_REST_API_URL;
  const token = process.env.CHARCUTERME_STORAGE_KV_REST_API_TOKEN;

  if (!url || !token) {
    logger.warn('Redis not configured - caching disabled', {
      hasUrl: !!url,
      hasToken: !!token,
    });
    return null;
  }

  try {
    redis = new Redis({ url, token });
    logger.info('Redis client initialized');
    return redis;
  } catch (error) {
    logger.error('Failed to initialize Redis client', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

// =============================================================================
// Cache Key Generation
// =============================================================================

/**
 * Generate a deterministic cache key from ingredients
 * Normalizes and sorts ingredients for consistent hashing
 */
export function generateCacheKey(prefix: keyof typeof CACHE_PREFIX, ingredients: string): string {
  const normalized = ingredients
    .toLowerCase()
    .split(/[,\n]+/)
    .map((i) => i.trim())
    .filter((i) => i.length > 0)
    .sort()
    .join(',');

  return `${CACHE_PREFIX[prefix]}${normalized}`;
}

// =============================================================================
// Cache Operations
// =============================================================================

/**
 * Get a value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const value = await client.get<T>(key);
    if (value) {
      logger.debug('Cache hit', { key: key.slice(0, 50) });
    }
    return value;
  } catch (error) {
    logger.warn('Cache get failed', {
      key: key.slice(0, 50),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Set a value in cache with TTL
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.set(key, value, { ex: ttlSeconds });
    logger.debug('Cache set', { key: key.slice(0, 50), ttl: ttlSeconds });
    return true;
  } catch (error) {
    logger.warn('Cache set failed', {
      key: key.slice(0, 50),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Delete a value from cache
 */
export async function cacheDelete(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.del(key);
    logger.debug('Cache delete', { key: key.slice(0, 50) });
    return true;
  } catch (error) {
    logger.warn('Cache delete failed', {
      key: key.slice(0, 50),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

// =============================================================================
// High-Level Cache Helpers
// =============================================================================

/**
 * Cache-through pattern: get from cache or compute and store
 */
export async function cacheThrough<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<T> {
  // Try cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Compute fresh value
  const value = await compute();

  // Store in cache (fire and forget)
  cacheSet(key, value, ttlSeconds).catch(() => {
    // Silently ignore cache errors - already logged in cacheSet
  });

  return value;
}

/**
 * Check if caching is available
 */
export function isCacheAvailable(): boolean {
  return getRedisClient() !== null;
}
