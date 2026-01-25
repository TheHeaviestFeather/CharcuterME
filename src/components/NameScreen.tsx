'use client';

import { motion } from 'framer-motion';
import { Check, Palette, Utensils } from 'lucide-react';

interface NameScreenProps {
  dinnerName: string;
  validation: string;
  tip: string;
  onSeeBlueprint: () => void;
  onJustEat: () => void;
  isLoading: boolean;
}

export default function NameScreen({
  dinnerName,
  validation,
  tip,
  onSeeBlueprint,
  onJustEat,
  isLoading,
}: NameScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center justify-center min-h-[80vh] px-6"
    >
      {/* Header */}
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg text-gray-600 mb-2"
      >
        Tonight&apos;s Dinner:
      </motion.p>

      {/* The Name - THE AHA MOMENT */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-4xl md:text-5xl font-bold text-mocha text-center mb-6"
      >
        "&ldquo;{dinnerName}&rdquo;"
      </motion.h1>

      {/* Divider */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.2 }}
        className="w-24 h-1 bg-coral rounded-full mb-6"
      />

      {/* Validation Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-start gap-2 text-lg text-gray-700 mb-4"
      >
        <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
        <span>{validation}</span>
      </motion.div>

      {/* Tip */}
      {tip && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-lavender/10 rounded-xl p-4 mb-8 max-w-md"
        >
          <p className="text-gray-700">
            <span className="mr-2">💡</span>
            {tip}
          </p>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSeeBlueprint}
          disabled={isLoading}
          className="w-full py-4 px-6 bg-mocha text-white text-lg font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-mocha/90 transition-colors disabled:opacity-50"
        >
          <Palette className="w-5 h-5" />
          See the Blueprint
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onJustEat}
          className="w-full py-3 px-6 text-gray-600 text-lg font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
        >
          <Utensils className="w-5 h-5" />
          Just Eat
        </motion.button>
      </motion.div>

      {/* Subtle note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-8 text-sm text-gray-400 text-center"
      >
        You&apos;re already winning. The blueprint is just extra credit.
      </motion.p>
    </motion.div>
  );
}
