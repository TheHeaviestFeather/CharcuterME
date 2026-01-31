'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { analytics } from '@/lib/analytics';
import { addWatermark, createWatermarkedFile } from '@/lib/watermark';

// =============================================================================
// Icons - Clean SVG, no emoji
// =============================================================================

const CheckIcon = () => (
  <svg className="w-5 h-5 text-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ShareIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CameraIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

// =============================================================================
// Results Screen - Direction C: Share-First, Bold, Playful
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
  onRegenerateName?: () => void;
  isLoadingImage?: boolean;
  isLoadingName?: boolean;
  imageError?: boolean;
}

// Playful loading messages
const IMAGE_LOADING_MESSAGES = [
  "Arranging your spread...",
  "Adjusting the mood lighting...",
  "Making it look intentional...",
  "Adding main character energy...",
  "Almost Instagram-ready...",
];

// Generate caption text
function generateCaption(dinnerName: string, validation: string): string {
  const cleanValidation = validation.replace(/^[✓✔]\s*/, '');
  return `Tonight's dinner: "${dinnerName}"\n\n${cleanValidation}\n\n#CharcuterME #GirlDinner`;
}

export function ResultsScreen({
  dinnerName,
  validation,
  tip: _tip,
  wildcard: _wildcard,
  imageUrl,
  svgFallback,
  onCheckVibe,
  onJustEat,
  onRetryImage,
  onRegenerateName,
  isLoadingImage = false,
  isLoadingName = false,
  imageError = false,
}: ResultsScreenProps) {
  // Note: tip and wildcard are available but not displayed in Direction C
  // to keep the share-first UI clean. They're passed through for future use.
  void _tip;
  void _wildcard;
  // State
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!isLoadingImage) {
      setLoadingMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % IMAGE_LOADING_MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [isLoadingImage]);

  // Clean validation text
  const cleanValidation = validation.replace(/^[✓✔]\s*/, '');
  const caption = generateCaption(dinnerName, validation);

  // Sanitize SVG fallback
  const sanitizedSvg = useMemo(() => {
    if (!svgFallback) return null;
    return DOMPurify.sanitize(svgFallback, {
      USE_PROFILES: { svg: true, svgFilters: true },
    });
  }, [svgFallback]);

  // Regenerate name handler
  const handleRegenerateName = useCallback(() => {
    if (onRegenerateName) {
      analytics.nameRegenerate();
      onRegenerateName();
    }
  }, [onRegenerateName]);

  // Copy caption to clipboard
  const handleCopyCaption = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(caption);
      analytics.captionCopy();
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback('Failed to copy');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  }, [caption]);

  // Save image with watermark
  const handleSaveImage = useCallback(async () => {
    if (!imageUrl) {
      setCopyFeedback('No image yet');
      setTimeout(() => setCopyFeedback(null), 2000);
      return;
    }

    try {
      const watermarkedUrl = await addWatermark(imageUrl);
      const response = await fetch(watermarkedUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `charcuterme-${dinnerName.toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      analytics.imageSave('watermarked');
      setCopyFeedback('Saved!');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback('Failed to save');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  }, [imageUrl, dinnerName]);

  // Primary share action
  const handleShare = useCallback(async () => {
    setIsSharing(true);
    analytics.shareClick('results', !!imageUrl);

    try {
      const canShareFiles = typeof navigator.share === 'function' && typeof navigator.canShare === 'function';

      if (canShareFiles && imageUrl) {
        try {
          const file = await createWatermarkedFile(imageUrl);
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `${dinnerName} - CharcuterME`,
              text: caption,
              files: [file],
            });
            analytics.shareComplete('results', 'native', true);
            setCopyFeedback('Shared!');
            setTimeout(() => setCopyFeedback(null), 2000);
            return;
          }
        } catch {
          // Fall through to alternatives
        }
      }

      if (navigator.share) {
        try {
          await navigator.share({
            title: `${dinnerName} - CharcuterME`,
            text: caption,
          });
          analytics.shareComplete('results', 'native', false);
          setCopyFeedback('Caption shared! Save the image too.');
          setTimeout(() => setCopyFeedback(null), 3000);
          return;
        } catch (e) {
          if (e instanceof Error && e.name === 'AbortError') {
            return;
          }
        }
      }

      // Fallback: copy caption
      await navigator.clipboard.writeText(caption);
      analytics.shareComplete('results', 'clipboard', false);
      setCopyFeedback('Caption copied! Save image to share.');
      setTimeout(() => setCopyFeedback(null), 3000);

    } catch {
      setCopyFeedback('Couldn\'t share. Try the buttons below.');
      setTimeout(() => setCopyFeedback(null), 3000);
    } finally {
      setIsSharing(false);
    }
  }, [dinnerName, caption, imageUrl]);

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center px-5 py-6">
      {/* Mini Label */}
      <p className="text-text-muted text-sm font-medium mb-2 mt-2">
        tonight&apos;s dinner:
      </p>

      {/* THE NAME - Big, Bold, Shareable */}
      <div className="flex items-center justify-center gap-3 mb-3 px-4">
        <h1
          className={`
            font-display text-4xl md:text-5xl italic text-coral text-center leading-tight
            ${isLoadingName ? 'animate-pulse' : ''}
          `}
        >
          &ldquo;{dinnerName}&rdquo;
        </h1>
        {onRegenerateName && !isLoadingName && (
          <button
            onClick={handleRegenerateName}
            aria-label="Generate a new name"
            className="p-2 rounded-full text-text-secondary hover:text-coral hover:bg-peach transition-all"
          >
            <RefreshIcon />
          </button>
        )}
        {isLoadingName && (
          <div className="w-5 h-5 border-2 border-peach border-t-coral rounded-full animate-spin" />
        )}
      </div>

      {/* Validation - The affirmation */}
      <div className="flex items-start gap-2 mb-5 px-4 max-w-[360px]">
        <div className="mt-0.5 flex-shrink-0">
          <CheckIcon />
        </div>
        <p className="text-text-primary text-base leading-relaxed">
          {cleanValidation}
        </p>
      </div>

      {/* The Image - The shareable hero */}
      <div className="w-full max-w-[360px] mb-5">
        <div className="relative aspect-square rounded-2xl overflow-hidden shadow-xl bg-white border-2 border-peach">
          {isLoadingImage ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream p-6">
              <div className="w-14 h-14 border-4 border-peach border-t-coral rounded-full animate-spin mb-5" />
              <p className="text-coral text-base font-medium text-center mb-2">
                {IMAGE_LOADING_MESSAGES[loadingMessageIndex]}
              </p>
              <div className="w-40 h-1.5 bg-peach rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-coral rounded-full animate-progress-indeterminate" />
              </div>
            </div>
          ) : imageUrl ? (
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
                sizes="360px"
              />
            )
          ) : sanitizedSvg ? (
            <div className="relative w-full h-full">
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
              />
              {imageError && onRetryImage && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <button
                    onClick={onRetryImage}
                    className="flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full text-coral text-sm font-semibold shadow-lg hover:scale-105 transition-all"
                  >
                    <SparklesIcon />
                    <span>Try Again</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-cream">
              <p className="text-text-muted text-sm">Your spread is loading...</p>
            </div>
          )}
        </div>
      </div>

      {/* Caption Preview - Show exactly what they'll share */}
      {!isLoadingImage && (
        <div className="w-full max-w-[360px] mb-5">
          <p className="text-text-muted text-xs text-center mb-2 font-medium uppercase tracking-wide">
            Your caption
          </p>
          <div className="bg-white rounded-xl px-4 py-3 border border-peach">
            <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-line">
              {caption}
            </p>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {copyFeedback && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-text-primary text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-fade-in z-50">
          {copyFeedback}
        </div>
      )}

      {/* PRIMARY CTA - Share */}
      <button
        onClick={handleShare}
        disabled={isSharing || isLoadingImage}
        className={`
          w-full max-w-[360px] rounded-2xl py-5 px-8
          text-lg font-bold text-white
          transition-all duration-200 ease-out
          shadow-lg flex items-center justify-center gap-3
          ${(isSharing || isLoadingImage)
            ? 'bg-[#E8B4A0] cursor-not-allowed'
            : 'bg-coral hover:bg-coral-dark hover:-translate-y-1 hover:shadow-xl shadow-coral/30 active:translate-y-0 active:scale-[0.98]'
          }
        `}
      >
        <ShareIcon />
        <span>{isSharing ? 'Sharing...' : 'Share This Masterpiece'}</span>
      </button>

      {/* Secondary Actions */}
      {!isLoadingImage && (
        <div className="flex gap-3 mt-4 w-full max-w-[360px]">
          <button
            onClick={handleCopyCaption}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border-2 border-peach text-text-secondary font-semibold hover:border-coral hover:text-coral transition-all"
          >
            <CopyIcon />
            <span>Copy</span>
          </button>
          <button
            onClick={handleSaveImage}
            disabled={!imageUrl}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border-2 border-peach text-text-secondary font-semibold hover:border-coral hover:text-coral transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DownloadIcon />
            <span>Save</span>
          </button>
        </div>
      )}

      {/* Tertiary: Vibe Check Upsell */}
      <button
        onClick={onCheckVibe}
        className="mt-6 flex items-center gap-2 text-text-secondary hover:text-coral transition-colors font-medium"
      >
        <CameraIcon />
        <span>Upload your real plate for a vibe score</span>
      </button>

      {/* Quaternary: Start Over */}
      {onJustEat && (
        <button
          onClick={onJustEat}
          className="mt-4 text-text-muted text-sm hover:text-text-secondary transition-colors underline underline-offset-2"
        >
          Start over
        </button>
      )}

      {/* Footer Links */}
      <div className="mt-8 pt-4 border-t border-peach/50 flex gap-4 text-xs text-text-muted">
        <a
          href="https://github.com/TheHeaviestFeather/CharcuterME/issues/new?template=content-report.md"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-coral transition-colors"
        >
          Report an issue
        </a>
        <a
          href="/terms"
          className="hover:text-coral transition-colors"
        >
          Terms
        </a>
        <a
          href="/privacy"
          className="hover:text-coral transition-colors"
        >
          Privacy
        </a>
      </div>
    </div>
  );
}

export default ResultsScreen;
