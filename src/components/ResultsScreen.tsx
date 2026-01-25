'use client';

import { motion } from 'framer-motion';
import { Share2, Download, RefreshCw, Trophy } from 'lucide-react';
import Image from 'next/image';

interface ResultsScreenProps {
  dinnerName: string;
  userPhoto: string | null;
  vibeScore: number;
  vibeRank: string;
  vibeCompliment: string;
  sticker: string;
  onShare: () => void;
  onSave: () => void;
  onStartOver: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-yellow-500';
  if (score >= 75) return 'text-coral';
  if (score >= 60) return 'text-lavender';
  if (score >= 40) return 'text-mocha';
  return 'text-gray-500';
}

function getProgressColor(score: number): string {
  if (score >= 90) return 'bg-yellow-500';
  if (score >= 75) return 'bg-coral';
  if (score >= 60) return 'bg-lavender';
  if (score >= 40) return 'bg-mocha';
  return 'bg-gray-400';
}

export default function ResultsScreen({
  dinnerName,
  userPhoto,
  vibeScore,
  vibeRank,
  vibeCompliment,
  sticker,
  onShare,
  onSave,
  onStartOver,
}: ResultsScreenProps) {
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
        className="text-2xl font-bold text-mocha text-center mb-6"
      >
        "&ldquo;{dinnerName}&rdquo;"
      </motion.h1>

      {/* Vibe Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-medium text-gray-600">VIBE CHECK</span>
          <Trophy className={`w-6 h-6 ${getScoreColor(vibeScore)}`} />
        </div>

        {/* Score */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="text-center mb-4"
        >
          <span className={`text-6xl font-bold ${getScoreColor(vibeScore)}`}>
            {vibeScore}
          </span>
        </motion.div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${vibeScore}%` }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className={`h-full ${getProgressColor(vibeScore)} rounded-full`}
          />
        </div>

        {/* Rank */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-lg font-semibold text-gray-700"
        >
          "          &ldquo;{vibeRank}&rdquo;"
        </motion.p>
      </motion.div>

      {/* Compliment */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="bg-lavender/10 rounded-xl p-4 mb-6 max-w-md w-full"
      >
        <p className="text-gray-700 text-center italic">
          "          &ldquo;{vibeCompliment}&rdquo;"
        </p>
      </motion.div>

      {/* Photo with Sticker */}
      {userPhoto && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-lg mb-6 relative"
        >
          <Image
            src={userPhoto}
            alt="Your plated dinner"
            fill
            className="object-cover"
          />

          {/* Sticker Overlay */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: -12 }}
            transition={{ delay: 1, type: 'spring', stiffness: 200 }}
            className="absolute bottom-6 right-6 bg-coral text-white px-4 py-2 rounded-lg shadow-lg"
          >
            <span className="text-lg font-bold">{sticker}</span>
          </motion.div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onShare}
            className="flex-1 py-3 px-4 bg-coral text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-coral/90 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            Share
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSave}
            className="flex-1 py-3 px-4 bg-mocha text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-mocha/90 transition-colors"
          >
            <Download className="w-5 h-5" />
            Save
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartOver}
          className="w-full py-3 px-6 text-gray-600 font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Make Another
        </motion.button>
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="mt-8 text-sm text-gray-400 text-center italic"
      >
        Whatever you have is enough.
      </motion.p>
    </motion.div>
  );
}
