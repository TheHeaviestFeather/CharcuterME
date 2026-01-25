import { describe, it, expect } from 'vitest';
import {
  parseIngredients,
  sanitizeIngredients,
  validateRequest,
  NameRequestSchema,
  SketchRequestSchema,
} from './validation';

describe('parseIngredients', () => {
  it('should parse comma-separated ingredients', () => {
    const result = parseIngredients('brie, crackers, grapes');
    expect(result).toEqual(['brie', 'crackers', 'grapes']);
  });

  it('should handle newline-separated ingredients', () => {
    const result = parseIngredients('brie\ncrackers\ngrapes');
    expect(result).toEqual(['brie', 'crackers', 'grapes']);
  });

  it('should trim whitespace', () => {
    const result = parseIngredients('  brie  ,  crackers  ');
    expect(result).toEqual(['brie', 'crackers']);
  });

  it('should lowercase all ingredients', () => {
    const result = parseIngredients('BRIE, Crackers');
    expect(result).toEqual(['brie', 'crackers']);
  });

  it('should filter out very short ingredients', () => {
    const result = parseIngredients('a, brie, b');
    expect(result).toEqual(['brie']);
  });

  it('should filter out ingredients with dangerous characters', () => {
    const result = parseIngredients('brie, <script>alert(1)</script>, crackers');
    expect(result).toEqual(['brie', 'crackers']);
  });

  it('should limit to 12 ingredients for performance', () => {
    const input = Array(20).fill('cheese').join(', ');
    const result = parseIngredients(input);
    expect(result.length).toBe(12);
  });
});

describe('sanitizeIngredients', () => {
  it('should remove dangerous characters', () => {
    const result = sanitizeIngredients('brie {test} "quoted"');
    expect(result).not.toContain('{');
    expect(result).not.toContain('"');
  });

  it('should convert newlines to commas', () => {
    const result = sanitizeIngredients('brie\ncrackers');
    expect(result).toBe('brie, crackers');
  });

  it('should collapse whitespace', () => {
    const result = sanitizeIngredients('brie    crackers');
    expect(result).toBe('brie crackers');
  });

  it('should limit length to 500 characters', () => {
    const input = 'a'.repeat(1000);
    const result = sanitizeIngredients(input);
    expect(result.length).toBe(500);
  });
});

describe('validateRequest', () => {
  describe('NameRequestSchema', () => {
    it('should accept valid ingredients', () => {
      const result = validateRequest(NameRequestSchema, {
        ingredients: 'brie, crackers',
      });
      expect(result.success).toBe(true);
      expect(result.data?.ingredients).toBe('brie, crackers');
    });

    it('should reject empty ingredients', () => {
      const result = validateRequest(NameRequestSchema, {
        ingredients: '',
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Ingredients are required');
    });

    it('should reject missing ingredients', () => {
      const result = validateRequest(NameRequestSchema, {});
      expect(result.success).toBe(false);
    });

    it('should reject ingredients that are too long', () => {
      const result = validateRequest(NameRequestSchema, {
        ingredients: 'a'.repeat(1001),
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Input too long');
    });
  });

  describe('SketchRequestSchema', () => {
    it('should accept valid ingredients', () => {
      const result = validateRequest(SketchRequestSchema, {
        ingredients: 'brie, crackers',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty ingredients', () => {
      const result = validateRequest(SketchRequestSchema, {
        ingredients: '',
      });
      expect(result.success).toBe(false);
    });
  });
});
