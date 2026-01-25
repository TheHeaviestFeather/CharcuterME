/**
 * Shared AI Client Utilities
 * Centralized client creation and shared helpers for AI API routes
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Lazy-loaded clients to avoid instantiation errors during build
let openaiClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

// Reset clients (useful for testing or key rotation)
export function resetClients(): void {
  openaiClient = null;
  anthropicClient = null;
}
