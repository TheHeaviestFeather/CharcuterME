import { describe, it, expect } from 'vitest';
import {
  stripEmojis,
  extractJson,
  safeJsonParse,
  parseClaudeNamerResponse,
  parseGPTVibeResponse,
} from './ai-response';

describe('stripEmojis', () => {
  it('should remove common emojis', () => {
    expect(stripEmojis('Hello 😀 World')).toBe('Hello  World');
    expect(stripEmojis('Test 🎉🎊🎁')).toBe('Test');
  });

  it('should handle text without emojis', () => {
    expect(stripEmojis('Hello World')).toBe('Hello World');
  });

  it('should remove various emoji types', () => {
    expect(stripEmojis('Food 🍕🍔🌮')).toBe('Food');
    expect(stripEmojis('Flags 🇺🇸🇬🇧')).toBe('Flags');
    expect(stripEmojis('Symbols ⭐✨💫')).toBe('Symbols');
  });

  it('should trim whitespace', () => {
    expect(stripEmojis('  test  ')).toBe('test');
  });
});

describe('extractJson', () => {
  it('should extract JSON from plain text', () => {
    const input = 'Here is the response: {"name": "test"}';
    expect(extractJson(input)).toBe('{"name": "test"}');
  });

  it('should extract JSON with nested objects', () => {
    const input = '{"outer": {"inner": "value"}}';
    expect(extractJson(input)).toBe('{"outer": {"inner": "value"}}');
  });

  it('should return null for non-JSON text', () => {
    expect(extractJson('Hello world')).toBeNull();
  });
});

describe('safeJsonParse', () => {
  it('should parse valid JSON', () => {
    const result = safeJsonParse<{ name: string }>('{"name": "test"}');
    expect(result).toEqual({ name: 'test' });
  });

  it('should extract and parse JSON from markdown', () => {
    const input = 'Some text {"name": "test"} more text';
    const result = safeJsonParse<{ name: string }>(input);
    expect(result).toEqual({ name: 'test' });
  });

  it('should return null for invalid JSON', () => {
    expect(safeJsonParse('not json')).toBeNull();
  });
});

describe('parseClaudeNamerResponse', () => {
  it('should parse valid namer response', () => {
    const input = JSON.stringify({
      name: 'The Audacity',
      validation: 'Valid dinner.',
      tip: 'Eat it.',
      wildcard: 'Add cheese.',
    });

    const result = parseClaudeNamerResponse(input);
    expect(result).toEqual({
      name: 'The Audacity',
      validation: 'Valid dinner.',
      tip: 'Eat it.',
      wildcard: 'Add cheese.',
    });
  });

  it('should strip emojis from response', () => {
    const input = JSON.stringify({
      name: 'Test 🎉',
      validation: 'Great 👍',
      tip: 'Try this ✨',
    });

    const result = parseClaudeNamerResponse(input);
    expect(result?.name).toBe('Test');
    expect(result?.validation).toBe('Great');
    expect(result?.tip).toBe('Try this');
  });

  it('should return null for missing required fields', () => {
    const input = JSON.stringify({ name: 'Test' });
    expect(parseClaudeNamerResponse(input)).toBeNull();
  });

  it('should truncate long fields', () => {
    const input = JSON.stringify({
      name: 'A'.repeat(100),
      validation: 'B'.repeat(200),
      tip: 'C'.repeat(300),
    });

    const result = parseClaudeNamerResponse(input);
    expect(result?.name.length).toBe(50);
    expect(result?.validation.length).toBe(150);
    expect(result?.tip.length).toBe(200);
  });
});

describe('parseGPTVibeResponse', () => {
  it('should parse valid vibe response', () => {
    const input = JSON.stringify({
      score: 85,
      rank: 'Couch Gourmet',
      compliment: 'Nice spread!',
      sticker: '🍕',
      improvement: 'Add more cheese',
    });

    const result = parseGPTVibeResponse(input);
    expect(result).toEqual({
      score: 85,
      rank: 'Couch Gourmet',
      compliment: 'Nice spread!',
      sticker: '🍕',
      improvement: 'Add more cheese',
    });
  });

  it('should clamp score to 0-100', () => {
    const overInput = JSON.stringify({ score: 150, rank: 'test', compliment: 'test', sticker: '' });
    expect(parseGPTVibeResponse(overInput)?.score).toBe(100);

    const underInput = JSON.stringify({ score: -50, rank: 'test', compliment: 'test', sticker: '' });
    expect(parseGPTVibeResponse(underInput)?.score).toBe(0);
  });

  it('should provide defaults for missing optional fields', () => {
    const input = JSON.stringify({});
    const result = parseGPTVibeResponse(input);

    expect(result?.score).toBe(50);
    expect(result?.rank).toBe('Mystery Chef');
    expect(result?.compliment).toBe('You tried and that counts!');
  });

  it('should return null for invalid JSON', () => {
    expect(parseGPTVibeResponse('not json')).toBeNull();
  });
});
