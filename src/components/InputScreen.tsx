'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { COPY, SUGGESTION_CATEGORIES, SURPRISE_COMBOS } from '@/lib/copy';
import { processGirlDinner } from '@/lib/logic-bridge';
import { analytics } from '@/lib/analytics';

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
// Icons
// =============================================================================

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="currentColor" />
    </svg>
  );
}

// =============================================================================
// Ingredient Chip (User-added)
// =============================================================================

interface IngredientChipProps {
  label: string;
  onRemove: () => void;
  isNew?: boolean;
}

function IngredientChip({ label, onRemove, isNew }: IngredientChipProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5
        bg-coral text-white rounded-full text-sm font-medium
        ${isNew ? 'animate-chip-pop' : ''}
      `}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${label}`}
      >
        <XIcon />
      </button>
    </span>
  );
}

// =============================================================================
// Suggestion Chip (Tappable)
// =============================================================================

interface SuggestionChipProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function SuggestionChip({ label, onClick, disabled }: SuggestionChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3 py-1.5 rounded-full text-sm font-medium
        border-2 border-peach text-text-secondary
        transition-all duration-150
        ${disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:border-coral hover:text-coral hover:bg-peach/30 active:scale-95'
        }
      `}
    >
      {label}
    </button>
  );
}

// =============================================================================
// Preview Card
// =============================================================================

interface PreviewCardProps {
  ingredients: string[];
}

function PreviewCard({ ingredients }: PreviewCardProps) {
  const preview = useMemo(() => {
    if (ingredients.length < 3) return null;
    try {
      const result = processGirlDinner(ingredients);
      return {
        template: result.templateSelected,
        vibe: result.templateReason || 'Chaotic neutral energy',
      };
    } catch {
      return null;
    }
  }, [ingredients]);

  if (ingredients.length < 3) {
    return (
      <div className="mt-4 p-4 bg-peach/30 rounded-xl border-2 border-dashed border-peach text-center">
        <p className="text-text-muted text-sm italic">
          {COPY.input.previewEmpty}
        </p>
      </div>
    );
  }

  if (!preview) return null;

  return (
    <div className="mt-4 p-4 bg-white rounded-xl border-2 border-peach shadow-sm">
      <p className="text-xs text-text-muted mb-2">{COPY.input.previewLabel}</p>
      <p className="font-display text-lg italic text-coral mb-1">
        &ldquo;{preview.template}&rdquo;
      </p>
      <p className="text-sm text-text-secondary">
        {preview.vibe}
      </p>
    </div>
  );
}

// =============================================================================
// Input Screen
// =============================================================================

interface InputScreenProps {
  onSubmit: (ingredients: string) => void;
  isLoading?: boolean;
}

const MIN_INGREDIENTS = 3;
const MAX_INGREDIENTS = 8;

export function InputScreen({ onSubmit, isLoading = false }: InputScreenProps) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [newChipIndex, setNewChipIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [isGreetingTransitioning, setIsGreetingTransitioning] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Time-appropriate greetings
  const timeOfDay = useMemo(() => getTimeOfDay(), []);
  const greetings = TIME_GREETINGS[timeOfDay];

  // Rotate greetings
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

  // Clear new chip animation
  useEffect(() => {
    if (newChipIndex === null) return;
    const timer = setTimeout(() => setNewChipIndex(null), 200);
    return () => clearTimeout(timer);
  }, [newChipIndex]);

  // Show toast
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  // Add ingredient
  const addIngredient = useCallback((ingredient: string, source: 'typed' | 'suggestion' | 'surprise') => {
    const normalized = ingredient.trim().toLowerCase();
    if (!normalized) return;

    if (ingredients.includes(normalized)) {
      showToast(COPY.input.duplicateToast);
      return;
    }

    if (ingredients.length >= MAX_INGREDIENTS) {
      showToast(`Max ${MAX_INGREDIENTS} ingredients`);
      return;
    }

    setIngredients(prev => [...prev, normalized]);
    setNewChipIndex(ingredients.length);
    setInputValue('');
    analytics.ingredientAdded(ingredients.length + 1, source);

    // Haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [ingredients, showToast]);

  // Remove ingredient
  const removeIngredient = useCallback((index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
    analytics.ingredientRemoved(ingredients.length - 1);
  }, [ingredients.length]);

  // Handle input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Check for comma to add ingredient
    if (value.includes(',')) {
      const parts = value.split(',');
      const toAdd = parts[0].trim();
      if (toAdd) {
        addIngredient(toAdd, 'typed');
      }
      setInputValue(parts.slice(1).join(','));
    } else {
      setInputValue(value);
    }
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addIngredient(inputValue, 'typed');
      } else if (ingredients.length >= MIN_INGREDIENTS) {
        handleSubmit();
      }
    } else if (e.key === 'Backspace' && !inputValue && ingredients.length > 0) {
      removeIngredient(ingredients.length - 1);
    }
  };

  // Surprise me
  const handleSurprise = () => {
    const combo = SURPRISE_COMBOS[Math.floor(Math.random() * SURPRISE_COMBOS.length)];
    const newIngredients: string[] = [];
    combo.forEach(ing => {
      if (!ingredients.includes(ing) && newIngredients.length + ingredients.length < MAX_INGREDIENTS) {
        newIngredients.push(ing);
      }
    });
    if (newIngredients.length > 0) {
      setIngredients(prev => [...prev, ...newIngredients]);
      newIngredients.forEach((_, i) => {
        setTimeout(() => setNewChipIndex(ingredients.length + i), i * 100);
      });
      analytics.surpriseClicked(newIngredients.length);
    }
    inputRef.current?.focus();
  };

  // Submit
  const handleSubmit = () => {
    if (ingredients.length >= MIN_INGREDIENTS && !isLoading) {
      analytics.inputSubmit(ingredients.length);
      onSubmit(ingredients.join(', '));
    }
  };

  const canSubmit = ingredients.length >= MIN_INGREDIENTS;
  const countColor = ingredients.length < MIN_INGREDIENTS
    ? 'text-text-muted'
    : ingredients.length <= MAX_INGREDIENTS
    ? 'text-coral'
    : 'text-amber-500';

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-text-primary text-white rounded-full text-sm font-medium shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="text-center mb-6">
        <h1 className="font-display text-4xl italic text-coral mb-2 tracking-tight">
          CharcuterME
        </h1>
        <p className="text-base text-text-secondary">
          Turn snacks into a whole personality
        </p>
      </header>

      {/* Greeting */}
      <div className="text-center mb-4 h-16 flex flex-col justify-center">
        <p
          className={`
            text-xl font-semibold text-coral mb-1
            transition-opacity duration-300
            ${isGreetingTransitioning ? 'opacity-0' : 'opacity-100'}
          `}
        >
          {greetings[greetingIndex]}
        </p>
        <p className="text-text-secondary text-sm">
          What&apos;s on the plate?
        </p>
      </div>

      {/* Main Input Area */}
      <div className="w-full max-w-[360px]">
        {/* Chip Input Box */}
        <div
          className="bg-white rounded-2xl border-2 border-peach shadow-lg p-3 transition-all duration-200 focus-within:border-coral focus-within:shadow-xl cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          <div className="flex flex-wrap gap-2 items-center">
            {ingredients.map((ing, i) => (
              <IngredientChip
                key={`${ing}-${i}`}
                label={ing}
                onRemove={() => removeIngredient(i)}
                isNew={i === newChipIndex}
              />
            ))}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={ingredients.length === 0 ? COPY.input.placeholder : ''}
              disabled={isLoading}
              className="flex-1 min-w-[100px] border-none outline-none text-base text-text-primary bg-transparent placeholder:text-text-muted"
              aria-label="Add ingredient"
            />
          </div>
        </div>

        {/* Count + Helper */}
        <div className="flex justify-between items-center mt-2 px-1">
          <span className={`text-sm font-medium ${countColor}`}>
            {ingredients.length}/{MAX_INGREDIENTS}
          </span>
          <span className="text-xs text-text-muted">
            {COPY.input.helper}
          </span>
        </div>

        {/* Preview Card */}
        <PreviewCard ingredients={ingredients} />

        {/* Category Suggestions */}
        <div className="mt-6">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-3 text-center">
            {COPY.input.categoryLabel}
          </p>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-3">
            {Object.keys(SUGGESTION_CATEGORIES).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                className={`
                  px-3 py-1 rounded-full text-xs font-semibold
                  transition-all duration-150
                  ${activeCategory === category
                    ? 'bg-coral text-white'
                    : 'bg-peach text-text-secondary hover:bg-coral/20'
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Suggestions for Active Category */}
          {activeCategory && (
            <div className="flex flex-wrap gap-2 justify-center animate-fade-in">
              {SUGGESTION_CATEGORIES[activeCategory as keyof typeof SUGGESTION_CATEGORIES].map((suggestion) => (
                <SuggestionChip
                  key={suggestion}
                  label={suggestion}
                  onClick={() => addIngredient(suggestion, 'suggestion')}
                  disabled={isLoading || ingredients.includes(suggestion)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTAs */}
      <div className="w-full max-w-[360px] mt-8 space-y-3">
        {/* Primary CTA */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isLoading}
          className={`
            w-full rounded-2xl py-5 px-8
            text-lg font-bold text-white
            transition-all duration-200 ease-out
            shadow-lg min-h-[68px]
            ${(!canSubmit || isLoading)
              ? 'bg-[#E8B4A0] cursor-not-allowed shadow-[#E8B4A0]/20'
              : 'bg-coral hover:bg-coral-dark hover:-translate-y-1 hover:shadow-xl shadow-coral/30 cursor-pointer active:translate-y-0 active:scale-[0.98]'
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {COPY.input.ctaLoading}
            </span>
          ) : canSubmit ? (
            COPY.input.cta
          ) : (
            COPY.input.ctaDisabled
          )}
        </button>

        {/* Surprise Me */}
        <button
          onClick={handleSurprise}
          disabled={isLoading || ingredients.length >= MAX_INGREDIENTS}
          className={`
            w-full flex items-center justify-center gap-2
            py-3 px-6 rounded-xl
            text-base font-semibold
            border-2 border-peach text-text-secondary
            transition-all duration-200
            ${isLoading || ingredients.length >= MAX_INGREDIENTS
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:border-coral hover:text-coral hover:bg-peach/30'
            }
          `}
        >
          <SparkleIcon />
          {COPY.input.surpriseMe}
        </button>
      </div>

      {/* Footer */}
      <div className="mt-8 flex gap-4 text-xs text-text-muted">
        <a href="/privacy" className="hover:text-text-secondary transition-colors underline underline-offset-2">
          Privacy
        </a>
        <a href="/terms" className="hover:text-text-secondary transition-colors underline underline-offset-2">
          Terms
        </a>
      </div>
    </div>
  );
}

export default InputScreen;
