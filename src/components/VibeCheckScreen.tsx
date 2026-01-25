'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import type { VibeCheckResponse } from '@/types';

// =============================================================================
// Icons
// =============================================================================

const CameraIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ShareIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

// =============================================================================
// Types
// =============================================================================

interface LocalVibeResult {
  score: string;
  category: string;
  validation: string;
  observation: string;
}

interface VibeCheckScreenProps {
  dinnerName: string;
  ingredients: string;
  inspirationImage: string | null;
  onStartOver: () => void;
}

// =============================================================================
// Fallback Verdicts
// =============================================================================

const VIBE_VERDICTS: LocalVibeResult[] = [
  {
    score: "97%",
    category: "Unhinged Excellence",
    validation: "Chaotic perfection. The algorithm is impressed.",
    observation: "The lighting suggests you ate this in bed. Valid.",
  },
  {
    score: "84%",
    category: "Acceptable Chaos",
    validation: "You understood the assignment. Mostly.",
    observation: "Points deducted for using a real plate instead of the container.",
  },
  {
    score: "102%",
    category: "Overachiever",
    validation: "You've exceeded the vibe. This is technically illegal.",
    observation: "Did you... garnish? In this economy?",
  },
  {
    score: "76%",
    category: "Abstract Interpretation",
    validation: "The spirit is there. The execution is... artistic.",
    observation: "Bold choice to ignore the arrangement completely.",
  },
  {
    score: "91%",
    category: "Chaos Curator",
    validation: "You've achieved maximum cozy with minimum effort.",
    observation: "The fork placement says 'I might not use this.'",
  },
  {
    score: "88%",
    category: "Horizontal Dining",
    validation: "This plate has 'eaten on the couch' energy. Perfect.",
    observation: "We can tell you're watching something good.",
  },
];

function getRandomVerdict(): LocalVibeResult {
  return VIBE_VERDICTS[Math.floor(Math.random() * VIBE_VERDICTS.length)];
}

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// =============================================================================
// Component
// =============================================================================

