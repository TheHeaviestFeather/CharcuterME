'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Screen } from '@/types';
import {
  InputScreen,
  NameScreen,
  BlueprintScreen,
  CameraScreen,
  ResultsScreen,
} from '@/components';

export default function Home() {
  // Screen state
  const [screen, setScreen] = useState<Screen>('input');

  // Data state
  const [ingredients, setIngredients] = useState('');
  const [dinnerName, setDinnerName] = useState('');
  const [validation, setValidation] = useState('');
  const [tip, setTip] = useState('');
  const [blueprintUrl, setBlueprintUrl] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [vibeScore, setVibeScore] = useState(0);
  const [vibeRank, setVibeRank] = useState('');
  const [vibeCompliment, setVibeCompliment] = useState('');
  const [sticker, setSticker] = useState('');

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // API Calls
  const generateName = async () => {
    setIsLoading(true);
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
      setScreen('name');
    } catch (error) {
      console.error('Error generating name:', error);
      setDinnerName('The Spread');
      setValidation("That's a real dinner. You're doing great.");
      setTip('');
      setScreen('name');
    } finally {
      setIsLoading(false);
    }
  };

  const generateBlueprint = async () => {
    setScreen('blueprint');
    setIsLoading(true);
    try {
      const response = await fetch('/api/sketch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      });
      const data = await response.json();

      if (data.imageUrl) {
        setBlueprintUrl(data.imageUrl);
      }
    } catch (error) {
      console.error('Error generating blueprint:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkVibe = async () => {
    if (!userPhoto) return;

    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  // Navigation handlers
  const handleSubmitIngredients = () => generateName();
  const handleSeeBlueprint = () => generateBlueprint();
  const handleJustEat = () => resetApp();
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
            isLoading={isLoading}
          />
        )}

        {screen === 'name' && (
          <NameScreen
            key="name"
            dinnerName={dinnerName}
            validation={validation}
            tip={tip}
            onSeeBlueprint={handleSeeBlueprint}
            onJustEat={handleJustEat}
            isLoading={isLoading}
          />
        )}

        {screen === 'blueprint' && (
          <BlueprintScreen
            key="blueprint"
            dinnerName={dinnerName}
            blueprintUrl={blueprintUrl}
            tip={tip}
            onPlatedIt={handlePlatedIt}
            onStartOver={resetApp}
            isLoading={isLoading}
          />
        )}

        {screen === 'camera' && (
          <CameraScreen
            key="camera"
            onPhotoCapture={handlePhotoCapture}
            onCheckVibe={handleCheckVibe}
            userPhoto={userPhoto}
            isLoading={isLoading}
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
