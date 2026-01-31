'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { IngredientChips } from './IngredientChips';

// =============================================================================
// Time-of-Day Greetings
// =============================================================================

const TIME_GREETINGS = {
  morning: [
    "Breakfast for dinner energy?",
    "Starting the day chaotic?",
    "Morning snack incoming?",
  ],
  afternoon: [
    "Lunch situation?",
    "Afternoon grazing?",
    "Midday munchies?",
  ],
  evening: [
    "What's for dinner?",
    "Evening spread incoming?",
    "Dinner vibes?",
  ],
  latenight: [
    "Late night snack attack?",
    "Midnight cravings?",
    "Post-bedtime snacking?",
    "Fridge raid detected?",
  ],
};

function getTimeOfDay(): keyof typeof TIME_GREETINGS {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'latenight';
}

// =============================================================================
// Rotating CTAs
// =============================================================================

const CTA_OPTIONS = [
  "Name This Disaster",
  "Make It A Whole Mood",
  "Validate My Choices",
  "Turn This Into Art",
  "Work Your Magic",
];

// =============================================================================
// Input Screen - Direction C with Rotating Elements
// =============================================================================

interface InputScreenProps {
  onSubmit: (ingredients: string) => void;
  isLoading?: boolean;
}

export function InputScreen({ onSubmit, isLoading = false }: InputScreenProps) {
  const [ingredients, setIngredients] = useState('');
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [ctaIndex, setCtaIndex] = useState(0);
  const [isCtaTransitioning, setIsCtaTransitioning] = useState(false);
  const [isGreetingTransitioning, setIsGreetingTransitioning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get time-appropriate greetings
  const timeOfDay = useMemo(() => getTimeOfDay(), []);
  const greetings = TIME_GREETINGS[timeOfDay];

  // Rotate greetings every 3 seconds
  useEffect(() => {
    if (isLoading) return;

    const interval = setInterval(() => {
      setIsGreetingTransitioning(true);
      setTimeout(() => {
        setGreetingIndex((prev) => (prev + 1) % greetings.length);
        setIsGreetingTransitioning(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [greetings.length, isLoading]);

  // Rotate CTAs every 4 seconds (only when has input)
  useEffect(() => {
    if (isLoading || !ingredients.trim()) return;

    const interval = setInterval(() => {
      setIsCtaTransitioning(true);
      setTimeout(() => {
        setCtaIndex((prev) => (prev + 1) % CTA_OPTIONS.length);
        setIsCtaTransitioning(false);
      }, 200);
    }, 4000);

    return () => clearInterval(interval);
  }, [ingredients, isLoading]);

  // Auto-resize textarea
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

  const hasInput = ingredients.trim().length > 0;

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-8">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="font-display text-4xl italic text-coral mb-2 tracking-tight">
          CharcuterME
        </h1>
        <p className="text-base text-text-secondary">
          Turn snacks into a whole personality
        </p>
      </header>

      {/* Prompt Section */}
      <div className="text-center mb-6 h-20 flex flex-col justify-center">
        {/* Rotating Time-Aware Greeting */}
        <p
          className={`
            text-xl font-semibold text-coral mb-2
            transition-opacity duration-300
            ${isGreetingTransitioning ? 'opacity-0' : 'opacity-100'}
          `}
        >
          {greetings[greetingIndex]}
        </p>
        {/* Static Subhead */}
        <p className="text-text-secondary text-base">
          What&apos;s on the plate?
        </p>
      </div>

      {/* Input Section */}
      <div className="w-full max-w-[360px] mb-6">
        {/* Input Box */}
        <div className="bg-white rounded-2xl border-2 border-peach shadow-lg px-5 py-4 transition-all duration-200 focus-within:border-coral focus-within:shadow-xl">
          <textarea
            ref={textareaRef}
            id="ingredients-input"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="cheese, regret, wine..."
            disabled={isLoading}
            aria-label="Enter your ingredients"
            rows={1}
            className="w-full border-none outline-none text-lg text-text-primary bg-transparent placeholder:text-text-muted resize-none overflow-hidden min-h-[28px]"
          />
        </div>

        {/* Ingredient Chips */}
        <IngredientChips
          value={ingredients}
          onChange={setIngredients}
          disabled={isLoading}
        />
      </div>

      {/* CTA Button */}
      <button
        onClick={handleSubmit}
        disabled={!hasInput || isLoading}
        className={`
          w-full max-w-[360px] rounded-2xl py-5 px-8
          text-lg font-bold text-white
          transition-all duration-200 ease-out
          shadow-lg min-h-[68px]
          ${(!hasInput || isLoading)
            ? 'bg-[#E8B4A0] cursor-not-allowed shadow-[#E8B4A0]/20'
            : 'bg-coral hover:bg-coral-dark hover:-translate-y-1 hover:shadow-xl shadow-coral/30 cursor-pointer active:translate-y-0 active:scale-[0.98]'
          }
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Working on it...
          </span>
        ) : !hasInput ? (
          "Name My Dinner"
        ) : (
          <span
            className={`
              transition-opacity duration-200
              ${isCtaTransitioning ? 'opacity-0' : 'opacity-100'}
            `}
          >
            {CTA_OPTIONS[ctaIndex]}
          </span>
        )}
      </button>

      {/* Footer */}
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
