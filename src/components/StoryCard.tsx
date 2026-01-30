'use client';

import { forwardRef } from 'react';
import Image from 'next/image';

// =============================================================================
// Story Card Component (9:16 aspect ratio for Instagram Stories)
// =============================================================================

interface StoryCardProps {
  dinnerName: string;
  imageUrl?: string | null;
  vibeScore?: string;
  vibeCategory?: string;
  className?: string;
}

export const StoryCard = forwardRef<HTMLDivElement, StoryCardProps>(
  function StoryCard({ dinnerName, imageUrl, vibeScore, vibeCategory, className = '' }, ref) {
    return (
      <div
        ref={ref}
        className={`relative bg-[#FAF9F7] overflow-hidden ${className}`}
        style={{ aspectRatio: '9/16', width: '100%', maxWidth: '360px' }}
      >
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FAF9F7]/90 z-10" />

        {/* Main image - takes up most of the card */}
        <div className="absolute inset-0">
          {imageUrl ? (
            imageUrl.startsWith('data:') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={dinnerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Image
                src={imageUrl}
                alt={dinnerName}
                fill
                className="object-cover"
              />
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#E8B4A0] to-[#F5E6E0]" />
          )}
        </div>

        {/* Content overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-[#FAF9F7] via-[#FAF9F7]/95 to-transparent pt-24">
          {/* Brand mark */}
          <p className="text-[#E8734A] text-xs font-semibold uppercase tracking-wider mb-2">
            CharcuterME
          </p>

          {/* Dinner name */}
          <h2 className="font-serif text-2xl italic text-[#A47864] mb-3 leading-tight">
            &ldquo;{dinnerName}&rdquo;
          </h2>

          {/* Vibe score (if available) */}
          {vibeScore && (
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl font-bold text-[#E8734A]">
                {vibeScore}
              </span>
              {vibeCategory && (
                <span className="text-sm font-medium text-[#A47864] uppercase tracking-wide">
                  {vibeCategory}
                </span>
              )}
            </div>
          )}

          {/* Decorative line */}
          <div className="w-12 h-0.5 bg-[#E8734A] mt-3" />
        </div>

        {/* Top branding watermark */}
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5">
            <p className="text-[#E8734A] text-xs font-semibold">
              CharcuterME
            </p>
          </div>
        </div>
      </div>
    );
  }
);

export default StoryCard;
