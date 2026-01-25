'use client';

import Image from 'next/image';

// =============================================================================
// Icons (SVG replacements for emojis)
// =============================================================================

const CheckIcon = () => (
  <svg className="w-5 h-5 text-[#E8734A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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

const CameraIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// =============================================================================
// Results Screen - Name Reveal + Blueprint (No Emojis)
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
  isLoadingImage?: boolean;
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
  isLoadingImage = false,
}: ResultsScreenProps) {

  // Strip checkmark from validation if present (we'll add our own icon)
  const cleanValidation = validation.replace(/^[✓✔]\s*/, '');

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
      <div className="w-full max-w-[340px] mb-6">
        <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg bg-white">
          {isLoadingImage ? (
            /* Loading State */
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FAF9F7]">
              <div className="w-12 h-12 border-3 border-[#E8B4A0] border-t-[#E8734A] rounded-full animate-spin mb-4" />
              <p className="text-[#9A8A7C] text-sm">Crafting your vision...</p>
            </div>
          ) : imageUrl ? (
            /* Generated Image */
            <Image
              src={imageUrl}
              alt={dinnerName}
              fill
              className="object-cover"
              sizes="340px"
            />
          ) : svgFallback ? (
            /* SVG Fallback */
            <div
              className="w-full h-full"
              dangerouslySetInnerHTML={{ __html: svgFallback }}
            />
          ) : (
            /* Placeholder */
            <div className="absolute inset-0 flex items-center justify-center bg-[#FAF9F7]">
              <p className="text-[#9A8A7C] text-sm">Your spread awaits...</p>
            </div>
          )}
        </div>
      </div>

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

      {/* Check the Vibe Button */}
      <button
        onClick={onCheckVibe}
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
        <CameraIcon />
        <span>Check the Vibe</span>
      </button>

      {/* Escape Hatch */}
      {onJustEat && (
        <button
          onClick={onJustEat}
          className="mt-4 text-[#9A8A7C] text-sm hover:text-[#A47864] transition-colors"
        >
          Just Eat
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
