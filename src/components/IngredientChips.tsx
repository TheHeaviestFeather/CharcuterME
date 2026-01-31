'use client';

import { useMemo, useCallback } from 'react';

// =============================================================================
// Chip Options - No emojis, playful labels only
// =============================================================================

// 5 classic + 5 chaotic - the full girl dinner spectrum
const CHIP_OPTIONS = [
  // Classic charcuterie
  'brie',
  'crackers',
  'olives',
  'grapes',
  'wine',
  // Chaotic additions
  'pizza',
  'yogurt',
  'chocolate',
  'chips',
  'pickles',
];

// =============================================================================
// Types
// =============================================================================

interface IngredientChipsProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

interface ChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

// =============================================================================
// Single Chip Component - Bold and Chunky
// =============================================================================

function Chip({ label, isActive, onClick, disabled }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2
        rounded-xl text-sm font-semibold
        transition-all duration-150 ease-out
        border-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${isActive
          ? 'bg-coral border-coral text-white shadow-md'
          : 'bg-white border-peach text-text-secondary hover:border-coral hover:text-coral'
        }
      `}
    >
      {label}
    </button>
  );
}

// =============================================================================
// Ingredient Chips Component
// =============================================================================

export function IngredientChips({ value, onChange, disabled = false }: IngredientChipsProps) {
  // Parse current ingredients from the input value
  const activeIngredients = useMemo(() => {
    return value
      .toLowerCase()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [value]);

  // Check if a chip is active
  const isChipActive = useCallback(
    (label: string) => {
      return activeIngredients.some(
        (ingredient) => ingredient === label.toLowerCase()
      );
    },
    [activeIngredients]
  );

  // Toggle a chip on/off
  const toggleChip = useCallback(
    (label: string) => {
      const normalizedLabel = label.toLowerCase();

      if (isChipActive(label)) {
        // Remove the ingredient
        const newIngredients = activeIngredients.filter(
          (ingredient) => ingredient !== normalizedLabel
        );
        onChange(newIngredients.join(', '));
      } else {
        // Add the ingredient
        const newIngredients = [...activeIngredients, normalizedLabel];
        onChange(newIngredients.join(', '));
      }
    },
    [activeIngredients, isChipActive, onChange]
  );

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-2 justify-center">
        {CHIP_OPTIONS.map((chip) => (
          <Chip
            key={chip}
            label={chip}
            isActive={isChipActive(chip)}
            onClick={() => toggleChip(chip)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

export default IngredientChips;
