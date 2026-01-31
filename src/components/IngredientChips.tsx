'use client';

import { useMemo, useCallback } from 'react';

// =============================================================================
// Chip Options
// =============================================================================

const CHIP_OPTIONS = [
  { label: 'brie', emoji: '🧀' },
  { label: 'cheddar', emoji: '🧀' },
  { label: 'crackers', emoji: '🥨' },
  { label: 'olives', emoji: '🫒' },
  { label: 'grapes', emoji: '🍇' },
  { label: 'pickle', emoji: '🥒' },
  { label: 'wine', emoji: '🍷' },
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
  emoji: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

// =============================================================================
// Single Chip Component
// =============================================================================

function Chip({ label, emoji, isActive, onClick, disabled }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5
        rounded-full text-sm font-medium
        transition-all duration-200 ease-out
        border-2 animate-fade-in
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${isActive
          ? 'bg-[#E8734A] border-[#E8734A] text-white shadow-md'
          : 'bg-white border-[#E8B4A0] text-[#A47864] hover:border-[#E8734A] hover:bg-[#FFF5F2]'
        }
      `}
    >
      <span>{emoji}</span>
      <span>{label}</span>
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
    <div className="mt-4">
      <p className="text-xs text-[#736B63] mb-2 text-center">
        Quick add:
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {CHIP_OPTIONS.map((chip) => (
          <Chip
            key={chip.label}
            label={chip.label}
            emoji={chip.emoji}
            isActive={isChipActive(chip.label)}
            onClick={() => toggleChip(chip.label)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

export default IngredientChips;