export function VibeCheckScreen({
  dinnerName,
  ingredients,
  inspirationImage,
  onStartOver,
}: VibeCheckScreenProps) {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [vibeResult, setVibeResult] = useState<LocalVibeResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);

  // Handle photo upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('Image is too large (max 10MB)');
      return;
    }

    // Convert to base64 for display
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setUserPhoto(base64);
      await analyzeVibe(base64);
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  // Analyze the vibe
  const analyzeVibe = async (photoBase64: string) => {
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/vibe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo: photoBase64,
          dinnerName,
          ingredients,
          rules: [],
        }),
      });

      if (response.ok) {
        const data: VibeCheckResponse = await response.json();
        // Convert API response to local format
        setVibeResult({
          score: `${data.score}%`,
          category: data.rank,
          validation: data.compliment,
          observation: data.improvement || "No notes. Just vibes.",
        });
      } else {
        // Use fallback on error
        setVibeResult(getRandomVerdict());
      }
    } catch {
      // Use fallback on error
      setVibeResult(getRandomVerdict());
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Share functionality
  const handleShare = async () => {
    if (navigator.share && vibeResult) {
      try {
        await navigator.share({
          title: `${dinnerName} - Vibe Check`,
          text: `I scored ${vibeResult.score} on my girl dinner! Category: ${vibeResult.category}`,
        });
      } catch {
        // User cancelled or share failed - copy to clipboard instead
        await copyToClipboard();
      }
    } else {
      await copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    if (!vibeResult) return;
    const shareText = `${dinnerName}\nVibe Check: ${vibeResult.score} - ${vibeResult.category}\n"${vibeResult.validation}"`;
    await navigator.clipboard.writeText(shareText);
    alert('Copied to clipboard!');
  };

  // =============================================================================
  // Render: Photo Capture State
  // =============================================================================

  if (!userPhoto) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] flex flex-col items-center px-6 py-8">
        {/* Header */}
        <p className="text-[#9A8A7C] text-sm mb-2 mt-4">
          Time to check the vibe
        </p>
        <h1 className="font-serif text-2xl italic text-[#A47864] text-center mb-8">
          &ldquo;{dinnerName}&rdquo;
        </h1>

        {/* Inspiration Preview */}
        {inspirationImage && (
          <div className="w-full max-w-[280px] mb-8">
            <p className="text-[#9A8A7C] text-xs text-center mb-2 uppercase tracking-wide">
              The Inspiration
            </p>
            <div className="relative aspect-square rounded-xl overflow-hidden shadow-md">
              <Image
                src={inspirationImage}
                alt={`AI generated inspiration for ${dinnerName}`}
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm max-w-[340px]"
          >
            {error}
          </div>
        )}

        {/* Upload Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Upload photo of your plated dinner"
          className="w-full max-w-[340px] border-2 border-dashed border-[#E8B4A0] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#E8734A] hover:bg-[#FDF8F6] transition-all focus:outline-none focus:ring-2 focus:ring-[#E8734A] focus:ring-offset-2"
        >
          <div className="w-16 h-16 rounded-full bg-[#F5E6E0] flex items-center justify-center mb-4 text-[#A47864]">
            <CameraIcon />
          </div>
          <p className="text-[#A47864] font-medium mb-1">
            Show us what you made
          </p>
          <p className="text-[#9A8A7C] text-sm text-center">
            Tap to take a photo or upload
          </p>
          <p className="text-[#C4B5A9] text-xs mt-2">Max size: 10MB</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoSelect}
          className="hidden"
          aria-label="Upload photo file"
        />

        {/* Skip Option */}
        <button
          onClick={onStartOver}
          aria-label="Skip vibe check and start over"
          className="mt-8 text-[#9A8A7C] text-sm hover:text-[#A47864] transition-colors focus:outline-none focus:underline"
        >
          Maybe later
        </button>

        {/* Progress Dots */}
        <div className="flex gap-2 mt-8" role="presentation">
          <div className="w-2 h-2 rounded-full bg-[#E8734A]" />
          <div className="w-2 h-2 rounded-full bg-[#E8734A]" />
          <div className="w-2 h-2 rounded-full bg-[#E8B4A0]" />
        </div>
      </div>
    );
  }

  // =============================================================================
  // Render: Analyzing State
  // =============================================================================

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] flex flex-col items-center justify-center px-6 py-8">
        <div className="w-12 h-12 border-3 border-[#E8B4A0] border-t-[#E8734A] rounded-full animate-spin mb-6" />
        <p className="text-[#A47864] font-serif text-xl italic mb-2">
          Analyzing the vibe...
        </p>
        <p className="text-[#9A8A7C] text-sm">
          Consulting the chaos algorithms
        </p>
      </div>
    );
  }

  // =============================================================================
  // Render: Results State
  // =============================================================================

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex flex-col items-center px-6 py-8">
      {/* Header */}
      <p className="text-[#9A8A7C] text-sm mb-1 mt-2">
        Vibe Check Complete
      </p>
      <h1 className="font-serif text-2xl italic text-[#A47864] text-center mb-6">
        &ldquo;{dinnerName}&rdquo;
      </h1>

      {/* Side by Side Comparison */}
      <div ref={comparisonRef} className="w-full max-w-[360px] mb-6">
        <div className="flex gap-3">
          {/* Inspiration */}
          <div className="flex-1">
            <p className="text-[#9A8A7C] text-xs text-center mb-2 uppercase tracking-wide">
              Inspiration
            </p>
            <div className="relative aspect-square rounded-xl overflow-hidden shadow-md bg-white">
              {inspirationImage ? (
                <Image
                  src={inspirationImage}
                  alt="AI generated inspiration"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#9A8A7C] text-sm">
                  No image
                </div>
              )}
            </div>
          </div>

          {/* Reality */}
          <div className="flex-1">
            <p className="text-[#9A8A7C] text-xs text-center mb-2 uppercase tracking-wide">
              Reality
            </p>
            <div className="relative aspect-square rounded-xl overflow-hidden shadow-md bg-white">
              <Image
                src={userPhoto}
                alt="Your creation"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vibe Score */}
      {vibeResult && (
        <div className="w-full max-w-[340px] bg-white rounded-2xl p-6 shadow-md mb-6">
          {/* Score */}
          <div className="text-center mb-4">
            <p className="text-5xl font-bold text-[#E8734A] mb-1">
              {vibeResult.score}
            </p>
            <p className="text-[#A47864] font-medium uppercase tracking-wide text-sm">
              {vibeResult.category}
            </p>
          </div>

          {/* Divider */}
          <div className="w-12 h-0.5 bg-[#E8B4A0] mx-auto mb-4" />

          {/* Validation */}
          <p className="text-[#6B5B4F] text-center mb-3">
            &ldquo;{vibeResult.validation}&rdquo;
          </p>

          {/* Observation */}
          <p className="text-[#9A8A7C] text-sm text-center italic">
            {vibeResult.observation}
          </p>
        </div>
      )}

      {/* Share Button */}
      <button
        onClick={handleShare}
        aria-label="Share your vibe check results"
        className="
          w-full max-w-[340px] rounded-xl py-4 px-8
          text-base font-semibold text-white
          bg-[#E8734A] hover:bg-[#D4623B]
          transition-all duration-200 ease-out
          hover:-translate-y-0.5 active:translate-y-0
          shadow-lg shadow-[#E8734A]/30
          flex items-center justify-center gap-2
          focus:outline-none focus:ring-2 focus:ring-[#E8734A] focus:ring-offset-2
        "
      >
        <ShareIcon />
        <span>Share the Vibe</span>
      </button>

      {/* Start Over */}
      <button
        onClick={onStartOver}
        aria-label="Make another dinner"
        className="mt-4 text-[#9A8A7C] text-sm hover:text-[#A47864] transition-colors focus:outline-none focus:underline"
      >
        Make another dinner
      </button>

      {/* Progress Dots */}
      <div className="flex gap-2 mt-6" role="presentation">
        <div className="w-2 h-2 rounded-full bg-[#E8734A]" />
        <div className="w-2 h-2 rounded-full bg-[#E8734A]" />
        <div className="w-2 h-2 rounded-full bg-[#E8734A]" />
      </div>
    </div>
  );
}

export default VibeCheckScreen;
