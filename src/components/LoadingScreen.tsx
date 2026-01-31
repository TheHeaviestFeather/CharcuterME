'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
// Floating Emoji Component (with framer-motion)
// =============================================================================

function FloatingEmoji({ emoji, delay, left, duration }: FloatingEmojiProps) {
  return (
    <motion.div
      className="absolute text-2xl"
      style={{ left: `${left}%` }}
      initial={{ y: '100vh', opacity: 0, rotate: 0 }}
      animate={{
        y: '-20px',
        opacity: [0, 0.3, 0.3, 0],
        rotate: 360,
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {emoji}
    </motion.div>
  );
}

// =============================================================================
// Loading Screen Component
// =============================================================================

export function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const { message, progress } = useLoadingTheater({ isLoading });

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="min-h-screen bg-[#FAF9F7] flex flex-col items-center justify-center px-6 py-8 relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
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
          <motion.div
            className="relative z-10 text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            {/* Spinner */}
            <div className="mb-8 flex justify-center">
              <motion.div
                className="w-16 h-16 border-4 border-[#E8B4A0] border-t-[#E8734A] rounded-full"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </div>

            {/* Message with crossfade */}
            <AnimatePresence mode="wait">
              <motion.p
                key={message}
                className="text-xl text-[#A47864] font-serif italic min-h-[2rem]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {message}
              </motion.p>
            </AnimatePresence>

            {/* Progress bar */}
            <div className="mt-6 w-64 mx-auto">
              <div className="h-1.5 bg-[#E8B4A0] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#E8734A] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Subtle hint */}
            <motion.p
              className="mt-8 text-sm text-[#736B63]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Crafting your culinary masterpiece...
            </motion.p>
          </motion.div>

          {/* Progress Dots */}
          <motion.div
            className="absolute bottom-8 flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-[#E8B4A0]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-[#E8734A]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-[#E8B4A0]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LoadingScreen;
