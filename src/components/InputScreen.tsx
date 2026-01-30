'use client';

import { useState, useRef, useEffect } from 'react';

// =============================================================================
// Input Screen - Simplified (No Emojis)
// =============================================================================

interface InputScreenProps {
  onSubmit: (ingredients: string) => void;
  isLoading?: boolean;
}

export function InputScreen({ onSubmit, isLoading = false }: InputScreenProps) {
  const [ingredients, setIngredients] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight, with a max of 200px
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [ingredients]);

  const handleSubmit = () => {
    if (ingredients.trim() && !isLoading) {
      onSubmit(ingredients.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex flex-col items-center justify-center px-6 py-8">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="font-serif text-3xl italic text-[#A47864] mb-2">
          CharcuterME
        </h1>
        <p className="text-sm text-[#9A8A7C]">
          Turn Fridge Chaos Into Culinary Art
        </p>
      </header>

      {/* Input Section */}
      <div className="w-full max-w-[340px] mb-6">
        {/* Label above input */}
        <label
          htmlFor="ingredients-input"
          className="block text-center text-[#A47864] text-base mb-3"
        >
          What&apos;s in the abyss today?
        </label>

        {/* Floating input box */}
        <div className="bg-white rounded-xl shadow-md px-5 py-4">
          <textarea
            ref={textareaRef}
            id="ingredients-input"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="brie, crackers, grapes..."
            disabled={isLoading}
            aria-describedby="ingredients-hint"
            rows={1}
            className="w-full border-none outline-none text-base text-[#A47864] bg-transparent placeholder:text-[#C4B5A9] resize-none overflow-hidden min-h-[24px]"
          />
        </div>
        <p id="ingredients-hint" className="sr-only">
          Enter your ingredients separated by commas
        </p>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleSubmit}
        disabled={!ingredients.trim() || isLoading}
        className={`
          w-full max-w-[340px] rounded-xl py-4 px-8
          text-base font-semibold text-white
          transition-all duration-200 ease-out
          shadow-lg shadow-[#E8734A]/30
          ${(!ingredients.trim() || isLoading)
            ? 'bg-[#E8B4A0] cursor-not-allowed'
            : 'bg-[#E8734A] hover:bg-[#D4623B] hover:-translate-y-0.5 cursor-pointer active:translate-y-0'
          }
        `}
      >
        {isLoading ? 'Creating magic...' : 'Make it Art, I Guess'}
      </button>

      {/* Progress Dots */}
      <div className="flex gap-2 mt-10">
        <div className="w-2 h-2 rounded-full bg-[#E8734A]" />
        <div className="w-2 h-2 rounded-full bg-[#E8B4A0]" />
        <div className="w-2 h-2 rounded-full bg-[#E8B4A0]" />
      </div>
    </div>
  );
}

export default InputScreen;
