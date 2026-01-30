import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAsyncFlow, useParallelAsync } from './useAsyncFlow';

describe('useAsyncFlow', () => {
  it('should start in idle state', () => {
    const asyncFn = vi.fn().mockResolvedValue('result');
    const { result } = renderHook(() => useAsyncFlow(asyncFn));

    expect(result.current.status).toBe('idle');
    expect(result.current.isIdle).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should transition to loading when executed', async () => {
    const asyncFn = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve('result'), 100))
    );
    const { result } = renderHook(() => useAsyncFlow(asyncFn));

    act(() => {
      result.current.execute();
    });

    expect(result.current.status).toBe('loading');
    expect(result.current.isLoading).toBe(true);
  });

  it('should transition to success with data', async () => {
    const asyncFn = vi.fn().mockResolvedValue('result');
    const { result } = renderHook(() => useAsyncFlow(asyncFn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.status).toBe('success');
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toBe('result');
  });

  it('should transition to error on failure', async () => {
    const error = new Error('Test error');
    const asyncFn = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useAsyncFlow(asyncFn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toEqual(error);
  });

  it('should call onSuccess callback', async () => {
    const onSuccess = vi.fn();
    const asyncFn = vi.fn().mockResolvedValue('result');
    const { result } = renderHook(() =>
      useAsyncFlow(asyncFn, { onSuccess })
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(onSuccess).toHaveBeenCalledWith('result');
  });

  it('should call onError callback', async () => {
    const onError = vi.fn();
    const error = new Error('Test error');
    const asyncFn = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() =>
      useAsyncFlow(asyncFn, { onError })
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(onError).toHaveBeenCalledWith(error);
  });

  it('should pass arguments to async function', async () => {
    const asyncFn = vi.fn().mockResolvedValue('result');
    const { result } = renderHook(() =>
      useAsyncFlow(asyncFn)
    );

    await act(async () => {
      await result.current.execute('arg1', 'arg2');
    });

    expect(asyncFn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should reset state', async () => {
    const asyncFn = vi.fn().mockResolvedValue('result');
    const { result } = renderHook(() => useAsyncFlow(asyncFn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.status).toBe('success');

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
  });

  it('should allow setting data directly', () => {
    const asyncFn = vi.fn().mockResolvedValue('result');
    const { result } = renderHook(() => useAsyncFlow(asyncFn));

    act(() => {
      result.current.setData('manual data');
    });

    expect(result.current.data).toBe('manual data');
  });
});

describe('useParallelAsync', () => {
  it('should detect any loading', () => {
    const flows = [
      { status: 'loading' as const },
      { status: 'idle' as const },
    ];

    const result = useParallelAsync(flows);
    expect(result.isAnyLoading).toBe(true);
  });

  it('should detect all complete', () => {
    const flows = [
      { status: 'success' as const },
      { status: 'error' as const },
    ];

    const result = useParallelAsync(flows);
    expect(result.areAllComplete).toBe(true);
  });

  it('should detect all success', () => {
    const flows = [
      { status: 'success' as const },
      { status: 'success' as const },
    ];

    const result = useParallelAsync(flows);
    expect(result.areAllSuccess).toBe(true);
  });

  it('should detect any error', () => {
    const flows = [
      { status: 'success' as const },
      { status: 'error' as const },
    ];

    const result = useParallelAsync(flows);
    expect(result.hasAnyError).toBe(true);
  });
});
