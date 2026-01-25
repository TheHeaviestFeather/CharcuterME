'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Screen } from '@/types';
import {
  InputScreen,
  RevealScreen,
  CameraScreen,
  ResultsScreen,
} from '@/components';

export default function Home() {
  // Screen state - 4 screens: input -> reveal -> camera -> results
  const [screen, setScreen] = useState<Screen>('input');

  // Data state
  const [ingredients, setIngredients] = useState('');
  const [dinnerName, setDinnerName] = useState('');
  const [validation, setValidation] = useState('');
  const [tip, setTip] = useState('');
  const [blueprintUrl, setBlueprintUrl] = useState<string | null>(null);
  const [blueprintSvg, setBlueprintSvg] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [vibeScore, setVibeScore] = useState(0);
  const [vibeRank, setVibeRank] = useState('');
  const [vibeCompliment, setVibeCompliment] = useState('');
  const [sticker, setSticker] = useState('');

  // Loading states - separate for name and blueprint
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [isLoadingBlueprint, setIsLoadingBlueprint] = useState(false);
  const [isLoadingVibe, setIsLoadingVibe] = useState(false);

  // Generate name via Claude
  const generateName = async () => {
    setIsLoadingName(true);
    try {
      const response = await fetch('/api/name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      });
      const data = await response.json();

      setDinnerName(data.name || 'The Spread');
      setValidation(data.validation || "That's a real dinner.");
      setTip(data.tip || '');
    } catch (error) {
      console.error('Error generating name:', error);
      setDinnerName('The Spread');
      setValidation("That's a real dinner. You're doing great.");
      setTip('');
    } finally {
      setIsLoadingName(false);
    }
  };

  // Generate blueprint via DALL-E
  const generateBlueprint = async () => {
    setIsLoadingBlueprint(true);
    try {
      const response = await fetch('/api/sketch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      });
      const data = await response.json();

      // Handle both image URL and SVG fallback
      if (data.imageUrl) {
        setBlueprintUrl(data.imageUrl);
        setBlueprintSvg(null);
      } else if (data.svg) {
        setBlueprintSvg(data.svg);
        setBlueprintUrl(null);
      }
    } catch (error) {
      console.error('Error generating blueprint:', error);
      // Keep null - will show ASCII fallback
    } finally {
      setIsLoadingBlueprint(false);
    }
  };

  // Check vibe via GPT-4o
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
          rules: ['S-curve flow', 'Odd clusters', 'Color balance'],
        }),
      });
      const data = await response.json();

      setVibeScore(data.score || 72);
      setVibeRank(data.rank || 'Vibe Achieved');
      setVibeCompliment(data.compliment || 'Looking good!');
      setSticker(data.sticker || 'WE LOVE TO SEE IT');
      setScreen('results');
    } catch (error) {
      console.error('Error checking vibe:', error);
      setVibeScore(72);
      setVibeRank('Vibe Achieved');
      setVibeCompliment('We trust you did great!');
      setSticker('WE LOVE TO SEE IT');
      setScreen('results');
    } finally {
      setIsLoadingVibe(false);
    }
  };

  // Submit ingredients - triggers BOTH name and blueprint generation in parallel
  const handleSubmitIngredients = async () => {
    // Navigate to reveal screen immediately
    setScreen('reveal');

    // Start both API calls in parallel
    generateName();
    generateBlueprint();
  };

  // Navigation handlers
  const handlePlatedIt = () => setScreen('camera');
  const handlePhotoCapture = (photo: string) => setUserPhoto(photo);
  const handleCheckVibe = () => checkVibe();

  const handleShare = async () => {
    if (navigator.share && userPhoto) {
      try {
        await navigator.share({
          title: `CharcuterME: ${dinnerName}`,
          text: `I scored ${vibeScore} on my "${dinnerName}"! ${sticker}`,
        });
      } catch {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `I scored ${vibeScore} on my "${dinnerName}"! ${sticker} #CharcuterME`
      );
      alert('Copied to clipboard!');
    }
  };

  const handleSave = () => {
    if (userPhoto) {
      const link = document.createElement('a');
      link.download = `charcuterme-${dinnerName.replace(/\s+/g, '-').toLowerCase()}.jpg`;
      link.href = userPhoto;
      link.click();
    }
  };

  const resetApp = () => {
    setScreen('input');
    setIngredients('');
    setDinnerName('');
    setValidation('');
    setTip('');
    setBlueprintUrl(null);
    setBlueprintSvg(null);
    setUserPhoto(null);
    setVibeScore(0);
    setVibeRank('');
    setVibeCompliment('');
    setSticker('');
  };

  return (
    <main className="min-h-screen bg-cream">
      <AnimatePresence mode="wait">
        {screen === 'input' && (
          <InputScreen
            key="input"
            ingredients={ingredients}
            setIngredients={setIngredients}
            onSubmit={handleSubmitIngredients}
            isLoading={false}
          />
        )}

        {screen === 'reveal' && (
          <RevealScreen
            key="reveal"
            dinnerName={dinnerName}
            validation={validation}
            tip={tip}
            blueprintUrl={blueprintUrl}
            blueprintSvg={blueprintSvg}
            onPlatedIt={handlePlatedIt}
            onStartOver={resetApp}
            isLoadingName={isLoadingName}
            isLoadingBlueprint={isLoadingBlueprint}
          />
        )}

        {screen === 'camera' && (
          <CameraScreen
            key="camera"
            onPhotoCapture={handlePhotoCapture}
            onCheckVibe={handleCheckVibe}
            userPhoto={userPhoto}
            isLoading={isLoadingVibe}
          />
        )}

        {screen === 'results' && (
          <ResultsScreen
            key="results"
            dinnerName={dinnerName}
            userPhoto={userPhoto}
            vibeScore={vibeScore}
            vibeRank={vibeRank}
            vibeCompliment={vibeCompliment}
            sticker={sticker}
            onShare={handleShare}
            onSave={handleSave}
            onStartOver={resetApp}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
