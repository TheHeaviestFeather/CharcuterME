import { describe, it, expect } from 'vitest';
import { classifyIngredients, summarizeIngredients, fuzzyMatch } from './classifier';

describe('fuzzyMatch', () => {
  it('should match exact strings', () => {
    expect(fuzzyMatch('brie', 'brie')).toBe(true);
  });

  it('should match with small typos', () => {
    expect(fuzzyMatch('brei', 'brie')).toBe(true); // 1 edit
    expect(fuzzyMatch('breie', 'brie')).toBe(true); // 1 edit
  });

  it('should not match with too many differences', () => {
    expect(fuzzyMatch('cheese', 'brie')).toBe(false);
  });

  it('should not match very short strings', () => {
    expect(fuzzyMatch('br', 'brie')).toBe(false);
  });
});

describe('classifyIngredients', () => {
  it('should classify known ingredients from database', () => {
    const result = classifyIngredients('brie, crackers, grapes');

    expect(result).toHaveLength(3);
    expect(result[0].displayName).toBe('Brie Wheel');
    expect(result[0].role).toBe('anchor');
    expect(result[1].displayName).toBe('Crackers');
    expect(result[1].role).toBe('vehicle');
    expect(result[2].displayName).toBe('Grapes');
    expect(result[2].role).toBe('pop');
  });

  it('should handle unknown ingredients gracefully', () => {
    const result = classifyIngredients('mysteryfood');

    expect(result).toHaveLength(1);
    expect(result[0].original).toBe('mysteryfood');
    expect(result[0].role).toBe('filler'); // Default role
  });

  it('should match partial ingredient names', () => {
    const result = classifyIngredients('goat cheese');

    expect(result).toHaveLength(1);
    expect(result[0].displayName).toBe('Goat Cheese');
    expect(result[0].role).toBe('anchor');
  });

  it('should accept array input', () => {
    const result = classifyIngredients(['brie', 'olives']);

    expect(result).toHaveLength(2);
    expect(result[0].displayName).toBe('Brie Wheel');
    expect(result[1].displayName).toBe('Olives');
  });

  it('should preserve original input (lowercased by parseIngredients)', () => {
    const result = classifyIngredients('BRIE');

    // Note: parseIngredients lowercases the input
    expect(result[0].original).toBe('brie');
    expect(result[0].displayName).toBe('Brie Wheel');
  });
});

describe('summarizeIngredients', () => {
  it('should categorize ingredients by role', () => {
    const classified = classifyIngredients('brie, crackers, grapes');
    const summary = summarizeIngredients(classified);

    expect(summary.total).toBe(3);
    expect(summary.anchors).toHaveLength(1);
    expect(summary.vehicles).toHaveLength(1);
    expect(summary.pops).toHaveLength(1);
  });

  it('should detect large items', () => {
    const classified = classifyIngredients('brie');
    const summary = summarizeIngredients(classified);

    expect(summary.hasLarge).toBe(true);
  });

  it('should detect small round items', () => {
    const classified = classifyIngredients('grapes, olives');
    const summary = summarizeIngredients(classified);

    expect(summary.hasSmallRound).toBe(true);
  });

  it('should detect items that need containers', () => {
    const classified = classifyIngredients('hummus, salsa');
    const summary = summarizeIngredients(classified);

    expect(summary.needsContainer).toBe(true);
  });

  it('should detect spreadable items', () => {
    const classified = classifyIngredients('hummus, pita');
    const summary = summarizeIngredients(classified);

    expect(summary.hasSpreadable).toBe(true);
  });

  it('should detect long items', () => {
    const classified = classifyIngredients('carrots, celery');
    const summary = summarizeIngredients(classified);

    expect(summary.hasLongItems).toBe(true);
  });
});
