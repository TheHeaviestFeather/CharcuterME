'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

// =============================================================================
// Icons
// =============================================================================

const CameraIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ShareIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

// =============================================================================
// Types
// =============================================================================

interface VibeCheckResult {
  score: string;
  category: string;
  validation: string;
  observation: string;
}

interface VibeCheckScreenProps {
  dinnerName: string;
  inspirationImage: string | null; // AI generated image URL or base64
  onStartOver: () => void;
}

// =============================================================================
// Fallback Verdicts (Option B - Random)
// =============================================================================

const VIBE_VERDICTS: VibeCheckResult[] = [
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
    score: "∞%",
    category: "Genre-Defining",
    validation: "This transcends scoring. You've invented something.",
    observation: "We're not sure what we're looking at but we respect it.",
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
  {
    score: "yes",
    category: "Beyond Metrics",
    validation: "Numbers cannot contain this energy.",
    observation: "This is art. Messy, delicious art.",
  },
];

function getRandomVerdict(): VibeCheckResult {
  return VIBE_VERDICTS[Math.floor(Math.random() * VIBE_VERDICTS.length)];
}

// =============================================================================
// Component
// =============================================================================

export function VibeCheckScreen({ 
  dinnerName, 
  inspirationImage,
  onStartOver 
}: VibeCheckScreenProps) {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [vibeResult, setVibeResult] = useState<VibeCheckResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);

  // Handle photo upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for display
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setUserPhoto(base64);
      
      // Trigger vibe analysis
      await analyzeVibe(base64);
    };
    reader.readAsDataURL(file);
  };

  // Analyze the vibe (Option B: Random for now, can upgrade to AI)
  const analyzeVibe = async (photoBase64: string) => {
    setIsAnalyzing(true);
    
    // Simulate analysis delay for UX
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Option B: Random verdict
    const verdict = getRandomVerdict();
    setVibeResult(verdict);
    
    setIsAnalyzing(false);
    
    // TODO: Option C - AI Analysis
    // const response = await fetch('/api/vibe-check', {
    //   method: 'POST',
    //   body: JSON.stringify({ 
    //     userPhoto: photoBase64,
    //     inspirationImage,
    //     dinnerName 
    //   }),
    // });
    // const result = await response.json();
    // setVibeResult(result);
  };

  // Share functionality
  const handleShare = async () => {
    // Try native share if available
    if (navigator.share && comparisonRef.current) {
      try {
        await navigator.share({
          title: `${dinnerName} - Vibe Check`,
          text: `I scored ${vibeResult?.score} on my girl dinner! Category: ${vibeResult?.category}`,
          // Note: Can't share canvas directly, would need to generate image
        });
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled');
      }
    } else {
      // Fallback: Copy to clipboard
      const shareText = `${dinnerName}\nVibe Check: ${vibeResult?.score} - ${vibeResult?.category}\n"${vibeResult?.validation}"`;
      await navigator.clipboard.writeText(shareText);
      alert('Copied to clipboard!');
    }
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
          "{dinnerName}"
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
                alt="Inspiration"
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full max-w-[340px] border-2 border-dashed border-[#E8B4A0] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#E8734A] hover:bg-[#FDF8F6] transition-all"
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
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoSelect}
          className="hidden"
        />

        {/* Skip Option */}
        <button
          onClick={onStartOver}
          className="mt-8 text-[#9A8A7C] text-sm hover:text-[#A47864] transition-colors"
        >
          Maybe later
        </button>

        {/* Progress Dots */}
        <div className="flex gap-2 mt-8">
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
        "{dinnerName}"
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
                  alt="Inspiration"
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
            "{vibeResult.validation}"
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
        className="
          w-full max-w-[340px] rounded-xl py-4 px-8 
          text-base font-semibold text-white
          bg-[#E8734A] hover:bg-[#D4623B] 
          transition-all duration-200 ease-out
          hover:-translate-y-0.5 active:translate-y-0
          shadow-lg shadow-[#E8734A]/30
          flex items-center justify-center gap-2
        "
      >
        <ShareIcon />
        <span>Share the Vibe</span>
      </button>

      {/* Start Over */}
      <button
        onClick={onStartOver}
        className="mt-4 text-[#9A8A7C] text-sm hover:text-[#A47864] transition-colors"
      >
        Make another dinner
      </button>

      {/* Progress Dots */}
      <div className="flex gap-2 mt-6">
        <div className="w-2 h-2 rounded-full bg-[#E8734A]" />
        <div className="w-2 h-2 rounded-full bg-[#E8734A]" />
        <div className="w-2 h-2 rounded-full bg-[#E8734A]" />
      </div>
    </div>
  );
}

export default VibeCheckScreen;
