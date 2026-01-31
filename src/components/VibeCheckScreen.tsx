'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { analytics } from '@/lib/analytics';
import { addWatermark } from '@/lib/watermark';

// =============================================================================
// Icons - Clean SVG, no emoji
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

interface VibeApiResponse {
  score: number;
  rank: string;
  compliment: string;
  sticker: string;
  improvement?: string;
}

// =============================================================================
// Fallback Content
// =============================================================================

const OBSERVATIONS = [
  "The lighting suggests you ate this on the couch. Valid.",
  "Bold choice to ignore the arrangement completely.",
  "We can tell you're watching something good.",
  "The background blanket adds +10 cozy points.",
  "This has 'third dinner' energy.",
  "Presentation: chaotic. Taste: probably amazing.",
];

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomScore(): string {
  const rand = Math.random();
  if (rand < 0.05) {
    const funnyScores = ["yes", "100+", "nice"];
    return funnyScores[Math.floor(Math.random() * funnyScores.length)];
  } else if (rand < 0.15) {
    return `${Math.floor(Math.random() * 15) + 101}%`;
  }
  return `${Math.floor(Math.random() * 26) + 74}%`;
}

function generateVibeResult(): VibeCheckResult {
  const categories = ["Culinary Rebel", "Chaos Curator", "Vibe Virtuoso", "Snack Architect"];
  const validations = [
    "Chaotic perfection. The algorithm is impressed.",
    "You understood the assignment.",
    "The vibes are immaculate.",
    "Chef's kiss. Or at least a chef's nod.",
  ];
  return {
    score: generateRandomScore(),
    category: getRandomItem(categories),
    validation: getRandomItem(validations),
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
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { name: dinnerName } = dinnerData;

  // Cleanup blob URLs on unmount
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

    analytics.vibeUpload();

    if (userPhotoBlobUrl) {
      URL.revokeObjectURL(userPhotoBlobUrl);
    }

    const blobUrl = URL.createObjectURL(file);
    setUserPhotoBlobUrl(blobUrl);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setUserPhoto(base64);
      await analyzeVibe(base64);
    };
    reader.readAsDataURL(file);
  };

  // Analyze the vibe via API
  const analyzeVibe = async (photoBase64: string) => {
    setIsAnalyzing(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

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

      setVibeResult({
        score: `${data.score}%`,
        category: data.rank,
        validation: data.compliment,
        observation: data.improvement || getRandomItem(OBSERVATIONS),
      });

      analytics.vibeComplete(data.score, data.rank);
    } catch (error) {
      console.error('Vibe check API error:', error);
      setVibeResult(generateVibeResult());
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate caption
  const generateCaption = useCallback((includeVibeScore: boolean = false) => {
    if (includeVibeScore && vibeResult) {
      return `Tonight's dinner: "${dinnerName}"\n\nVibe Score: ${vibeResult.score} — ${vibeResult.category}\n"${vibeResult.validation}"\n\n#CharcuterME #GirlDinner`;
    }
    return `Tonight's dinner: "${dinnerName}"\n\n#CharcuterME #GirlDinner`;
  }, [dinnerName, vibeResult]);

  // Share with vibe score
  const handleShare = useCallback(async () => {
    const caption = generateCaption(true);
    analytics.shareClick('vibe', !!userPhoto);

    try {
      const canShareFiles = typeof navigator.share === 'function' && typeof navigator.canShare === 'function';

      if (canShareFiles && userPhoto) {
        try {
          const watermarkedUrl = await addWatermark(userPhoto);
          const response = await fetch(watermarkedUrl);
          const blob = await response.blob();
          const file = new File([blob], 'charcuterme-vibe.png', { type: 'image/png' });

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `${dinnerName} - Vibe Check`,
              text: caption,
              files: [file],
            });
            analytics.shareComplete('vibe', 'native', true);
            setShareFeedback('Shared!');
            setTimeout(() => setShareFeedback(null), 2000);
            return;
          }
        } catch {
          // Fall through
        }
      }

      if (navigator.share) {
        try {
          await navigator.share({
            title: `${dinnerName} - Vibe Check`,
            text: caption,
          });
          analytics.shareComplete('vibe', 'native', false);
          setShareFeedback('Caption shared!');
          setTimeout(() => setShareFeedback(null), 2000);
          return;
        } catch (e) {
          if (e instanceof Error && e.name === 'AbortError') {
            return;
          }
        }
      }

      await navigator.clipboard.writeText(caption);
      analytics.shareComplete('vibe', 'clipboard', false);
      setShareFeedback('Caption copied!');
      setTimeout(() => setShareFeedback(null), 3000);

    } catch {
      setShareFeedback('Caption copied!');
      try {
        await navigator.clipboard.writeText(caption);
      } catch { /* ignore */ }
      setTimeout(() => setShareFeedback(null), 3000);
    }
  }, [dinnerName, generateCaption, userPhoto]);

  // Skip upload, still share
  const handleSkipShare = useCallback(async () => {
    const caption = generateCaption(false);
    analytics.shareClick('vibe', !!inspirationImage);

    try {
      const canShareFiles = typeof navigator.share === 'function' && typeof navigator.canShare === 'function';

      if (canShareFiles && inspirationImage) {
        try {
          const watermarkedUrl = await addWatermark(inspirationImage);
          const response = await fetch(watermarkedUrl);
          const blob = await response.blob();
          const file = new File([blob], 'charcuterme-dinner.png', { type: 'image/png' });

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `${dinnerName} - CharcuterME`,
              text: caption,
              files: [file],
            });
            analytics.shareComplete('vibe', 'native', true);
            setShareFeedback('Shared!');
            setTimeout(() => setShareFeedback(null), 2000);
            return;
          }
        } catch {
          // Fall through
        }
      }

      if (navigator.share) {
        try {
          await navigator.share({
            title: `${dinnerName} - CharcuterME`,
            text: caption,
          });
          analytics.shareComplete('vibe', 'native', false);
          setShareFeedback('Caption shared!');
          setTimeout(() => setShareFeedback(null), 2000);
          return;
        } catch (e) {
          if (e instanceof Error && e.name === 'AbortError') {
            return;
          }
        }
      }

      await navigator.clipboard.writeText(caption);
      analytics.shareComplete('vibe', 'clipboard', false);
      setShareFeedback('Caption copied!');
      setTimeout(() => setShareFeedback(null), 3000);

    } catch {
      await navigator.clipboard.writeText(caption);
      setShareFeedback('Caption copied!');
      setTimeout(() => setShareFeedback(null), 3000);
    }
  }, [dinnerName, generateCaption, inspirationImage]);

  // =============================================================================
  // Render: Photo Upload State
  // =============================================================================

  if (!userPhoto) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center px-5 py-6">
        <p className="text-text-muted text-sm font-medium mb-2 mt-2">
          optional upgrade:
        </p>
        <h1 className="font-display text-3xl italic text-coral text-center mb-2">
          &ldquo;{dinnerName}&rdquo;
        </h1>
        <p className="text-text-secondary text-base text-center mb-8 max-w-[300px]">
          Upload your real plate for an AI roast and vibe score
        </p>

        {/* Inspiration Preview */}
        {inspirationImage && (
          <div className="w-full max-w-[280px] mb-6">
            <p className="text-text-muted text-xs text-center mb-2 uppercase tracking-wide font-medium">
              The Inspiration
            </p>
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg border-2 border-peach">
              <Image
                src={inspirationImage}
                alt="Inspiration"
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}

        {/* Upload Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full max-w-[360px] border-2 border-dashed border-coral/40 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-coral hover:bg-peach/50 transition-all"
        >
          <div className="w-16 h-16 rounded-full bg-peach flex items-center justify-center mb-4 text-coral">
            <CameraIcon />
          </div>
          <p className="text-coral font-semibold mb-1">
            Show us what you actually made
          </p>
          <p className="text-text-muted text-sm text-center">
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

        {/* Skip and Share */}
        <button
          onClick={handleSkipShare}
          className="mt-8 w-full max-w-[360px] rounded-2xl py-4 px-8 text-base font-bold text-white bg-coral hover:bg-coral-dark transition-all shadow-lg shadow-coral/30 flex items-center justify-center gap-3"
        >
          <ShareIcon />
          <span>Skip this, just share</span>
        </button>

        {/* Feedback Toast */}
        {shareFeedback && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-text-primary text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-fade-in z-50">
            {shareFeedback}
          </div>
        )}

        {/* Back */}
        <button
          onClick={onStartOver}
          className="mt-4 text-text-muted text-sm hover:text-text-secondary transition-colors underline underline-offset-2"
        >
          Back to results
        </button>
      </div>
    );
  }

  // =============================================================================
  // Render: Analyzing State
  // =============================================================================

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-8">
        <div className="w-14 h-14 border-4 border-peach border-t-coral rounded-full animate-spin mb-6" />
        <p className="text-coral font-display text-2xl italic mb-2">
          AI is judging your plate...
        </p>
        <p className="text-text-muted text-sm">
          Preparing a witty roast
        </p>
      </div>
    );
  }

  // =============================================================================
  // Render: Results State
  // =============================================================================

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center px-5 py-6">
      <p className="text-text-muted text-sm font-medium mb-2 mt-2">
        vibe check complete:
      </p>
      <h1 className="font-display text-3xl italic text-coral text-center mb-6">
        &ldquo;{dinnerName}&rdquo;
      </h1>

      {/* Side by Side Comparison */}
      <div className="w-full max-w-[380px] mb-6">
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-text-muted text-xs text-center mb-2 uppercase tracking-wide font-medium">
              Inspiration
            </p>
            <div className="relative aspect-square rounded-xl overflow-hidden shadow-md bg-white border border-peach">
              {inspirationImage ? (
                <Image src={inspirationImage} alt="Inspiration" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted text-sm">
                  No image
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-text-muted text-xs text-center mb-2 uppercase tracking-wide font-medium">
              Reality
            </p>
            <div className="relative aspect-square rounded-xl overflow-hidden shadow-md bg-white border border-peach">
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

      {/* Score Card */}
      {vibeResult && (
        <div className="w-full max-w-[360px] bg-white rounded-2xl p-6 shadow-xl border-2 border-peach mb-5">
          <div className="text-center mb-4">
            <p className="text-6xl font-bold text-coral mb-1">
              {vibeResult.score}
            </p>
            <p className="text-text-secondary font-semibold uppercase tracking-wide text-sm">
              {vibeResult.category}
            </p>
          </div>
          <div className="w-12 h-0.5 bg-peach mx-auto mb-4" />
          <p className="text-text-primary text-center mb-3 font-medium">
            &ldquo;{vibeResult.validation}&rdquo;
          </p>
          <p className="text-text-muted text-sm text-center italic">
            {vibeResult.observation}
          </p>
        </div>
      )}

      {/* Feedback Toast */}
      {shareFeedback && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-text-primary text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-fade-in z-50">
          {shareFeedback}
        </div>
      )}

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="w-full max-w-[360px] rounded-2xl py-5 px-8 text-lg font-bold text-white bg-coral hover:bg-coral-dark transition-all shadow-lg shadow-coral/30 flex items-center justify-center gap-3 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
      >
        <ShareIcon />
        <span>Share the Roast</span>
      </button>

      {/* Start Over */}
      <button
        onClick={onStartOver}
        className="mt-6 text-text-muted text-sm hover:text-text-secondary transition-colors underline underline-offset-2"
      >
        Make another dinner
      </button>
    </div>
  );
}

export default VibeCheckScreen;
