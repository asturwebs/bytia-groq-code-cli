/**
 * Base interface for all LLM providers (Groq, Ollama, LM Studio, etc.)
 * Provides unified abstraction for different LLM backends
 */

export interface Model {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  supportsFunctions?: boolean;
  // Additional properties for different providers
  size?: number;           // File size in bytes (Ollama)
  format?: string;         // Model format (Ollama: ggml, safetensors, etc.)
  family?: string;         // Model family (Ollama: llama, mistral, etc.)
  ownedBy?: string;        // Model owner (LM Studio)
  created?: string;        // Creation timestamp (LM Studio)
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

export interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  tools?: any[];
  tool_choice?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: any[];
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  // Performance metrics (primarily for local providers)
  performance?: {
    total_duration?: number;
    load_duration?: number;
    prompt_eval_duration?: number;
    eval_duration?: number;
  };
}

export interface ProviderStatus {
  available: boolean;
  connected: boolean;
  version?: string;
  endpoint?: string;
  error?: string;
  modelsLoaded?: number;  // Number of loaded models (LM Studio)
}

/**
 * Base abstract class for LLM providers
 */
export abstract class LLMProvider {
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly description: string;
  
  /**
   * Check if this provider is available/installed
   */
  abstract isAvailable(): Promise<boolean>;
  
  /**
   * Get current status of the provider
   */
  abstract getStatus(): Promise<ProviderStatus>;
  
  /**
   * List available models
   */
  abstract listModels(): Promise<Model[]>;
  
  /**
   * Send chat completion request
   */
  abstract chat(options: ChatOptions, abortSignal?: AbortSignal): Promise<ChatResponse>;
  
  /**
   * Check if provider supports function/tool calling
   */
  abstract supportsTools(): boolean;
  
  /**
   * Initialize connection/setup
   */
  abstract initialize(): Promise<void>;
  
  /**
   * Clean up resources
   */
  abstract cleanup(): Promise<void>;
  
  /**
   * Validate model ID format for this provider
   */
  abstract validateModel(modelId: string): boolean;
  
  /**
   * Get provider-specific configuration requirements
   */
  abstract getConfigRequirements(): {
    required: string[];
    optional: string[];
    instructions: string;
  };
}

/**
 * Provider detection and management utilities
 */
export interface ProviderDetectionResult {
  provider: string;
  available: boolean;
  status: ProviderStatus;
  models?: Model[];
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/**
 * Provider priority for auto-selection
 */
export enum ProviderPriority {
  GROQ = 1,      // Cloud, fast, reliable
  OLLAMA = 2,    // Local, private, free
  LMSTUDIO = 3,  // Local, GUI-based
  OPENAI = 4     // Future: OpenAI compatibility
}

/**
 * Common provider utilities
 */
export class ProviderUtils {
  /**
   * Detect if a URL/endpoint is responding
   */
  static async isEndpointAvailable(url: string, timeout: number = 5000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      return response.ok || response.status === 404; // 404 is ok, means server is running
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Standardize model name across providers
   */
  static normalizeModelName(modelId: string, provider: string): string {
    return `${provider}:${modelId}`;
  }
  
  /**
   * Parse normalized model name back to provider and model
   */
  static parseModelName(normalizedName: string): { provider: string; model: string } {
    const [provider, ...modelParts] = normalizedName.split(':');
    return {
      provider,
      model: modelParts.join(':')
    };
  }
}
