'use client';

import { useState } from 'react';
import { InputScreen } from '@/components/InputScreen';
import { ResultsScreen } from '@/components/ResultsScreen';
import CameraScreen from '@/components/CameraScreen';
import type { NamerResponse, SketchResponse, VibeCheckResponse } from '@/types';

// =============================================================================
// Types
// =============================================================================

type Screen = 'input' | 'results' | 'camera' | 'vibecheck';

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
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [vibeResult, setVibeResult] = useState<VibeCheckResponse | null>(null);

  // Loading states
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isLoadingVibe, setIsLoadingVibe] = useState(false);

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

  const checkVibe = async () => {
    if (!userPhoto) return;

    setIsLoadingVibe(true);

    try {
      const response = await fetch('/api/vibe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo: userPhoto,
          dinnerName,
          ingredients,
          rules: [],
        }),
      });

      const data: VibeCheckResponse = await response.json();
      setVibeResult(data);
      setScreen('vibecheck');

      return data;
    } catch (error) {
      console.error('Error checking vibe:', error);
      // Fallback
      setVibeResult({
        score: 77,
        rank: 'Chaotic Good',
        compliment: "Our AI is napping but honestly? This gives 'main character energy'.",
        sticker: 'TRUST THE PROCESS',
      });
      setScreen('vibecheck');
      return null;
    } finally {
      setIsLoadingVibe(false);
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
    setScreen('camera');
  };

  const handlePhotoCapture = (photo: string) => {
    setUserPhoto(photo);
  };

  const handleVibeCheck = () => {
    checkVibe();
  };

  const handleJustEat = () => {
    // Reset and go back to input
    setScreen('input');
    resetState();
  };

  const handleBackToResults = () => {
    setScreen('results');
    setUserPhoto(null);
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
    setUserPhoto(null);
    setVibeResult(null);
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

    case 'camera':
      return (
        <CameraScreen
          onPhotoCapture={handlePhotoCapture}
          onCheckVibe={handleVibeCheck}
          userPhoto={userPhoto}
          isLoading={isLoadingVibe}
        />
      );

    case 'vibecheck':
      return (
        <div className="min-h-screen bg-[#FAF9F7] flex flex-col items-center justify-center px-6 py-8">
          {vibeResult ? (
            <>
              {/* Score */}
              <div className="text-6xl font-bold text-[#E8734A] mb-4">
                {vibeResult.score}
              </div>

              {/* Rank */}
              <h1 className="text-2xl font-bold text-[#A47864] mb-2">
                {vibeResult.rank}
              </h1>

              {/* Sticker */}
              <div className="bg-[#E8734A] text-white px-4 py-2 rounded-full text-sm font-bold mb-6">
                {vibeResult.sticker}
              </div>

              {/* Compliment */}
              <p className="text-center text-[#9A8A7C] max-w-sm mb-8">
                {vibeResult.compliment}
              </p>

              {/* Improvement hint if present */}
              {vibeResult.improvement && (
                <p className="text-center text-[#C4B5A9] text-sm max-w-sm mb-8 italic">
                  {vibeResult.improvement}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                  onClick={handleBackToResults}
                  className="w-full py-3 px-6 bg-[#A47864] text-white font-semibold rounded-xl hover:bg-[#8A6854] transition-colors"
                >
                  Back to Results
                </button>
                <button
                  onClick={handleJustEat}
                  className="w-full py-3 px-6 bg-transparent text-[#A47864] font-semibold rounded-xl border-2 border-[#A47864] hover:bg-[#A47864]/10 transition-colors"
                >
                  Start Over
                </button>
              </div>
            </>
          ) : (
            <p className="text-[#A47864]">Loading your vibe...</p>
          )}
        </div>
      );

    default:
      return <InputScreen onSubmit={handleSubmitIngredients} />;
  }
}
