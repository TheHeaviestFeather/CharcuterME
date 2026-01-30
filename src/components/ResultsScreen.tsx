'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import {
  CheckIcon,
  LightbulbIcon,
  DiceIcon,
  CameraIcon,
  SparklesIcon,
  CopyIcon,
  DownloadIcon,
  InstagramIcon,
  LoaderIcon,
} from './icons';
import { ProgressDots } from './ProgressDots';
import { shareWithImage, copyToClipboard, saveImage, generateCaption } from '@/utils';

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
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

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
  const caption = generateCaption({ dinnerName, validation });

  // Show feedback with auto-dismiss
  const showFeedback = useCallback((message: string, duration = 2000) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), duration);
  }, []);

  // Copy caption to clipboard
  const handleCopyCaption = useCallback(async () => {
    const result = await copyToClipboard(caption);
    showFeedback(result.message || (result.success ? 'Copied!' : 'Failed to copy'));
  }, [caption, showFeedback]);

  // Save image to device
  const handleSaveImage = useCallback(async () => {
    if (!imageUrl) {
      showFeedback('No image to save');
      return;
    }
    const fileName = `charcuterme-${dinnerName.toLowerCase().replace(/\s+/g, '-')}.png`;
    const result = await saveImage(imageUrl, fileName);
    showFeedback(result.message || (result.success ? 'Saved!' : 'Failed to save'));
  }, [imageUrl, dinnerName, showFeedback]);

  // Share to Instagram Stories
  const handleShareToStories = useCallback(async () => {
    setIsSharing(true);
    try {
      const result = await shareWithImage({
        title: `${dinnerName} - CharcuterME`,
        caption,
        imageUrl,
        fileName: 'charcuterme-story.png',
      });
      if (result.message && result.method === 'clipboard') {
        showFeedback(result.message, 3000);
      }
    } finally {
      setIsSharing(false);
    }
  }, [dinnerName, caption, imageUrl, showFeedback]);

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex flex-col items-center px-6 py-8">

      {/* Tonight's Dinner Label */}
      <p className="text-[#9A8A7C] text-sm mb-2 mt-4">
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
              <p className="text-[#9A8A7C] text-xs mt-4 text-center">
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
          ) : svgFallback ? (
            /* SVG Fallback from API */
            <div className="relative w-full h-full">
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: svgFallback }}
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
              <p className="text-[#9A8A7C] text-sm">Your spread awaits...</p>
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
          {feedback && (
            <p className="text-center text-sm text-[#E8734A] mt-2 animate-fade-in">
              {feedback}
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

      {/* Primary CTA - Share to Stories */}
      <button
        onClick={handleShareToStories}
        disabled={isSharing || isLoadingImage}
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
        {isSharing ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <InstagramIcon />}
        <span>{isSharing ? 'Sharing...' : 'Share to Stories'}</span>
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
          className="mt-4 text-[#9A8A7C] text-sm hover:text-[#A47864] transition-colors focus:outline-none focus:underline"
        >
          Skip for now
        </button>
      )}

      {/* Progress Dots */}
      <ProgressDots currentStep={2} className="mt-8" />
    </div>
  );
}

export default ResultsScreen;
