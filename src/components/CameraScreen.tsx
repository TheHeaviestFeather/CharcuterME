'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Camera, Upload, Sparkles, X, ArrowLeft } from 'lucide-react';
import { useRef, useState } from 'react';
import Image from 'next/image';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface CameraScreenProps {
  onPhotoCapture: (photo: string) => void;
  onCheckVibe: () => void;
  userPhoto: string | null;
  isLoading: boolean;
  onBack?: () => void;
}

export default function CameraScreen({
  onPhotoCapture,
  onCheckVibe,
  userPhoto,
  isLoading,
  onBack,
}: CameraScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Animation variants that respect reduced motion
  const fadeIn = shouldReduceMotion
    ? { opacity: 1 }
    : { opacity: 0 };
  const fadeInAnimate = { opacity: 1 };

  const slideUp = shouldReduceMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: 20 };
  const slideUpAnimate = { opacity: 1, y: 0 };

  const handleFileSelect = (file: File) => {
    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('Image is too large (max 10MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onPhotoCapture(result);
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const clearPhoto = () => {
    setError(null);
    onPhotoCapture('');
  };

  return (
    <motion.div
      initial={fadeIn}
      animate={fadeInAnimate}
      exit={fadeIn}
      className="flex flex-col items-center min-h-[80vh] px-6 py-8"
    >
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Go back to results"
          className="absolute top-4 left-4 p-2 text-[#A47864] hover:bg-[#A47864]/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}

      {/* Header */}
      <motion.h1
        initial={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-mocha text-center mb-2"
      >
        Show us your spread!
      </motion.h1>

      <motion.div
        initial={shouldReduceMotion ? {} : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.1 }}
        className="w-16 h-0.5 bg-coral rounded-full mb-6"
      />

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="mb-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm"
        >
          {error}
        </div>
      )}

      {/* Photo Area */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md aspect-square mb-6 relative"
      >
        {userPhoto ? (
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg">
            <Image
              src={userPhoto}
              alt="Your plated dinner ready for vibe check"
              fill
              className="object-cover"
            />
            <button
              onClick={clearPhoto}
              aria-label="Remove photo"
              className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Upload photo of your plated dinner"
            className={`w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 ${
              dragActive
                ? 'border-coral bg-coral/10'
                : 'border-gray-300 hover:border-mocha hover:bg-mocha/5'
            }`}
          >
            <Camera className="w-16 h-16 text-gray-400 mb-4" aria-hidden="true" />
            <p className="text-gray-600 text-lg font-medium mb-2">
              Tap to upload photo
            </p>
            <p className="text-gray-400 text-sm">or drag and drop</p>
            <p className="text-gray-400 text-xs mt-2">Max size: 10MB</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleInputChange}
          className="hidden"
          aria-label="Upload photo file"
        />
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={slideUp}
        animate={slideUpAnimate}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        {userPhoto ? (
          <motion.button
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            onClick={onCheckVibe}
            disabled={isLoading}
            className="w-full py-4 px-6 bg-coral text-white text-lg font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-coral/90 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={shouldReduceMotion ? {} : { rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-5 h-5" aria-hidden="true" />
                </motion.div>
                Checking vibe...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" aria-hidden="true" />
                Check My Vibe
              </>
            )}
          </motion.button>
        ) : (
          <motion.button
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 px-6 bg-mocha text-white text-lg font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-mocha/90 transition-colors focus:outline-none focus:ring-2 focus:ring-mocha focus:ring-offset-2"
          >
            <Upload className="w-5 h-5" aria-hidden="true" />
            Upload Photo
          </motion.button>
        )}
      </motion.div>

      {/* Note */}
      <motion.p
        initial={shouldReduceMotion ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-sm text-gray-400 text-center max-w-xs"
      >
        Take a photo of your plated spread and we&apos;ll give you a vibe score!
      </motion.p>
    </motion.div>
  );
}
