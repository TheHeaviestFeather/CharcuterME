'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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

const LightbulbIcon = () => (
  <svg className="w-5 h-5 text-[#E8734A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const DiceIcon = () => (
  <svg className="w-5 h-5 text-[#A47864]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
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

interface DinnerData {
  name: string;
  validation: string;
  tip: string;
  wildcard?: string;
}

interface VibeCheckScreenProps {
  dinnerData: DinnerData;
  ingredients: string;
  inspirationImage: string | null;
  onStartOver: () => void;
}

// API Response type (matches /api/vibe response)
interface VibeApiResponse {
  score: number;
  rank: string;
  compliment: string;
  sticker: string;
  improvement?: string;
}

// =============================================================================
// Dynamic Vibe Scoring
// =============================================================================

const VIBE_CATEGORIES = [
  "Unhinged Excellence",
  "Acceptable Chaos",
  "Horizontal Dining",
  "Chaos Curator",
  "Snack Architect",
  "Couch Connoisseur",
  "Fridge Poet",
  "Midnight Masterpiece",
  "Comfort Zone Champion",
  "Culinary Rebel",
  "Vibe Virtuoso",
  "Plate Picasso",
  "Snack Stack Genius",
  "Delicious Disaster",
  "Perfectly Imperfect",
];

const VALIDATIONS = [
  "Chaotic perfection. The algorithm is impressed.",
  "You understood the assignment. Mostly.",
  "This is exactly what dinner should look like.",
  "Peak horizontal dining energy detected.",
  "You've somehow exceeded our expectations.",
  "The vibes are immaculate.",
  "This plate tells a story. A delicious one.",
  "Chef's kiss. Or at least a chef's nod.",
  "You've achieved maximum cozy with minimum effort.",
  "The chaos is... beautiful?",
  "Objectively perfect. Don't @ us.",
  "This is art. Messy, delicious art.",
  "Your ancestors would be... confused but proud.",
  "The fridge gave you lemons. You made... this.",
  "Comfort food achievement unlocked.",
];

const OBSERVATIONS = [
  "The lighting suggests you ate this in bed. Valid.",
  "Points deducted for using a real plate instead of the container.",
  "Bold choice to ignore the arrangement completely.",
  "The fork placement says 'I might not use this.'",
  "We can tell you're watching something good.",
  "Suspiciously well-lit. Are you okay?",
  "The napkin is a nice touch. Fancy.",
  "We see that wine glass. Self-care queen.",
  "The background blanket adds +10 cozy points.",
  "Eaten standing up? Respect.",
  "The angle says 'I took 47 photos to get this one.'",
  "We appreciate the effort. And the chaos.",
  "The crumbs tell a story of commitment.",
  "This has 'third dinner' energy.",
  "Presentation: chaotic. Taste: probably amazing.",
];

function generateRandomScore(): string {
  // Generate varied scores with some fun outliers
  const rand = Math.random();

  if (rand < 0.05) {
    // 5% chance of funny non-numeric scores
    const funnyScores = ["yes", "\u221E", "100+", "???", "nice", "chef's kiss"];
    return funnyScores[Math.floor(Math.random() * funnyScores.length)];
  } else if (rand < 0.15) {
    // 10% chance of "over 100" scores
    return `${Math.floor(Math.random() * 15) + 101}%`;
  } else {
    // 85% chance of normal-ish scores (74-99)
    return `${Math.floor(Math.random() * 26) + 74}%`;
  }
}

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateVibeResult(): VibeCheckResult {
  return {
    score: generateRandomScore(),
    category: getRandomItem(VIBE_CATEGORIES),
    validation: getRandomItem(VALIDATIONS),
    observation: getRandomItem(OBSERVATIONS),
  };
}

// =============================================================================
// Component
// =============================================================================

export function VibeCheckScreen({
  dinnerData,
  ingredients,
  inspirationImage,
  onStartOver
}: VibeCheckScreenProps) {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [userPhotoBlobUrl, setUserPhotoBlobUrl] = useState<string | null>(null);
  const [vibeResult, setVibeResult] = useState<VibeCheckResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);

  // Destructure dinner data
  const { name: dinnerName, tip, wildcard } = dinnerData;

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (userPhotoBlobUrl) {
        URL.revokeObjectURL(userPhotoBlobUrl);
      }
    };
  }, [userPhotoBlobUrl]);

  // Handle photo upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke previous blob URL if exists
    if (userPhotoBlobUrl) {
      URL.revokeObjectURL(userPhotoBlobUrl);
    }

    // Create blob URL for efficient display
    const blobUrl = URL.createObjectURL(file);
    setUserPhotoBlobUrl(blobUrl);

    // Convert to base64 for API (required for GPT-4o Vision)
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setUserPhoto(base64);

      // Trigger vibe analysis with the photo
      await analyzeVibe(base64);
    };
    reader.readAsDataURL(file);
  };

  // Analyze the vibe - calls the AI API for witty feedback
  const analyzeVibe = async (photoBase64: string) => {
    setIsAnalyzing(true);

    try {
      // Call the vibe check API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch('/api/vibe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo: photoBase64,
          dinnerName,
          ingredients,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: VibeApiResponse = await response.json();

      // Map API response to component format
      setVibeResult({
        score: `${data.score}%`,
        category: data.rank,
        validation: data.compliment,
        observation: data.improvement || getRandomItem(OBSERVATIONS),
      });
    } catch (error) {
      console.error('Vibe check API error:', error);
      // Fallback to random generation if API fails
      setVibeResult(generateVibeResult());
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate caption for sharing
  const generateCaption = useCallback((includeVibeScore: boolean = false) => {
    if (includeVibeScore && vibeResult) {
      return `Tonight's dinner: "${dinnerName}"\n\nVibe Score: ${vibeResult.score} - ${vibeResult.category}\n"${vibeResult.validation}"\n\n#CharcuterME #GirlDinner #FoodVibes`;
    }
    return `Tonight's dinner: "${dinnerName}"\n\n#CharcuterME #GirlDinner #FoodVibes`;
  }, [dinnerName, vibeResult]);

  // Share functionality (with vibe score)
  const handleShare = useCallback(async () => {
    const caption = generateCaption(true);

    // Try native share if available
    if (navigator.share) {
      try {
        const shareData: ShareData = {
          title: `${dinnerName} - Vibe Check`,
          text: caption,
        };

        // Try to include the user photo if available
        if (userPhoto) {
          try {
            const response = await fetch(userPhoto);
            const blob = await response.blob();
            const file = new File([blob], 'charcuterme-vibe.png', { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
          } catch {
            // Continue without image
          }
        }

        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed - fallback to clipboard
        await navigator.clipboard.writeText(caption);
        alert('Caption copied to clipboard!');
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(caption);
      alert('Caption copied to clipboard!');
    }
  }, [dinnerName, generateCaption, userPhoto]);

  // Skip upload but still share (no vibe score)
  const handleSkipUploadStillShare = useCallback(async () => {
    const caption = generateCaption(false);

    if (navigator.share) {
      try {
        const shareData: ShareData = {
          title: `${dinnerName} - CharcuterME`,
          text: caption,
        };

        // Try to include the inspiration image
        if (inspirationImage) {
          try {
            const response = await fetch(inspirationImage);
            const blob = await response.blob();
            const file = new File([blob], 'charcuterme-dinner.png', { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
          } catch {
            // Continue without image
          }
        }

        await navigator.share(shareData);
      } catch {
        // User cancelled - fallback to clipboard
        await navigator.clipboard.writeText(caption);
        alert('Caption copied! Open Instagram to share.');
      }
    } else {
      await navigator.clipboard.writeText(caption);
      alert('Caption copied! Open Instagram to share.');
    }
  }, [dinnerName, generateCaption, inspirationImage]);

  // =============================================================================
  // Render: Photo Capture State
  // =============================================================================

  if (!userPhoto) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] flex flex-col items-center px-6 py-8">
        {/* Header */}
        <p className="text-[#736B63] text-sm mb-2 mt-4">
          Optional: Level up your share
        </p>
        <h1 className="font-serif text-2xl italic text-[#A47864] text-center mb-2">
          &ldquo;{dinnerName}&rdquo;
        </h1>
        {/* Value clarification */}
        <p className="text-[#6B5B4F] text-sm text-center mb-6 max-w-[300px]">
          Upload a photo to get a vibe score + side-by-side comparison
        </p>

        {/* Inspiration Preview */}
        {inspirationImage && (
          <div className="w-full max-w-[280px] mb-6">
            <p className="text-[#736B63] text-xs text-center mb-2 uppercase tracking-wide">
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
          <p className="text-[#736B63] text-sm text-center">
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

        {/* Skip upload, still share */}
        <button
          onClick={handleSkipUploadStillShare}
          className="
            mt-6 w-full max-w-[340px] rounded-xl py-3 px-6
            text-sm font-medium text-white
            bg-gradient-to-r from-[#E8734A] to-[#C13584]
            hover:from-[#D4623B] hover:to-[#A02B70]
            transition-all duration-200
            flex items-center justify-center gap-2
          "
        >
          <InstagramIcon />
          <span>Skip upload, still share</span>
        </button>

        {/* Back option */}
        <button
          onClick={onStartOver}
          className="mt-4 text-[#736B63] text-sm hover:text-[#A47864] transition-colors"
        >
          Back to results
        </button>

        {/* Progress Dots */}
        <div className="flex gap-2 mt-6">
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
          AI is judging your plate...
        </p>
        <p className="text-[#736B63] text-sm">
          GPT-4o is crafting a witty roast
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
      <p className="text-[#736B63] text-sm mb-1 mt-2">
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
            <p className="text-[#736B63] text-xs text-center mb-2 uppercase tracking-wide">
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
                <div className="w-full h-full flex items-center justify-center text-[#736B63] text-sm">
                  No image
                </div>
              )}
            </div>
          </div>

          {/* Reality */}
          <div className="flex-1">
            <p className="text-[#736B63] text-xs text-center mb-2 uppercase tracking-wide">
              Reality
            </p>
            <div className="relative aspect-square rounded-xl overflow-hidden shadow-md bg-white">
              {/* Use blob URL for display (more memory efficient than base64) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={userPhotoBlobUrl || userPhoto || ''}
                alt="Your creation"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vibe Score */}
      {vibeResult && (
        <div className="w-full max-w-[340px] bg-white rounded-2xl p-6 shadow-md mb-4">
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
          <p className="text-[#736B63] text-sm text-center italic">
            {vibeResult.observation}
          </p>
        </div>
      )}

      {/* Tip from original results */}
      {tip && (
        <div className="w-full max-w-[340px] mb-3">
          <div className="bg-white rounded-xl px-4 py-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <LightbulbIcon />
              </div>
              <p className="text-[#6B5B4F] text-sm">
                {tip}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Wildcard from original results */}
      {wildcard && (
        <div className="w-full max-w-[340px] mb-6">
          <div className="bg-[#F5E6E0] rounded-xl px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <DiceIcon />
              </div>
              <div>
                <p className="text-[#A47864] text-xs font-medium uppercase tracking-wide mb-1">
                  Next time try
                </p>
                <p className="text-[#6B5B4F] text-sm">
                  {wildcard}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Button - Instagram gradient */}
      <button
        onClick={handleShare}
        className="
          w-full max-w-[340px] rounded-xl py-4 px-8
          text-base font-semibold text-white
          bg-gradient-to-r from-[#E8734A] to-[#C13584]
          hover:from-[#D4623B] hover:to-[#A02B70]
          transition-all duration-200 ease-out
          hover:-translate-y-0.5 active:translate-y-0
          shadow-lg shadow-[#E8734A]/30
          flex items-center justify-center gap-2
        "
      >
        <InstagramIcon />
        <span>Share to Stories</span>
      </button>

      {/* Start Over */}
      <button
        onClick={onStartOver}
        className="mt-4 text-[#736B63] text-sm hover:text-[#A47864] transition-colors"
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
