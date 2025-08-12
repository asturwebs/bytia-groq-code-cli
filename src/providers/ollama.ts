import fetch from 'node-fetch';
import { LLMProvider, Model, ChatOptions, ChatResponse, ProviderStatus, ProviderError } from './base.js';
import { logger } from '../utils/logger.js';

interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
  modified_at: string;
}

interface OllamaMessage {
  role: string;
  content: string;
  images?: string[];
}

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaProvider extends LLMProvider {
  readonly name = 'ollama';
  readonly displayName = 'Ollama';
  readonly description = 'Local LLM inference with Ollama - private, fast, and offline';
  
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    super();
    this.baseUrl = baseUrl;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseUrl}/api/version`, {
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
      
      const response = await fetch(`${this.baseUrl}/api/version`, {
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

      const version = await response.json() as { version: string };
      
      return {
        available: true,
        connected: true,
        endpoint: this.baseUrl,
        version: version.version || 'Unknown'
      };
    } catch (error) {
      logger.debug('Ollama connection check failed:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          available: false,
          connected: false,
          error: 'Connection timeout - is Ollama running?'
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
      
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as { models: OllamaModel[] };
      
      return data.models.map(model => ({
        id: model.name,
        name: model.name,
        description: `${model.details.family || 'Local'} model (${model.details.parameter_size || 'Unknown size'})`,
        contextLength: this.getContextLength(model.name),
        supportsFunctions: false, // Ollama doesn't support function calling yet
        size: model.size,
        format: model.details.format,
        family: model.details.family
      }));
    } catch (error) {
      logger.error('Failed to list Ollama models:', error);
      throw new ProviderError(
        'Failed to fetch models from Ollama. Make sure Ollama is running.',
        this.name,
        'MODELS_FETCH_ERROR'
      );
    }
  }

  async chat(options: ChatOptions, abortSignal?: AbortSignal): Promise<ChatResponse> {
    try {
      // Convert messages to Ollama format
      const messages: OllamaMessage[] = options.messages.map(msg => ({
        role: msg.role,
        content: msg.content || ''
      }));

      const requestBody = {
        model: options.model,
        messages,
        stream: false,
        options: {
          temperature: options.temperature,
          num_predict: options.max_tokens,
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      if (abortSignal) {
        abortSignal.addEventListener('abort', () => controller.abort());
      }

      const response = await fetch(`${this.baseUrl}/api/chat`, {
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

      const data = await response.json() as OllamaChatResponse;

      return {
        id: `ollama-${Date.now()}`,
        choices: [{
          message: {
            role: data.message.role,
            content: data.message.content
          },
          finish_reason: data.done ? 'stop' : 'incomplete'
        }],
        usage: data.prompt_eval_count || data.eval_count ? {
          prompt_tokens: data.prompt_eval_count || 0,
          completion_tokens: data.eval_count || 0,
          total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
        } : undefined,
        performance: {
          total_duration: data.total_duration,
          load_duration: data.load_duration,
          prompt_eval_duration: data.prompt_eval_duration,
          eval_duration: data.eval_duration
        }
      };
    } catch (error) {
      logger.error('Ollama chat request failed:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        model: options.model,
        baseUrl: this.baseUrl,
        messagesCount: options.messages.length
      });
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      
      // More descriptive error message based on common issues
      let errorMessage = `Ollama API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED')) {
          errorMessage = 'Cannot connect to Ollama. Make sure Ollama is running on localhost:11434';
        } else if (error.message.includes('model')) {
          errorMessage = `Model "${options.model}" not found. Make sure the model is pulled in Ollama: ollama pull ${options.model}`;
        } else if (error.message.includes('404')) {
          errorMessage = `API endpoint not found. Check Ollama version and API compatibility.`;
        } else if (error.message.includes('failed to allocate') || error.message.includes('Metal buffer')) {
          errorMessage = `Model "${options.model}" is too large for available GPU memory. Try:\n• A smaller model (e.g., /model gemma3:1b)\n• Use CPU: restart Ollama with OLLAMA_GPU_LAYERS=0\n• Free up GPU memory by closing other applications`;
        } else if (error.message.includes('llama runner process has terminated')) {
          errorMessage = `Model "${options.model}" crashed during execution. This usually indicates insufficient memory. Try a smaller model or restart Ollama with CPU mode.`;
        }
      }
      
      throw new ProviderError(
        errorMessage,
        this.name,
        'CHAT_REQUEST_ERROR'
      );
    }
  }

  supportsTools(): boolean {
    return false; // Ollama doesn't support function calling yet
  }

  async initialize(): Promise<void> {
    // Test connection
    const status = await this.getStatus();
    if (!status.connected) {
      throw new ProviderError(
        'Could not connect to Ollama. Make sure Ollama is installed and running.',
        this.name,
        'CONNECTION_ERROR'
      );
    }
    logger.debug('Ollama provider initialized');
  }

  async cleanup(): Promise<void> {
    // Nothing to clean up for Ollama
    logger.debug('Ollama provider cleaned up');
  }

  validateModel(modelId: string): boolean {
    // Ollama model names can contain alphanumeric, hyphens, underscores, dots, colons
    // Examples: llama2, codellama:13b, mistral:7b-instruct-v0.1-q4_0
    return /^[a-zA-Z0-9._:-]+$/.test(modelId);
  }

  getConfigRequirements() {
    return {
      required: [],
      optional: ['OLLAMA_BASE_URL'],
      instructions: 'Install Ollama from https://ollama.ai and start the service. Optionally set OLLAMA_BASE_URL if not using default localhost:11434'
    };
  }

  /**
   * Set the base URL for Ollama API
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
   * Pull a model from Ollama registry
   */
  async pullModel(modelName: string, onProgress?: (progress: number) => void): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: modelName, stream: true })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      let buffer = '';
      for await (const chunk of response.body) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.completed && data.total) {
                const progress = (data.completed / data.total) * 100;
                onProgress?.(Math.round(progress));
              }
            } catch (e) {
              // Ignore invalid JSON lines
            }
          }
        }
      }

      logger.info(`Successfully pulled model: ${modelName}`);
    } catch (error) {
      throw new ProviderError(
        `Failed to pull model ${modelName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'MODEL_PULL_ERROR'
      );
    }
  }

  /**
   * Delete a model from local Ollama
   */
  async deleteModel(modelName: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: modelName })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      logger.info(`Successfully deleted model: ${modelName}`);
    } catch (error) {
      throw new ProviderError(
        `Failed to delete model ${modelName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'MODEL_DELETE_ERROR'
      );
    }
  }

  private getContextLength(modelName: string): number {
    // Try to infer context length from model name
    const contextLengths: Record<string, number> = {
      'llama2': 4096,
      'llama2:13b': 4096,
      'llama2:70b': 4096,
      'codellama': 16384,
      'codellama:13b': 16384,
      'codellama:34b': 16384,
      'mistral': 32768,
      'mistral:7b': 32768,
      'mixtral': 32768,
      'neural-chat': 8192,
      'starling-lm': 8192,
      'yi': 4096,
    };

    // Check for exact match
    if (contextLengths[modelName]) {
      return contextLengths[modelName];
    }

    // Check for partial matches (base model name)
    for (const [key, length] of Object.entries(contextLengths)) {
      if (modelName.startsWith(key)) {
        return length;
      }
    }

    // Default context length for unknown models
    return 8192;
  }
}
