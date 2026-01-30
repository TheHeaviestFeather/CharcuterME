'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IngredientChips } from './IngredientChips';
import { ProgressDots } from './ProgressDots';

// =============================================================================
// Time-based Greetings
// =============================================================================

interface TimeGreeting {
  greeting: string;
  showTime?: boolean;
}

function getTimeBasedGreeting(): TimeGreeting {
  const hour = new Date().getHours();
  const time = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).toLowerCase();

  if (hour >= 5 && hour < 11) {
    return { greeting: "Breakfast? Brunch? Who's counting." };
  }
  if (hour >= 11 && hour < 14) {
    return { greeting: "The midday snack attack is real." };
  }
  if (hour >= 14 && hour < 17) {
    return { greeting: "The 3pm slump hits different." };
  }
  if (hour >= 17 && hour < 20) {
    return { greeting: "Dinner is a strong word. Let's say... food." };
  }
  if (hour >= 20 && hour < 23) {
    return { greeting: `It's ${time}. You're hungry. We get it.`, showTime: true };
  }
  if (hour >= 23 || hour < 2) {
    return { greeting: "It's almost tomorrow. No judgment here." };
  }
  // 2am - 5am
  return { greeting: `It's ${time}. Chaotic. Iconic. Valid.`, showTime: true };
}

// =============================================================================
// Rotating Taglines
// =============================================================================

const TAGLINES = [
  "Turn fridge chaos into culinary art",
  "Your snacks deserve a name",
  "Adulting is hard. Dinner doesn't have to be.",
  "Because 'random stuff on a plate' needed a rebrand",
  "Validating questionable food choices since 2024",
  "For when cooking feels like too much",
  "Your horizontal dinner deserves respect",
  "Making 'I'll just have snacks' sound fancy",
];

function useRotatingTagline(interval = 4000) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % TAGLINES.length);
    }, interval);
    return () => clearInterval(timer);
  }, [interval]);

  return TAGLINES[index];
}

// =============================================================================
// Input Screen Component
// =============================================================================

interface InputScreenProps {
  onSubmit: (ingredients: string) => void;
  isLoading?: boolean;
}

export function InputScreen({ onSubmit, isLoading = false }: InputScreenProps) {
  const [ingredients, setIngredients] = useState('');
  const [timeGreeting, setTimeGreeting] = useState<TimeGreeting>({ greeting: '' });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tagline = useRotatingTagline(4000);

  // Get time-based greeting on mount (client-side only)
  useEffect(() => {
    setTimeGreeting(getTimeBasedGreeting());
  }, []);

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
    <motion.div
      className="min-h-screen bg-[#FAF9F7] flex flex-col items-center justify-center px-6 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Time-based greeting */}
      <motion.p
        className="text-sm text-[#9A8A7C] mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {timeGreeting.greeting}
      </motion.p>

      {/* Header */}
      <motion.header
        className="text-center mb-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <h1 className="font-serif text-4xl italic text-[#A47864] mb-3">
          CharcuterME
        </h1>
        {/* Rotating tagline */}
        <div className="h-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={tagline}
              className="text-sm text-[#9A8A7C]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {tagline}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Input Section */}
      <motion.div
        className="w-full max-w-[340px] mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Label above input */}
        <label
          htmlFor="ingredients-input"
          className="block text-center text-[#A47864] text-base mb-3"
        >
          What&apos;s in the fridge tonight?
        </label>

        {/* Floating input box */}
        <motion.div
          className="bg-white rounded-xl shadow-md px-5 py-4"
          whileFocus={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
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
        </motion.div>
        <p id="ingredients-hint" className="sr-only">
          Enter your ingredients separated by commas
        </p>

        {/* Ingredient Chips */}
        <IngredientChips
          value={ingredients}
          onChange={setIngredients}
          disabled={isLoading}
        />
      </motion.div>

      {/* CTA Button */}
      <motion.button
        onClick={handleSubmit}
        disabled={!ingredients.trim() || isLoading}
        className={`
          w-full max-w-[340px] rounded-xl py-4 px-8
          text-base font-semibold text-white
          transition-colors duration-200
          shadow-lg shadow-[#E8734A]/30
          ${(!ingredients.trim() || isLoading)
            ? 'bg-[#E8B4A0] cursor-not-allowed'
            : 'bg-[#E8734A] hover:bg-[#D4623B] cursor-pointer'
          }
        `}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={ingredients.trim() && !isLoading ? { scale: 1.02, y: -2 } : {}}
        whileTap={ingredients.trim() && !isLoading ? { scale: 0.98 } : {}}
      >
        {isLoading ? 'Creating magic...' : 'Name This Masterpiece'}
      </motion.button>

      {/* Progress Dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10"
      >
        <ProgressDots currentStep={1} animate />
      </motion.div>
    </motion.div>
  );
}

export default InputScreen;
