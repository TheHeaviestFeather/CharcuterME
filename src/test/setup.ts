import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
vi.stubEnv('OPENAI_API_KEY', 'test-key');

// Mock Next.js Response
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
    ...actual,
  };
});
