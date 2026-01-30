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
      } else if (data.svg) {
        setSvgFallback(data.svg);
        setImageUrl(null);
      }

      return data;
    } catch (error) {
      console.error('Error generating sketch:', error);
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
    setScreen('loading');

    // Fire both API calls in parallel
    const namePromise = generateName(ingredientInput);
    generateSketch(ingredientInput);

    // Transition to results when name is ready
    await namePromise;
    setScreen('results');
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
          isLoadingImage={isLoadingImage}
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
