'use client';

import { useState } from 'react';
import { InputScreen } from '@/components/InputScreen';
import { ResultsScreen } from '@/components/ResultsScreen';
import { VibeCheckScreen } from '@/components/VibeCheckScreen';
import type { NamerResponse, SketchResponse } from '@/types';

// =============================================================================
// Types
// =============================================================================

type Screen = 'input' | 'results' | 'vibecheck';

// =============================================================================
// Main App Flow
// =============================================================================

export default function CharcuterMeApp() {
  // Screen state
  const [screen, setScreen] = useState<Screen>('input');

  // Data state
  const [ingredients, setIngredients] = useState('');
  const [ingredientsArray, setIngredientsArray] = useState<string[]>([]);
  const [template, setTemplate] = useState('Your Spread');
  const [dinnerName, setDinnerName] = useState('');
  const [validation, setValidation] = useState('');
  const [tip, setTip] = useState('');
  const [wildcard, setWildcard] = useState<string | undefined>();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

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

    // Parse ingredients for fallback SVG
    const parsed = ingredientInput
      .split(/[,\n]+/)
      .map((i) => i.trim().toLowerCase())
      .filter((i) => i.length > 1)
      .slice(0, 6);
    setIngredientsArray(parsed);

    try {
      const response = await fetch('/api/sketch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: ingredientInput }),
      });

      const data: SketchResponse = await response.json();

      if (data.template) {
        setTemplate(data.template);
      }

      if (data.type === 'image' && data.imageUrl) {
        setImageUrl(data.imageUrl);
      } else {
        // Fallback - will use FallbackSvg component with ingredientsArray
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
    setIngredients(ingredientInput);
    setScreen('results');

    // Fire both API calls in parallel
    generateName(ingredientInput);
    generateSketch(ingredientInput);
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
    setIngredients('');
    setIngredientsArray([]);
    setTemplate('Your Spread');
    setDinnerName('');
    setValidation('');
    setTip('');
    setWildcard(undefined);
    setImageUrl(null);
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

    case 'results':
      return (
        <ResultsScreen
          dinnerName={dinnerName || 'Creating your masterpiece...'}
          validation={validation || 'Analyzing your choices...'}
          tip={tip || 'Loading wisdom...'}
          wildcard={wildcard}
          imageUrl={imageUrl}
          ingredients={ingredientsArray}
          template={template}
          onCheckVibe={handleCheckVibe}
          onJustEat={handleJustEat}
          isLoadingImage={isLoadingImage}
        />
      );

    case 'vibecheck':
      return (
        <VibeCheckScreen
          dinnerName={dinnerName || 'Your Creation'}
          ingredients={ingredients}
          inspirationImage={imageUrl}
          onStartOver={handleJustEat}
        />
      );

    default:
      return <InputScreen onSubmit={handleSubmitIngredients} />;
  }
}
