'use client';

import { useLoadingTheater } from '@/hooks/useLoadingTheater';

// =============================================================================
// Types
// =============================================================================

interface LoadingScreenProps {
  isLoading: boolean;
}

interface FloatingEmojiProps {
  emoji: string;
  delay: number;
  left: number;
  duration: number;
}

// =============================================================================
// Floating Emoji Component
// =============================================================================

function FloatingEmoji({ emoji, delay, left, duration }: FloatingEmojiProps) {
  return (
    <div
      className="absolute text-2xl animate-float opacity-0"
      style={{
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    >
      {emoji}
    </div>
  );
}

// =============================================================================
// Loading Screen Component
// =============================================================================

export function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const { message, progress } = useLoadingTheater({ isLoading });

  if (!isLoading) return null;

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex flex-col items-center justify-center px-6 py-8 relative overflow-hidden">
      {/* Floating Emojis Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingEmoji emoji="🧀" delay={0} left={15} duration={7} />
        <FloatingEmoji emoji="🍇" delay={1.5} left={75} duration={8} />
        <FloatingEmoji emoji="🥖" delay={3} left={35} duration={6} />
        <FloatingEmoji emoji="🫒" delay={4.5} left={55} duration={9} />
        <FloatingEmoji emoji="🍷" delay={6} left={25} duration={7} />
        <FloatingEmoji emoji="🥨" delay={7.5} left={85} duration={8} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Spinner */}
        <div className="mb-8 flex justify-center">
          <div className="w-16 h-16 border-4 border-[#E8B4A0] border-t-[#E8734A] rounded-full animate-spin" />
        </div>

        {/* Message */}
        <p className="text-xl text-[#A47864] font-serif italic animate-pulse-subtle min-h-[2rem]">
          {message}
        </p>

        {/* Progress bar */}
        <div className="mt-6 w-64 mx-auto">
          <div className="h-1 bg-[#E8B4A0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E8734A] transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Priming line */}
        <p className="mt-8 text-sm text-[#9A8A7C] animate-fade-in">
          creating a story-ready share card + caption...
        </p>
      </div>

      {/* Progress Dots */}
      <div className="absolute bottom-8 flex gap-2">
        <div className="w-2 h-2 rounded-full bg-[#E8B4A0]" />
        <div className="w-2 h-2 rounded-full bg-[#E8734A]" />
        <div className="w-2 h-2 rounded-full bg-[#E8B4A0]" />
      </div>
    </div>
  );
}

export default LoadingScreen;
