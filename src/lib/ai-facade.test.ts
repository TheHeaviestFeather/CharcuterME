import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isClaudeAvailable,
  isVertexAvailable,
  isGPTAvailable,
} from './ai-facade';

describe('AI Facade - Service Availability', () => {
  beforeEach(() => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-anthropic-key');
    vi.stubEnv('OPENAI_API_KEY', 'test-openai-key');
    vi.stubEnv('GOOGLE_SERVICE_ACCOUNT_KEY', '{"type":"service_account"}');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('isClaudeAvailable', () => {
    it('should return true when ANTHROPIC_API_KEY is set', () => {
      expect(isClaudeAvailable()).toBe(true);
    });

    it('should return false when ANTHROPIC_API_KEY is not set', () => {
      vi.stubEnv('ANTHROPIC_API_KEY', '');
      expect(isClaudeAvailable()).toBe(false);
    });
  });

  describe('isVertexAvailable', () => {
    it('should return true when GOOGLE_SERVICE_ACCOUNT_KEY is set', () => {
      expect(isVertexAvailable()).toBe(true);
    });

    it('should return false when GOOGLE_SERVICE_ACCOUNT_KEY is not set', () => {
      vi.stubEnv('GOOGLE_SERVICE_ACCOUNT_KEY', '');
      expect(isVertexAvailable()).toBe(false);
    });
  });

  describe('isGPTAvailable', () => {
    it('should return true when OPENAI_API_KEY is set', () => {
      expect(isGPTAvailable()).toBe(true);
    });

    it('should return false when OPENAI_API_KEY is not set', () => {
      vi.stubEnv('OPENAI_API_KEY', '');
      expect(isGPTAvailable()).toBe(false);
    });
  });
});

// Note: Integration tests for generateDinnerName, generateImage, and analyzeVibe
// require complex mocking of external services. These should be tested via
// integration/e2e tests with the actual services or mock servers.
