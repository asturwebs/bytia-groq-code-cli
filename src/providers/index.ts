export { LLMProvider, ProviderError } from './base.js';
export type { Model, ChatOptions, ChatResponse, ProviderStatus, ProviderDetectionResult } from './base.js';

export { GroqProvider } from './groq.js';
export { OllamaProvider } from './ollama.js';
export { LMStudioProvider } from './lmstudio.js';

// Provider registry
import { GroqProvider } from './groq.js';
import { OllamaProvider } from './ollama.js';
import { LMStudioProvider } from './lmstudio.js';

export const PROVIDERS = {
  groq: GroqProvider,
  ollama: OllamaProvider,
  lmstudio: LMStudioProvider
} as const;

export type ProviderName = keyof typeof PROVIDERS;

/**
 * Create a provider instance by name
 */
export function createProvider(name: ProviderName, ...args: any[]): InstanceType<typeof PROVIDERS[typeof name]> {
  const ProviderClass = PROVIDERS[name];
  return new ProviderClass(...args) as any;
}

/**
 * Get list of all available provider names
 */
export function getAvailableProviders(): ProviderName[] {
  return Object.keys(PROVIDERS) as ProviderName[];
}

/**
 * Check if a provider name is valid
 */
export function isValidProvider(name: string): name is ProviderName {
  return name in PROVIDERS;
}
