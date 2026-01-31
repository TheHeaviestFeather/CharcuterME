'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback, useMemo } from 'react';
import DOMPurify from 'dompurify';

// =============================================================================
// Icons (SVG replacements for emojis)
// =============================================================================

const CheckIcon = () => (
  <svg className="w-5 h-5 text-[#E8734A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const LightbulbIcon = () => (
  <svg className="w-5 h-5 text-[#E8734A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const DiceIcon = () => (
  <svg className="w-5 h-5 text-[#A47864]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const CameraIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

// =============================================================================
// Results Screen - Name Reveal + Blueprint (Share First)
// =============================================================================

interface ResultsScreenProps {
  dinnerName: string;
  validation: string;
  tip: string;
  wildcard?: string;
  imageUrl?: string | null;
  svgFallback?: string | null;
  onCheckVibe: () => void;
  onJustEat?: () => void;
  onRetryImage?: () => void;
  isLoadingImage?: boolean;
  imageError?: boolean;
}

// Image loading messages
const IMAGE_LOADING_MESSAGES = [
  "Arranging your spread...",
  "Adjusting the lighting...",
  "Finding the perfect angle...",
  "Adding cozy vibes...",
  "Almost Instagram-ready...",
  "Perfecting the aesthetic...",
  "Making it look delicious...",
  "Final touches...",
];

// Generate caption text
function generateCaption(dinnerName: string, validation: string): string {
  const cleanValidation = validation.replace(/^[✓✔]\s*/, '');
  return `Tonight's dinner: "${dinnerName}"\n\n${cleanValidation}\n\n#CharcuterME #GirlDinner #FoodVibes`;
}

export function ResultsScreen({
  dinnerName,
  validation,
  tip,
  wildcard,
  imageUrl,
  svgFallback,
  onCheckVibe,
  onJustEat,
  onRetryImage,
  isLoadingImage = false,
  imageError = false,
}: ResultsScreenProps) {
  // State
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  useEffect(() => {
    if (!isLoadingImage) {
      setLoadingMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % IMAGE_LOADING_MESSAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isLoadingImage]);

  // Strip checkmark from validation if present (we'll add our own icon)
  const cleanValidation = validation.replace(/^[✓✔]\s*/, '');
  const caption = generateCaption(dinnerName, validation);

  // Sanitize SVG to prevent XSS attacks
  const sanitizedSvg = useMemo(() => {
    if (!svgFallback) return null;
    return DOMPurify.sanitize(svgFallback, {
      USE_PROFILES: { svg: true, svgFilters: true },
    });
  }, [svgFallback]);

  // Copy caption to clipboard
  const handleCopyCaption = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback('Failed to copy');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  }, [caption]);

  // Save image to device
  const handleSaveImage = useCallback(async () => {
    if (!imageUrl) {
      setCopyFeedback('No image to save');
      setTimeout(() => setCopyFeedback(null), 2000);
      return;
    }

    try {
      // For data URLs, create a blob and download
      if (imageUrl.startsWith('data:')) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `charcuterme-${dinnerName.toLowerCase().replace(/\s+/g, '-')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // For remote URLs, open in new tab (can't force download cross-origin)
        window.open(imageUrl, '_blank');
      }
      setCopyFeedback('Saved!');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback('Failed to save');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  }, [imageUrl, dinnerName]);

  // Share to Instagram Stories (with smart fallbacks)
  const handleShareToStories = useCallback(async () => {
    setIsGeneratingCard(true);

    try {
      // Check if native share is available AND supports files
      const canShareFiles = typeof navigator.share === 'function' && typeof navigator.canShare === 'function';

      if (canShareFiles && imageUrl) {
        // Try to share with image
        try {
          let blob: Blob;
          if (imageUrl.startsWith('data:')) {
            const response = await fetch(imageUrl);
            blob = await response.blob();
          } else {
            const response = await fetch(imageUrl);
            blob = await response.blob();
          }
          const file = new File([blob], 'charcuterme-story.png', { type: 'image/png' });

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `${dinnerName} - CharcuterME`,
              text: caption,
              files: [file],
            });
            setCopyFeedback('Shared!');
            setTimeout(() => setCopyFeedback(null), 2000);
            return;
          }
        } catch {
          // File sharing failed, fall through to alternatives
        }
      }

      // Try text-only share if available
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${dinnerName} - CharcuterME`,
            text: caption,
          });
          setCopyFeedback('Caption shared! Save the image separately.');
          setTimeout(() => setCopyFeedback(null), 3000);
          return;
        } catch (e) {
          if (e instanceof Error && e.name === 'AbortError') {
            return; // User cancelled, no message needed
          }
        }
      }

      // Final fallback: copy caption + prompt to save image
      await navigator.clipboard.writeText(caption);
      if (imageUrl) {
        setCopyFeedback('Caption copied! Tap "Save Image" to get the image.');
      } else {
        setCopyFeedback('Caption copied to clipboard!');
      }
      setTimeout(() => setCopyFeedback(null), 3000);

    } catch {
      // Something went wrong
      setCopyFeedback('Couldn\'t share. Try Copy + Save instead.');
      setTimeout(() => setCopyFeedback(null), 3000);
    } finally {
      setIsGeneratingCard(false);
    }
  }, [dinnerName, caption, imageUrl]);

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex flex-col items-center px-6 py-8">

      {/* Tonight's Dinner Label */}
      <p className="text-[#736B63] text-sm mb-2 mt-4">
        Tonight&apos;s Dinner:
      </p>

      {/* Hero Moment - The Name */}
      <h1 className="font-serif text-3xl md:text-4xl italic text-[#A47864] text-center mb-4 px-4">
        &ldquo;{dinnerName}&rdquo;
      </h1>

      {/* Validation */}
      <div className="flex items-start gap-2 mb-6 px-4 max-w-[340px]">
        <div className="mt-0.5 flex-shrink-0">
          <CheckIcon />
        </div>
        <p className="text-[#6B5B4F] text-base">
          {cleanValidation}
        </p>
      </div>

      {/* Image / Blueprint */}
      <div className="w-full max-w-[340px] mb-4">
        <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg bg-white">
          {isLoadingImage ? (
            /* Loading State - Enhanced */
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FAF9F7] p-6">
              {/* Spinner */}
              <div className="w-16 h-16 border-4 border-[#E8B4A0] border-t-[#E8734A] rounded-full animate-spin mb-6" />

              {/* Rotating message */}
              <p className="text-[#A47864] text-base font-medium text-center mb-4 min-h-[24px] transition-opacity duration-300">
                {IMAGE_LOADING_MESSAGES[loadingMessageIndex]}
              </p>

              {/* Progress bar (indeterminate) */}
              <div className="w-48 h-1.5 bg-[#E8B4A0] rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-[#E8734A] rounded-full animate-progress-indeterminate" />
              </div>

              {/* Hint */}
              <p className="text-[#736B63] text-xs mt-4 text-center">
                This usually takes 20-30 seconds
              </p>
            </div>
          ) : imageUrl ? (
            /* Generated Image - use img for data URLs, Next Image for remote URLs */
            imageUrl.startsWith('data:') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={dinnerName}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <Image
                src={imageUrl}
                alt={dinnerName}
                fill
                className="object-cover"
                sizes="340px"
              />
            )
          ) : sanitizedSvg ? (
            /* SVG Fallback from API (sanitized for XSS protection) */
            <div className="relative w-full h-full">
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
              />
              {/* Retry Button - shown when image generation failed */}
              {imageError && onRetryImage && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <button
                    onClick={onRetryImage}
                    className="
                      flex items-center gap-2 px-4 py-2
                      bg-white/90 backdrop-blur-sm rounded-full
                      text-[#A47864] text-sm font-medium
                      shadow-lg hover:bg-white
                      transition-all duration-200
                      hover:-translate-y-0.5 active:translate-y-0
                      focus:outline-none focus:ring-2 focus:ring-[#E8734A] focus:ring-offset-2
                    "
                  >
                    <SparklesIcon />
                    <span>Generate Image</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Placeholder */
            <div className="absolute inset-0 flex items-center justify-center bg-[#FAF9F7]">
              <p className="text-[#736B63] text-sm">Your spread awaits...</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions - Copy Caption & Save Image */}
      {!isLoadingImage && (
        <div className="w-full max-w-[340px] mb-6">
          <div className="flex gap-3">
            <button
              onClick={handleCopyCaption}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-[#E8B4A0] text-[#A47864] hover:bg-[#FDF8F6] transition-colors text-sm font-medium"
            >
              <CopyIcon />
              <span>Copy Caption</span>
            </button>
            <button
              onClick={handleSaveImage}
              disabled={!imageUrl}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-[#E8B4A0] text-[#A47864] hover:bg-[#FDF8F6] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DownloadIcon />
              <span>Save Image</span>
            </button>
          </div>
          {/* Feedback toast */}
          {copyFeedback && (
            <p className="text-center text-sm text-[#E8734A] mt-2 animate-fade-in">
              {copyFeedback}
            </p>
          )}
        </div>
      )}

      {/* Tip */}
      <div className="w-full max-w-[340px] mb-4">
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

      {/* Wildcard */}
      {wildcard && (
        <div className="w-full max-w-[340px] mb-6">
          <div className="bg-[#F5E6E0] rounded-xl px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <DiceIcon />
              </div>
              <div>
                <p className="text-[#A47864] text-xs font-medium uppercase tracking-wide mb-1">
                  Wild card
                </p>
                <p className="text-[#6B5B4F] text-sm">
                  {wildcard}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Caption Preview */}
      {!isLoadingImage && (
        <div className="w-full max-w-[340px] mb-4">
          <p className="text-[#736B63] text-xs text-center mb-2">Your share caption:</p>
          <div className="bg-white/50 rounded-lg px-3 py-2 border border-[#E8B4A0]/30">
            <p className="text-[#6B5B4F] text-xs leading-relaxed whitespace-pre-line">
              {caption}
            </p>
          </div>
        </div>
      )}

      {/* Primary CTA - Share to Stories */}
      <button
        onClick={handleShareToStories}
        disabled={isGeneratingCard || isLoadingImage}
        aria-label="Share to Instagram Stories"
        className="
          w-full max-w-[340px] rounded-xl py-4 px-8
          text-base font-semibold text-white
          bg-gradient-to-r from-[#E8734A] to-[#C13584]
          hover:from-[#D4623B] hover:to-[#A02B70]
          transition-all duration-200 ease-out
          hover:-translate-y-0.5 active:translate-y-0
          shadow-lg shadow-[#E8734A]/30
          flex items-center justify-center gap-2
          focus:outline-none focus:ring-2 focus:ring-[#E8734A] focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
        "
      >
        <InstagramIcon />
        <span>{isGeneratingCard ? 'Preparing...' : 'Share to Stories'}</span>
      </button>

      {/* Secondary CTA - Check the Vibe */}
      <button
        onClick={onCheckVibe}
        aria-label="Upload a photo to get a vibe score"
        className="
          mt-3 w-full max-w-[340px] rounded-xl py-3 px-8
          text-sm font-medium text-[#A47864]
          bg-white border border-[#E8B4A0]
          hover:bg-[#FDF8F6] hover:border-[#E8734A]
          transition-all duration-200
          flex items-center justify-center gap-2
          focus:outline-none focus:ring-2 focus:ring-[#E8734A] focus:ring-offset-2
        "
      >
        <CameraIcon />
        <span>Upload photo for vibe score</span>
      </button>

      {/* Tertiary Link - Skip for now */}
      {onJustEat && (
        <button
          onClick={onJustEat}
          aria-label="Skip for now and start over"
          className="mt-4 text-[#736B63] text-sm hover:text-[#A47864] transition-colors focus:outline-none focus:underline"
        >
          Skip for now
        </button>
      )}

      {/* Progress Dots */}
      <div className="flex gap-2 mt-8">
        <div className="w-2 h-2 rounded-full bg-[#E8734A]" />
        <div className="w-2 h-2 rounded-full bg-[#E8734A]" />
        <div className="w-2 h-2 rounded-full bg-[#E8B4A0]" />
      </div>
    </div>
  );
}

export default ResultsScreen;
