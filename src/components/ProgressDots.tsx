'use client';

import { motion } from 'framer-motion';

/**
 * Progress Dots Component
 *
 * Visual progress indicator showing current step in a multi-step flow.
 * Supports animation on the active dot.
 */

interface ProgressDotsProps {
  /** Current step (1-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps?: number;
  /** Whether to animate the current dot */
  animate?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function ProgressDots({
  currentStep,
  totalSteps = 3,
  animate = false,
  className = '',
}: ProgressDotsProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNumber = i + 1;
        const isActive = stepNumber <= currentStep;
        const isCurrent = stepNumber === currentStep;

        if (animate && isCurrent) {
          return (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-[#E8734A]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            />
          );
        }

        return (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              isActive ? 'bg-[#E8734A]' : 'bg-[#E8B4A0]'
            }`}
          />
        );
      })}
    </div>
  );
}

export default ProgressDots;
