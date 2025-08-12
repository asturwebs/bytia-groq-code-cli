import fetch from 'node-fetch';
import { LLMProvider, Model, ChatOptions, ChatResponse, ProviderStatus, ProviderError } from './base.js';
import { logger } from '../utils/logger.js';

interface LMStudioModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface LMStudioMessage {
  role: string;
  content: string;
}

interface LMStudioChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: LMStudioMessage;
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class LMStudioProvider extends LLMProvider {
  readonly name = 'lmstudio';
  readonly displayName = 'LM Studio';
  readonly description = 'Local LLM inference with LM Studio - easy-to-use local AI with GPU acceleration';
  
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:1234/v1') {
    super();
    this.baseUrl = baseUrl;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseUrl}/models`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getStatus(): Promise<ProviderStatus> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseUrl}/models`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return {
          available: false,
          connected: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json() as { data: LMStudioModel[] };
      
      return {
        available: true,
        connected: true,
        endpoint: this.baseUrl,
        version: data.data.length > 0 ? 'Connected' : 'No models loaded',
        modelsLoaded: data.data.length
      };
    } catch (error) {
      logger.debug('LM Studio connection check failed:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          available: false,
          connected: false,
          error: 'Connection timeout - is LM Studio running with local server enabled?'
        };
      }

      return {
        available: false,
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  async listModels(): Promise<Model[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/models`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as { data: LMStudioModel[] };
      
      if (data.data.length === 0) {
        throw new ProviderError(
          'No models loaded in LM Studio. Please load a model in the LM Studio interface.',
          this.name,
          'NO_MODELS_LOADED'
        );
      }
      
      return data.data.map(model => ({
        id: model.id,
        name: model.id,
        description: `Local model loaded in LM Studio`,
        contextLength: this.getContextLength(model.id),
        supportsFunctions: false, // LM Studio doesn't support function calling in OpenAI format
        ownedBy: model.owned_by,
        created: new Date(model.created * 1000).toISOString()
      }));
    } catch (error) {
      logger.error('Failed to list LM Studio models:', error);
      throw new ProviderError(
        'Failed to fetch models from LM Studio. Make sure LM Studio is running with local server enabled and a model is loaded.',
        this.name,
        'MODELS_FETCH_ERROR'
      );
    }
  }

  async chat(options: ChatOptions, abortSignal?: AbortSignal): Promise<ChatResponse> {
    try {
      // Convert messages to OpenAI format (LM Studio uses OpenAI-compatible API)
      const messages: LMStudioMessage[] = options.messages.map(msg => ({
        role: msg.role,
        content: msg.content || ''
      }));

      const requestBody = {
        model: options.model,
        messages,
        temperature: options.temperature,
        max_tokens: options.max_tokens,
        stream: false
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      if (abortSignal) {
        abortSignal.addEventListener('abort', () => controller.abort());
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json() as LMStudioChatResponse;

      return {
        id: data.id,
        choices: data.choices.map(choice => ({
          message: {
            role: choice.message.role,
            content: choice.message.content
          },
          finish_reason: choice.finish_reason
        })),
        usage: data.usage
      };
    } catch (error) {
      logger.error('LM Studio chat request failed:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      
      throw new ProviderError(
        `LM Studio API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'CHAT_REQUEST_ERROR'
      );
    }
  }

  supportsTools(): boolean {
    return false; // LM Studio doesn't support function calling in OpenAI format
  }

  async initialize(): Promise<void> {
    // Test connection and check if models are loaded
    const status = await this.getStatus();
    if (!status.connected) {
      throw new ProviderError(
        'Could not connect to LM Studio. Make sure LM Studio is running with local server enabled.',
        this.name,
        'CONNECTION_ERROR'
      );
    }

    if (status.modelsLoaded === 0) {
      throw new ProviderError(
        'No models loaded in LM Studio. Please load a model in the LM Studio interface.',
        this.name,
        'NO_MODELS_LOADED'
      );
    }

    logger.debug('LM Studio provider initialized');
  }

  async cleanup(): Promise<void> {
    // Nothing to clean up for LM Studio
    logger.debug('LM Studio provider cleaned up');
  }

  validateModel(modelId: string): boolean {
    // LM Studio model IDs can be pretty flexible, usually include path-like structures
    // Examples: llama-2-7b-chat.Q4_0.gguf, models/7B/ggml-model.bin, etc.
    return /^[a-zA-Z0-9._/-]+$/.test(modelId);
  }

  getConfigRequirements() {
    return {
      required: [],
      optional: ['LMSTUDIO_BASE_URL'],
      instructions: 'Install LM Studio from https://lmstudio.ai, load a model, and enable the local server. Optionally set LMSTUDIO_BASE_URL if not using default localhost:1234'
    };
  }

  /**
   * Set the base URL for LM Studio API
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Get current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get current server status from LM Studio
   */
  async getServerInfo(): Promise<any> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseUrl}/models`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new ProviderError(
        `Failed to get server info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'SERVER_INFO_ERROR'
      );
    }
  }

  /**
   * Check if a specific model is currently loaded
   */
  async isModelLoaded(modelName: string): Promise<boolean> {
    try {
      const models = await this.listModels();
      return models.some(model => model.id === modelName || model.name === modelName);
    } catch (error) {
      logger.error('Error checking if model is loaded:', error);
      return false;
    }
  }

  /**
   * Get performance statistics if available
   */
  async getPerformanceStats(): Promise<any> {
    // LM Studio doesn't expose performance stats via API
    // This is a placeholder for future functionality
    return {
      gpu_layers: null,
      memory_usage: null,
      inference_speed: null
    };
  }

  private getContextLength(modelName: string): number {
    // Try to infer context length from model name
    const contextLengths: Record<string, number> = {
      'llama-2': 4096,
      'llama2': 4096,
      'codellama': 16384,
      'code-llama': 16384,
      'mistral': 32768,
      'mixtral': 32768,
      'neural-chat': 8192,
      'starling': 8192,
      'zephyr': 8192,
      'openhermes': 8192,
      'yi-': 4096,
      'qwen': 32768,
      'deepseek': 16384,
      'wizard': 8192,
      'openchat': 8192,
    };

    // Check for partial matches in model name
    const lowerName = modelName.toLowerCase();
    for (const [key, length] of Object.entries(contextLengths)) {
      if (lowerName.includes(key)) {
        return length;
      }
    }

    // Try to extract context length from model name patterns
    // Examples: model-4k, model-8k, model-32k, etc.
    const contextMatch = lowerName.match(/(\d+)k/);
    if (contextMatch) {
      const contextK = parseInt(contextMatch[1]);
      return contextK * 1024;
    }

    // Default context length for unknown models
    return 8192;
  }
}
