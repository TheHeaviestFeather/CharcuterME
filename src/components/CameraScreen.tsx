'use client';

import { motion } from 'framer-motion';
import { Camera, Upload, Sparkles, X } from 'lucide-react';
import { useRef, useState } from 'react';
import Image from 'next/image';

interface CameraScreenProps {
  onPhotoCapture: (photo: string) => void;
  onCheckVibe: () => void;
  userPhoto: string | null;
  isLoading: boolean;
}

export default function CameraScreen({
  onPhotoCapture,
  onCheckVibe,
  userPhoto,
  isLoading,
}: CameraScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onPhotoCapture(result);
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
    onPhotoCapture('');
  };

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
        Show us your spread!
      </motion.h1>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.1 }}
        className="w-16 h-0.5 bg-coral rounded-full mb-6"
      />

      {/* Photo Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md aspect-square mb-6 relative"
      >
        {userPhoto ? (
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg">
            <Image
              src={userPhoto}
              alt="Your plated dinner"
              fill
              className="object-cover"
            />
            <button
              onClick={clearPhoto}
              className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-coral bg-coral/10'
                : 'border-gray-300 hover:border-mocha hover:bg-mocha/5'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg font-medium mb-2">
              Tap to upload photo
            </p>
            <p className="text-gray-400 text-sm">or drag and drop</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleInputChange}
          className="hidden"
        />
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        {userPhoto ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCheckVibe}
            disabled={isLoading}
            className="w-full py-4 px-6 bg-coral text-white text-lg font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-coral/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
                Checking vibe...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Check My Vibe
              </>
            )}
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 px-6 bg-mocha text-white text-lg font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-mocha/90 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload Photo
          </motion.button>
        )}
      </motion.div>

      {/* Note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-sm text-gray-400 text-center max-w-xs"
      >
        Take a photo of your plated spread and we&apos;ll give you a vibe score!
      </motion.p>
    </motion.div>
  );
}
