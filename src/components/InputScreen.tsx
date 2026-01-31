'use client';

import { useState, useRef, useEffect } from 'react';
import { IngredientChips } from './IngredientChips';

// =============================================================================
// Input Screen - Direction C: Playful Creator (No Emojis)
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
      textarea.style.height = 'auto';
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
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-8">
      {/* Header - Bold and Confident */}
      <header className="text-center mb-10">
        <h1 className="font-display text-4xl italic text-coral mb-3 tracking-tight">
          CharcuterME
        </h1>
        <p className="text-base text-text-secondary font-medium">
          Turn snacks into a whole personality
        </p>
      </header>

      {/* Input Section */}
      <div className="w-full max-w-[360px] mb-8">
        {/* Prompt - Big and Playful */}
        <label
          htmlFor="ingredients-input"
          className="block text-center text-text-primary text-xl font-semibold mb-4"
        >
          What&apos;s on the plate tonight?
        </label>

        {/* Chunky Input Box */}
        <div className="bg-white rounded-2xl border-2 border-peach shadow-lg px-5 py-4 transition-all duration-200 focus-within:border-coral focus-within:shadow-xl">
          <textarea
            ref={textareaRef}
            id="ingredients-input"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="cheese, crackers, vibes..."
            disabled={isLoading}
            aria-describedby="ingredients-hint"
            rows={1}
            className="w-full border-none outline-none text-lg text-text-primary bg-transparent placeholder:text-text-muted resize-none overflow-hidden min-h-[28px]"
          />
        </div>
        <p id="ingredients-hint" className="sr-only">
          Enter your ingredients separated by commas
        </p>

        {/* Ingredient Chips - No "Quick add" label, self-explanatory */}
        <IngredientChips
          value={ingredients}
          onChange={setIngredients}
          disabled={isLoading}
        />
      </div>

      {/* CTA Button - Chunky and Confident */}
      <button
        onClick={handleSubmit}
        disabled={!ingredients.trim() || isLoading}
        className={`
          w-full max-w-[360px] rounded-2xl py-5 px-8
          text-lg font-bold text-white
          transition-all duration-200 ease-out
          shadow-lg
          ${(!ingredients.trim() || isLoading)
            ? 'bg-[#E8B4A0] cursor-not-allowed shadow-[#E8B4A0]/20'
            : 'bg-coral hover:bg-coral-dark hover:-translate-y-1 hover:shadow-xl shadow-coral/30 cursor-pointer active:translate-y-0 active:scale-[0.98]'
          }
        `}
      >
        {isLoading ? 'Working on it...' : 'Name My Dinner'}
      </button>

      {/* Subtle footer */}
      <a
        href="/privacy"
        className="mt-12 text-xs text-text-muted hover:text-text-secondary transition-colors underline underline-offset-2"
      >
        Privacy Policy
      </a>
    </div>
  );
}

export default InputScreen;
