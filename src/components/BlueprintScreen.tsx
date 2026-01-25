'use client';

import { motion } from 'framer-motion';
import { Camera, RefreshCw, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface BlueprintScreenProps {
  dinnerName: string;
  blueprintUrl: string | null;
  tip: string;
  onPlatedIt: () => void;
  onStartOver: () => void;
  isLoading: boolean;
}

export default function BlueprintScreen({
  dinnerName,
  blueprintUrl,
  tip,
  onPlatedIt,
  onStartOver,
  isLoading,
}: BlueprintScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center min-h-[80vh] px-6 py-8"
    >
      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-mocha text-center mb-2"
      >
        "&ldquo;{dinnerName}&rdquo;"
      </motion.h1>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.1 }}
        className="w-16 h-0.5 bg-coral rounded-full mb-6"
      />

      {/* Blueprint Image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md aspect-square bg-cream rounded-2xl overflow-hidden shadow-lg mb-6 relative"
      >
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream">
            <Loader2 className="w-12 h-12 text-mocha animate-spin mb-4" />
            <p className="text-gray-600">Creating your blueprint...</p>
            <p className="text-sm text-gray-400 mt-1">This takes about 10 seconds</p>
          </div>
        ) : blueprintUrl ? (
          <Image
            src={blueprintUrl}
            alt="Your dinner blueprint"
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            {/* Fallback ASCII-style placeholder */}
            <div className="font-mono text-xs text-gray-400 whitespace-pre leading-tight">
{`   +-------------------+
   |                   |
   |    +---+   o o    |
   |    | B |          |
   |    +---+   ===    |
   |        ===   o    |
   |   ===             |
   |                   |
   +-------------------+`}
            </div>
            <p className="text-gray-500 mt-4 text-center">
              Blueprint not available
            </p>
          </div>
        )}
      </motion.div>

      {/* Pro Tip */}
      {tip && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-lavender/10 rounded-xl p-4 mb-6 max-w-md w-full"
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
          onClick={onPlatedIt}
          disabled={isLoading}
          className="w-full py-4 px-6 bg-coral text-white text-lg font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-coral/90 transition-colors disabled:opacity-50"
        >
          <Camera className="w-5 h-5" />
          I Plated It!
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartOver}
          disabled={isLoading}
          className="w-full py-3 px-6 text-gray-600 text-lg font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className="w-5 h-5" />
          Start Over
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
