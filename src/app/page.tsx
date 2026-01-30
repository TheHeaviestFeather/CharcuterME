'use client';

import { useState } from 'react';
import { InputScreen } from '@/components/InputScreen';
import { ResultsScreen } from '@/components/ResultsScreen';
import { VibeCheckScreen } from '@/components/VibeCheckScreen';
import { LoadingScreen } from '@/components/LoadingScreen';

// =============================================================================
// Types
// =============================================================================

type Screen = 'input' | 'loading' | 'results' | 'vibecheck';

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
      const response = await fetch('/api/name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: ingredientInput }),
      });

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
      const response = await fetch('/api/sketch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: ingredientInput }),
      });

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
    setScreen('loading');

    // Minimum loading time for theatrical effect (1.5 seconds)
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1500));

    // Fire both API calls in parallel
    const namePromise = generateName(ingredientInput);
    generateSketch(ingredientInput);

    // Wait for BOTH name to be ready AND minimum loading time
    await Promise.all([namePromise, minLoadingTime]);
    setScreen('results');
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

  switch (screen) {
    case 'input':
      return (
        <InputScreen
          onSubmit={handleSubmitIngredients}
          isLoading={isLoadingName}
        />
      );

    case 'loading':
      return <LoadingScreen isLoading={true} />;

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
          isLoadingImage={isLoadingImage}
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
          inspirationImage={imageUrl}
          onStartOver={handleJustEat}
        />
      );

    default:
      return <InputScreen onSubmit={handleSubmitIngredients} />;
  }
}
