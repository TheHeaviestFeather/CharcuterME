'use client';

import { useState, useCallback, useRef } from 'react';

// =============================================================================
// Types
// =============================================================================

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: Error | null;
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export interface UseAsyncFlowOptions<T> {
  /** Initial data value */
  initialData?: T | null;
  /** Callback on success */
  onSuccess?: (data: T) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Auto-reset to idle after success (ms) */
  resetOnSuccessDelay?: number;
}

export interface UseAsyncFlowReturn<T, Args extends unknown[]> extends AsyncState<T> {
  /** Execute the async function */
  execute: (...args: Args) => Promise<T | null>;
  /** Reset state to idle */
  reset: () => void;
  /** Set data directly */
  setData: (data: T | null) => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Custom hook for managing async operation states
 * Provides loading, success, error states with type safety
 *
 * @example
 * const { execute, isLoading, data, error } = useAsyncFlow(
 *   async (ingredients: string) => {
 *     const response = await fetch('/api/name', {
 *       method: 'POST',
 *       body: JSON.stringify({ ingredients }),
 *     });
 *     return response.json();
 *   },
 *   { onSuccess: (data) => console.log('Got:', data) }
 * );
 *
 * // In handler:
 * await execute('brie, crackers');
 */
export function useAsyncFlow<T, Args extends unknown[] = []>(
  asyncFn: (...args: Args) => Promise<T>,
  options: UseAsyncFlowOptions<T> = {}
): UseAsyncFlowReturn<T, Args> {
  const {
    initialData = null,
    onSuccess,
    onError,
    resetOnSuccessDelay,
  } = options;

  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [data, setData] = useState<T | null>(initialData);
  const [error, setError] = useState<Error | null>(null);

  // Track mounted state to prevent updates after unmount
  const mountedRef = useRef(true);
  const resetTimerRef = useRef<NodeJS.Timeout>();

  // Cleanup on unmount
  useState(() => {
    return () => {
      mountedRef.current = false;
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  });

  const reset = useCallback(() => {
    if (!mountedRef.current) return;
    setStatus('idle');
    setData(initialData);
    setError(null);
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
  }, [initialData]);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      if (!mountedRef.current) return null;

      setStatus('loading');
      setError(null);

      try {
        const result = await asyncFn(...args);

        if (!mountedRef.current) return null;

        setData(result);
        setStatus('success');
        onSuccess?.(result);

        // Auto-reset after delay if configured
        if (resetOnSuccessDelay) {
          resetTimerRef.current = setTimeout(() => {
            if (mountedRef.current) {
              reset();
            }
          }, resetOnSuccessDelay);
        }

        return result;
      } catch (err) {
        if (!mountedRef.current) return null;

        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setStatus('error');
        onError?.(error);

        return null;
      }
    },
    [asyncFn, onSuccess, onError, resetOnSuccessDelay, reset]
  );

  return {
    status,
    data,
    error,
    isIdle: status === 'idle',
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    execute,
    reset,
    setData,
  };
}

// =============================================================================
// Parallel Async Hook
// =============================================================================

export interface ParallelAsyncState {
  isAnyLoading: boolean;
  areAllComplete: boolean;
  areAllSuccess: boolean;
  hasAnyError: boolean;
}

/**
 * Combine multiple useAsyncFlow hooks for parallel operations
 *
 * @example
 * const nameFlow = useAsyncFlow(fetchName);
 * const imageFlow = useAsyncFlow(fetchImage);
 * const { isAnyLoading, areAllSuccess } = useParallelAsync([nameFlow, imageFlow]);
 */
export function useParallelAsync(
  flows: Array<Pick<AsyncState<unknown>, 'status'>>
): ParallelAsyncState {
  return {
    isAnyLoading: flows.some((f) => f.status === 'loading'),
    areAllComplete: flows.every((f) => f.status === 'success' || f.status === 'error'),
    areAllSuccess: flows.every((f) => f.status === 'success'),
    hasAnyError: flows.some((f) => f.status === 'error'),
  };
}
