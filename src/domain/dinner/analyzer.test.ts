import { describe, it, expect } from 'vitest';
import { findDinner, processGirlDinner } from './analyzer';

describe('findDinner', () => {
  it('should find exact match for known combinations', () => {
    const result = findDinner('brie, crackers');

    expect(result.name).toBe('Fancy But Make It Lazy');
    expect(result.tip).toContain('wine glass');
    expect(result.template).toBe('minimalist');
  });

  it('should find match for single ingredients', () => {
    const result = findDinner('cheese');

    expect(result.name).toBe('The Audacity');
  });

  it('should return default for unknown combinations', () => {
    const result = findDinner('mystery, food, items');

    expect(result.name).toBe('The Spread');
    expect(result.template).toBe('casual');
  });

  it('should find subset matches', () => {
    // "brie, crackers, grapes" should match "brie,crackers,grapes"
    const result = findDinner('brie, crackers, grapes');

    expect(result.name).toBe('Vineyard Cosplay');
  });

  it('should always include a validation message', () => {
    const result = findDinner('anything');

    expect(result.validation).toBeDefined();
    expect(result.validation.length).toBeGreaterThan(0);
  });

  it('should handle case-insensitive matching', () => {
    const result = findDinner('BRIE, CRACKERS');

    expect(result.name).toBe('Fancy But Make It Lazy');
  });
});

describe('processGirlDinner', () => {
  it('should return complete processed result', () => {
    const result = processGirlDinner('brie, crackers, grapes');

    expect(result).toHaveProperty('input');
    expect(result).toHaveProperty('classified');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('templateSelected');
    expect(result).toHaveProperty('templateReason');
    expect(result).toHaveProperty('rulesApplied');
    expect(result).toHaveProperty('prompt');
  });

  it('should classify all ingredients', () => {
    const result = processGirlDinner('brie, crackers, grapes');

    expect(result.classified).toHaveLength(3);
    expect(result.summary.total).toBe(3);
  });

  it('should select minimalist template for few items', () => {
    const result = processGirlDinner('brie');

    expect(result.templateSelected).toBe('The Minimalist');
    expect(result.templateReason).toContain('clean and simple');
  });

  it('should select appropriate template for many items', () => {
    const result = processGirlDinner('brie, crackers, grapes, olives, almonds, salami');

    // Template selection depends on ingredient composition
    // Valid templates for 6 items include: Wild Graze, Bento, or Anchor
    const validTemplates = ['The Wild Graze', 'The Bento', 'The Anchor'];
    expect(validTemplates).toContain(result.templateSelected);
    expect(result.summary.total).toBe(6);
  });

  it('should apply visual rules', () => {
    const result = processGirlDinner('grapes, olives, blueberries');

    // Should apply odd number cluster rule for small round items
    expect(result.rulesApplied).toContain('Odd Number Cluster');
    expect(result.rulesApplied).toContain('Color Balance');
  });

  it('should generate a prompt for image generation', () => {
    const result = processGirlDinner('brie, crackers');

    expect(result.prompt).toContain('Brie Wheel');
    expect(result.prompt).toContain('Crackers');
    expect(result.prompt.length).toBeGreaterThan(100);
  });

  it('should handle array input', () => {
    const result = processGirlDinner(['brie', 'crackers']);

    expect(result.classified).toHaveLength(2);
  });
});
