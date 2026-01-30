'use client';

import { useState, useEffect } from 'react';

// =============================================================================
// Theatrical Loading Messages
// =============================================================================

const LOADING_MESSAGES = [
  "Consulting the cheese gods...",
  "Arranging tiny pickles...",
  "Achieving optimal spread angles...",
  "Summoning artisanal energy...",
  "Channeling grandma's wisdom...",
  "Calculating cracker ratios...",
  "Infusing with cozy vibes...",
  "Aligning the charcuterie stars...",
];

// =============================================================================
// Types
// =============================================================================

interface UseLoadingTheaterOptions {
  isLoading: boolean;
  interval?: number;
  messages?: string[];
}

interface UseLoadingTheaterReturn {
  message: string;
  messageIndex: number;
  progress: number;
}

// =============================================================================
// Hook
// =============================================================================

export function useLoadingTheater({
  isLoading,
  interval = 2500,
  messages = LOADING_MESSAGES,
}: UseLoadingTheaterOptions): UseLoadingTheaterReturn {
  const [messageIndex, setMessageIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  // Reset when loading starts
  useEffect(() => {
    if (isLoading) {
      setMessageIndex(0);
      setStartTime(Date.now());
      setProgress(0);
    } else {
      setStartTime(null);
      setProgress(0);
    }
  }, [isLoading]);

  // Rotate messages
  useEffect(() => {
    if (!isLoading) return;

    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [isLoading, interval, messages.length]);

  // Update progress (for potential progress bar)
  useEffect(() => {
    if (!isLoading || !startTime) return;

    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      // Asymptotic progress - never quite reaches 100%
      const newProgress = Math.min(95, (1 - Math.exp(-elapsed / 10000)) * 100);
      setProgress(newProgress);
    }, 100);

    return () => clearInterval(progressTimer);
  }, [isLoading, startTime]);

  return {
    message: messages[messageIndex],
    messageIndex,
    progress,
  };
}

export default useLoadingTheater;
