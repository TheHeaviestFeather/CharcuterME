'use client';

import { useState } from 'react';
import { InputScreen } from '@/components/InputScreen';
import { ResultsScreen } from '@/components/ResultsScreen';
import { VibeCheckScreen } from '@/components/VibeCheckScreen';
import { AppErrorBoundary } from '@/components/ErrorBoundary';

// =============================================================================
// Utilities
// =============================================================================

const API_TIMEOUTS = {
  name: 15000,   // 15 seconds for Claude
  sketch: 45000, // 45 seconds for Imagen (image generation is slow)
} as const;

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// =============================================================================
// Types
// =============================================================================

type Screen = 'input' | 'results' | 'vibecheck';

interface NamerResponse {
  name: string;
  validation: string;
  tip: string;
  wildcard?: string;
}

interface SketchResponse {
  type: 'image' | 'svg';
  imageUrl?: string;
  svg?: string;
}

// =============================================================================
// Main App Flow
// =============================================================================

export default function CharcuterMeApp() {
  // Screen state
  const [screen, setScreen] = useState<Screen>('input');

  // Data state
  const [dinnerName, setDinnerName] = useState('');
  const [validation, setValidation] = useState('');
  const [tip, setTip] = useState('');
  const [wildcard, setWildcard] = useState<string | undefined>();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [svgFallback, setSvgFallback] = useState<string | null>(null);

  // Loading states
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentIngredients, setCurrentIngredients] = useState('');

  // =============================================================================
  // API Calls
  // =============================================================================

  const generateName = async (ingredientInput: string) => {
    setIsLoadingName(true);

    try {
      const response = await fetchWithTimeout(
        '/api/name',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredients: ingredientInput }),
        },
        API_TIMEOUTS.name
      );

      const data: NamerResponse = await response.json();

      setDinnerName(data.name || 'The Spread');
      setValidation(data.validation || "That's a real dinner. You're doing great.");
      setTip(data.tip || 'Trust your instincts.');
      setWildcard(data.wildcard);

      return data;
    } catch (error) {
      console.error('Error generating name:', error);
      // Fallback
      setDinnerName('The Spread');
      setValidation("That's a real dinner. You're doing great.");
      setTip('The couch is the correct location for this meal.');
      return null;
    } finally {
      setIsLoadingName(false);
    }
  };

  const generateSketch = async (ingredientInput: string) => {
    setIsLoadingImage(true);
    setImageError(false);

    try {
      const response = await fetchWithTimeout(
        '/api/sketch',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredients: ingredientInput }),
        },
        API_TIMEOUTS.sketch
      );

      const data: SketchResponse = await response.json();

      if (data.type === 'image' && data.imageUrl) {
        setImageUrl(data.imageUrl);
        setSvgFallback(null);
        setImageError(false);
      } else if (data.svg) {
        // SVG fallback means image generation failed
        setSvgFallback(data.svg);
        setImageUrl(null);
        setImageError(true);
      }

      return data;
    } catch (error) {
      console.error('Error generating sketch:', error);
      setImageError(true);
      return null;
    } finally {
      setIsLoadingImage(false);
    }
  };

  // =============================================================================
  // Handlers
  // =============================================================================

  const handleSubmitIngredients = async (ingredientInput: string) => {
    // Reset previous results before starting new request
    resetState();
    setCurrentIngredients(ingredientInput);

    // Go directly to results screen - show loading states inline
    setScreen('results');

    // Fire both API calls in parallel
    generateName(ingredientInput);
    generateSketch(ingredientInput);
  };

  const handleRegenerateName = async () => {
    if (!currentIngredients) return;
    // Just regenerate the name, keep the existing image
    await generateName(currentIngredients);
  };

  const handleRetryImage = () => {
    if (currentIngredients) {
      generateSketch(currentIngredients);
    }
  };

  const handleCheckVibe = () => {
    setScreen('vibecheck');
  };

  const handleJustEat = () => {
    // Reset and go back to input
    setScreen('input');
    resetState();
  };

  const resetState = () => {
    setDinnerName('');
    setValidation('');
    setTip('');
    setWildcard(undefined);
    setImageUrl(null);
    setSvgFallback(null);
    setImageError(false);
    setCurrentIngredients('');
  };

  // =============================================================================
  // Render
  // =============================================================================

  const renderScreen = () => {
    switch (screen) {
      case 'input':
        return (
          <InputScreen
            onSubmit={handleSubmitIngredients}
            isLoading={isLoadingName}
          />
        );

      case 'results':
        return (
          <ResultsScreen
            dinnerName={dinnerName || 'Creating your masterpiece...'}
            validation={validation || 'Analyzing your choices...'}
            tip={tip || 'Loading wisdom...'}
            wildcard={wildcard}
            imageUrl={imageUrl}
            svgFallback={svgFallback}
            onCheckVibe={handleCheckVibe}
            onJustEat={handleJustEat}
            onRetryImage={handleRetryImage}
            onRegenerateName={handleRegenerateName}
            isLoadingImage={isLoadingImage}
            isLoadingName={isLoadingName}
            imageError={imageError}
          />
        );

      case 'vibecheck':
        return (
          <VibeCheckScreen
            dinnerData={{
              name: dinnerName || 'Your Creation',
              validation: validation || '',
              tip: tip || '',
              wildcard: wildcard,
            }}
            ingredients={currentIngredients}
            inspirationImage={imageUrl}
            onStartOver={handleJustEat}
          />
        );

      default:
        return <InputScreen onSubmit={handleSubmitIngredients} />;
    }
  };

  return (
    <AppErrorBoundary onReset={resetState}>
      {renderScreen()}
    </AppErrorBoundary>
  );
}
