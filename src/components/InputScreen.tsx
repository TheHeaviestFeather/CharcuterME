'use client';

import { motion } from 'framer-motion';
import { ChefHat, Sparkles } from 'lucide-react';
import type { TemplateId } from '@/types';

interface InputScreenProps {
  ingredients: string;
  setIngredients: (value: string) => void;
  selectedTemplate: TemplateId;
  setSelectedTemplate: (value: TemplateId) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const TEMPLATE_OPTIONS: { id: TemplateId; name: string; description: string; icon: string }[] = [
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Less is more — breathing room',
    icon: '○',
  },
  {
    id: 'anchor',
    name: 'The Anchor',
    description: 'One hero, supporting cast',
    icon: '◉',
  },
  {
    id: 'snackLine',
    name: 'Snack Line',
    description: 'Dip + dippers in a row',
    icon: '═',
  },
  {
    id: 'bento',
    name: 'Bento',
    description: 'Organized zones',
    icon: '▦',
  },
  {
    id: 'wildGraze',
    name: 'Wild Graze',
    description: 'Abundant S-curve flow',
    icon: '∿',
  },
];

export default function InputScreen({
  ingredients,
  setIngredients,
  selectedTemplate,
  setSelectedTemplate,
  onSubmit,
  isLoading,
}: InputScreenProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ingredients.trim()) {
      onSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-[80vh] px-6"
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <ChefHat className="w-10 h-10 text-mocha" />
          <h1 className="text-4xl font-bold text-mocha">CharcuterME</h1>
        </div>
        <p className="text-lg text-gray-600">Turn Fridge Chaos Into Culinary Art</p>
      </motion.div>

      {/* Input Form */}
      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleSubmit}
        className="w-full max-w-md"
      >
        <label className="block mb-3 text-xl font-medium text-center text-gray-800">
          What do you have?
        </label>

        <textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="brie, crackers, grapes, salami..."
          className="w-full p-4 text-lg border-2 border-mocha/30 rounded-xl focus:border-mocha focus:ring-2 focus:ring-mocha/20 outline-none transition-all resize-none bg-white"
          rows={3}
          disabled={isLoading}
        />

        <p className="mt-2 text-sm text-center text-gray-500">
          Just type what&apos;s in your fridge. No fancy ingredients required.
        </p>

        {/* Template Selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <label className="block mb-3 text-lg font-medium text-center text-gray-800">
            Pick your vibe
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TEMPLATE_OPTIONS.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedTemplate === template.id
                    ? 'border-coral bg-coral/10 ring-2 ring-coral/30'
                    : 'border-gray-200 hover:border-mocha/50 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{template.icon}</span>
                  <span className="font-medium text-sm text-gray-800">{template.name}</span>
                </div>
                <p className="text-xs text-gray-500">{template.description}</p>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={!ingredients.trim() || isLoading}
          className="w-full mt-6 py-4 px-6 bg-coral text-white text-lg font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-coral/90 transition-colors"
        >
          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
              Naming your dinner...
            </>
          ) : (
            <>
              Make it a Spread
              <Sparkles className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </motion.form>

      {/* Suggestions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 text-center"
      >
        <p className="text-sm text-gray-500 mb-2">Try these:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['brie, crackers, grapes', 'chips, salsa, guac', 'cheese, pepperoni'].map(
            (suggestion) => (
              <button
                key={suggestion}
                onClick={() => setIngredients(suggestion)}
                className="px-3 py-1 text-sm bg-lavender/20 text-lavender rounded-full hover:bg-lavender/30 transition-colors"
              >
                {suggestion}
              </button>
            )
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
