'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { CameraIcon, LightbulbIcon, DiceIcon, InstagramIcon, LoaderIcon } from './icons';
import { ProgressDots } from './ProgressDots';
import { shareWithImage, generateCaption, generateSimpleCaption } from '@/utils';

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
  inspirationImage: string | null;
  onStartOver: () => void;
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
  inspirationImage,
  onStartOver
}: VibeCheckScreenProps) {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [vibeResult, setVibeResult] = useState<VibeCheckResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);

  // Destructure dinner data
  const { name: dinnerName, tip, wildcard } = dinnerData;

  // Show feedback with auto-dismiss
  const showFeedback = useCallback((message: string, duration = 2000) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), duration);
  }, []);

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
      await analyzeVibe();
    };
    reader.readAsDataURL(file);
  };

  // Analyze the vibe - generates truly random results each time
  const analyzeVibe = async () => {
    setIsAnalyzing(true);

    // Simulate analysis delay for UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate fresh random verdict
    const verdict = generateVibeResult();
    setVibeResult(verdict);

    setIsAnalyzing(false);
  };

  // Share functionality (with vibe score)
  const handleShare = useCallback(async () => {
    if (!vibeResult) return;

    setIsSharing(true);
    try {
      const caption = generateCaption({
        dinnerName,
        validation: vibeResult.validation,
        vibeScore: vibeResult.score,
        vibeCategory: vibeResult.category,
      });

      const result = await shareWithImage({
        title: `${dinnerName} - Vibe Check`,
        caption,
        imageUrl: userPhoto,
        fileName: 'charcuterme-vibe.png',
      });

      if (result.message && result.method === 'clipboard') {
        showFeedback(result.message, 3000);
      }
    } finally {
      setIsSharing(false);
    }
  }, [dinnerName, vibeResult, userPhoto, showFeedback]);

  // Skip upload but still share (no vibe score)
  const handleSkipUploadStillShare = useCallback(async () => {
    setIsSharing(true);
    try {
      const caption = generateSimpleCaption(dinnerName);

      const result = await shareWithImage({
        title: `${dinnerName} - CharcuterME`,
        caption,
        imageUrl: inspirationImage,
        fileName: 'charcuterme-dinner.png',
      });

      if (result.message && result.method === 'clipboard') {
        showFeedback(result.message, 3000);
      }
    } finally {
      setIsSharing(false);
    }
  }, [dinnerName, inspirationImage, showFeedback]);

  // =============================================================================
  // Render: Photo Capture State
  // =============================================================================

  if (!userPhoto) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] flex flex-col items-center px-6 py-8">
        {/* Header */}
        <p className="text-[#9A8A7C] text-sm mb-2 mt-4">
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

        {/* Skip upload, still share */}
        <button
          onClick={handleSkipUploadStillShare}
          disabled={isSharing}
          className="
            mt-6 w-full max-w-[340px] rounded-xl py-3 px-6
            text-sm font-medium text-white
            bg-gradient-to-r from-[#E8734A] to-[#C13584]
            hover:from-[#D4623B] hover:to-[#A02B70]
            transition-all duration-200
            flex items-center justify-center gap-2
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isSharing ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <InstagramIcon />}
          <span>{isSharing ? 'Sharing...' : 'Skip upload, still share'}</span>
        </button>

        {/* Feedback toast */}
        {feedback && (
          <p className="text-center text-sm text-[#E8734A] mt-3 animate-fade-in">
            {feedback}
          </p>
        )}

        {/* Back option */}
        <button
          onClick={onStartOver}
          className="mt-4 text-[#9A8A7C] text-sm hover:text-[#A47864] transition-colors"
        >
          Back to results
        </button>

        {/* Progress Dots */}
        <ProgressDots currentStep={2} className="mt-6" />
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
          <p className="text-[#9A8A7C] text-sm text-center italic">
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

      {/* Feedback toast */}
      {feedback && (
        <p className="text-center text-sm text-[#E8734A] mb-4 animate-fade-in">
          {feedback}
        </p>
      )}

      {/* Share Button - Instagram gradient */}
      <button
        onClick={handleShare}
        disabled={isSharing}
        className="
          w-full max-w-[340px] rounded-xl py-4 px-8
          text-base font-semibold text-white
          bg-gradient-to-r from-[#E8734A] to-[#C13584]
          hover:from-[#D4623B] hover:to-[#A02B70]
          transition-all duration-200 ease-out
          hover:-translate-y-0.5 active:translate-y-0
          shadow-lg shadow-[#E8734A]/30
          flex items-center justify-center gap-2
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
        "
      >
        {isSharing ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <InstagramIcon />}
        <span>{isSharing ? 'Sharing...' : 'Share to Stories'}</span>
      </button>

      {/* Start Over */}
      <button
        onClick={onStartOver}
        className="mt-4 text-[#9A8A7C] text-sm hover:text-[#A47864] transition-colors"
      >
        Make another dinner
      </button>

      {/* Progress Dots */}
      <ProgressDots currentStep={3} className="mt-6" />
    </div>
  );
}

export default VibeCheckScreen;
