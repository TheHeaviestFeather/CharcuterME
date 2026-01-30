'use client';

import { motion } from 'framer-motion';

// =============================================================================
// Base Skeleton Component
// =============================================================================

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({
  className = '',
  width,
  height,
  rounded = 'md',
}: SkeletonProps) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <motion.div
      className={`bg-[#E8B4A0]/30 ${roundedClasses[rounded]} ${className}`}
      style={{ width, height }}
      animate={{
        opacity: [0.4, 0.7, 0.4],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// =============================================================================
// Text Skeleton
// =============================================================================

interface TextSkeletonProps {
  lines?: number;
  lastLineWidth?: string;
  className?: string;
}

export function TextSkeleton({
  lines = 3,
  lastLineWidth = '60%',
  className = '',
}: TextSkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="1rem"
          width={i === lines - 1 ? lastLineWidth : '100%'}
          rounded="sm"
        />
      ))}
    </div>
  );
}

// =============================================================================
// Image Skeleton with Progress
// =============================================================================

interface ImageSkeletonProps {
  className?: string;
  showProgress?: boolean;
  progress?: number; // 0-100
}

export function ImageSkeleton({
  className = '',
  showProgress = false,
  progress = 0,
}: ImageSkeletonProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Base shimmer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[#FAF9F7] via-[#E8B4A0]/20 to-[#FAF9F7]"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Progress overlay */}
      {showProgress && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-[#E8734A]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      )}
    </div>
  );
}

// =============================================================================
// Card Skeleton
// =============================================================================

interface CardSkeletonProps {
  className?: string;
  showImage?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
}

export function CardSkeleton({
  className = '',
  showImage = true,
  showTitle = true,
  showDescription = true,
}: CardSkeletonProps) {
  return (
    <motion.div
      className={`bg-white rounded-xl shadow-md p-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {showImage && (
        <Skeleton
          className="w-full aspect-square mb-4"
          rounded="lg"
        />
      )}
      {showTitle && (
        <Skeleton
          className="mb-2"
          height="1.5rem"
          width="70%"
          rounded="sm"
        />
      )}
      {showDescription && (
        <TextSkeleton lines={2} />
      )}
    </motion.div>
  );
}

// =============================================================================
// Results Screen Skeleton
// =============================================================================

export function ResultsSkeleton() {
  return (
    <motion.div
      className="min-h-screen bg-[#FAF9F7] flex flex-col items-center px-6 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Tonight's Dinner Label */}
      <Skeleton className="mt-4 mb-2" width={120} height={16} rounded="sm" />

      {/* Hero Name */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Skeleton className="mb-4" width={280} height={40} rounded="lg" />
      </motion.div>

      {/* Validation */}
      <motion.div
        className="flex items-start gap-2 mb-6 px-4 max-w-[340px] w-full"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Skeleton width={20} height={20} rounded="full" />
        <TextSkeleton lines={2} lastLineWidth="80%" />
      </motion.div>

      {/* Image Placeholder */}
      <motion.div
        className="w-full max-w-[340px] mb-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-lg">
          <ImageSkeleton className="absolute inset-0" />

          {/* Floating loading indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-12 h-12 border-3 border-[#E8B4A0] border-t-[#E8734A] rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </div>
      </motion.div>

      {/* Tip Card */}
      <motion.div
        className="w-full max-w-[340px] mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <div className="bg-white rounded-xl px-4 py-3 shadow-sm">
          <div className="flex items-start gap-3">
            <Skeleton width={20} height={20} rounded="full" />
            <TextSkeleton lines={2} className="flex-1" />
          </div>
        </div>
      </motion.div>

      {/* Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <Skeleton className="w-[340px]" height={56} rounded="lg" />
      </motion.div>

      {/* Progress Dots */}
      <motion.div
        className="flex gap-2 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Skeleton width={8} height={8} rounded="full" />
        <Skeleton width={8} height={8} rounded="full" />
        <Skeleton width={8} height={8} rounded="full" />
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// Progressive Content Reveal
// =============================================================================

interface ProgressiveRevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function ProgressiveReveal({
  children,
  delay = 0,
  className = '',
}: ProgressiveRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.4,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
}

export default Skeleton;
