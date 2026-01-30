import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isVertexConfigured } from './vertex-auth';

describe('Vertex Auth', () => {
  beforeEach(() => {
    vi.stubEnv('GOOGLE_SERVICE_ACCOUNT_KEY', '{"type":"service_account"}');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('isVertexConfigured', () => {
    it('should return true when GOOGLE_SERVICE_ACCOUNT_KEY is set', () => {
      expect(isVertexConfigured()).toBe(true);
    });

    it('should return false when GOOGLE_SERVICE_ACCOUNT_KEY is not set', () => {
      vi.stubEnv('GOOGLE_SERVICE_ACCOUNT_KEY', '');
      expect(isVertexConfigured()).toBe(false);
    });
  });

  // Note: getVertexAccessToken requires actual Google Auth library
  // integration which should be tested via integration tests
});
