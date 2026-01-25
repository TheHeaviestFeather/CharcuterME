'use client';

import { motion } from 'framer-motion';
import { Check, Camera, RefreshCw, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface RevealScreenProps {
  dinnerName: string;
  validation: string;
  tip: string;
  blueprintUrl: string | null;
  blueprintSvg: string | null;
  onPlatedIt: () => void;
  onStartOver: () => void;
  isLoadingName: boolean;
  isLoadingBlueprint: boolean;
}

export default function RevealScreen({
  dinnerName,
  validation,
  tip,
  blueprintUrl,
  blueprintSvg,
  onPlatedIt,
  onStartOver,
  isLoadingName,
  isLoadingBlueprint,
}: RevealScreenProps) {
  const hasBlueprint = blueprintUrl || blueprintSvg;
  const isLoading = isLoadingName || isLoadingBlueprint;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center min-h-screen px-6 py-8"
    >
      {/* Name Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        {isLoadingName ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-mocha animate-spin mb-2" />
            <p className="text-gray-500">Naming your dinner...</p>
          </div>
        ) : (
          <>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg text-gray-600 mb-2"
            >
              Tonight's Dinner:
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="text-3xl md:text-4xl font-bold text-mocha mb-4"
            >
              "{dinnerName}"
            </motion.h1>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.2 }}
              className="w-20 h-1 bg-coral rounded-full mx-auto mb-4"
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2 text-gray-700 mb-2"
            >
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>{validation}</span>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Blueprint Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md mb-6"
      >
        <div className="aspect-square bg-cream rounded-2xl overflow-hidden shadow-lg relative">
          {isLoadingBlueprint ? (
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
              priority
            />
          ) : blueprintSvg ? (
            <div
              className="absolute inset-0 flex items-center justify-center p-4"
              dangerouslySetInnerHTML={{ __html: blueprintSvg }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
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
                Blueprint loading...
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Pro Tip */}
      {tip && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-lavender/10 rounded-xl p-4 mb-6 max-w-md w-full"
        >
          <p className="text-gray-700 text-center">
            <span className="mr-2">&#128161;</span>
            {tip}
          </p>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPlatedIt}
          disabled={isLoading}
          className="w-full py-4 px-6 bg-coral text-white text-lg font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-coral/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera className="w-5 h-5" />
          {hasBlueprint ? "I Plated It!" : "Skip to Camera"}
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

      {/* Subtle encouragement */}
      {!isLoading && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-sm text-gray-400 text-center"
        >
          You're already winning. The blueprint is just extra credit.
        </motion.p>
      )}
    </motion.div>
  );
}
