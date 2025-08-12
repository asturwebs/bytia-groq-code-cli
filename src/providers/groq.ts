import Groq from 'groq-sdk';
import { LLMProvider, Model, ChatOptions, ChatResponse, ProviderStatus, ProviderError } from './base.js';
import { logger } from '../utils/logger.js';

export class GroqProvider extends LLMProvider {
  readonly name = 'groq';
  readonly displayName = 'Groq';
  readonly description = 'Groq cloud-based inference engine with ultra-fast LLM inference';
  
  private client: Groq | null = null;
  private apiKey: string | null = null;

  async isAvailable(): Promise<boolean> {
    // Check if API key is available (env var or config)
    const apiKey = process.env.GROQ_API_KEY || this.apiKey;
    return !!apiKey;
  }

  async getStatus(): Promise<ProviderStatus> {
    try {
      const hasApiKey = await this.isAvailable();
      
      if (!hasApiKey) {
        return {
          available: false,
          connected: false,
          error: 'API key not configured'
        };
      }

      // Test connection by listing models
      if (!this.client) {
        await this.initialize();
      }

      const models = await this.client!.models.list();
      
      return {
        available: true,
        connected: true,
        endpoint: 'https://api.groq.com/openai/v1',
        version: models.data?.[0]?.id ? 'Connected' : 'Unknown'
      };
    } catch (error) {
      logger.error('Groq provider status check failed:', error);
      return {
        available: true, // API key exists, but connection failed
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  async listModels(): Promise<Model[]> {
    try {
      if (!this.client) {
        await this.initialize();
      }

      const response = await this.client!.models.list();
      
      return response.data.map(model => ({
        id: model.id,
        name: model.id,
        description: `${model.id} - Groq optimized model`,
        contextLength: this.getContextLength(model.id),
        supportsFunctions: this.modelSupportsTools(model.id)
      }));
    } catch (error) {
      logger.error('Failed to list Groq models:', error);
      throw new ProviderError(
        'Failed to fetch models from Groq',
        this.name,
        'MODELS_FETCH_ERROR'
      );
    }
  }

  async chat(options: ChatOptions, abortSignal?: AbortSignal): Promise<ChatResponse> {
    try {
      if (!this.client) {
        await this.initialize();
      }

      const response = await this.client!.chat.completions.create({
        model: options.model,
        messages: options.messages as any,
        tools: options.tools,
        tool_choice: options.tool_choice as any,
        temperature: options.temperature,
        max_tokens: options.max_tokens,
        stream: false // Force non-streaming for now
      }, {
        signal: abortSignal
      }) as any; // Type assertion to handle Groq SDK types

      return {
        id: response.id,
        choices: response.choices.map((choice: any) => ({
          message: {
            role: choice.message.role,
            content: choice.message.content,
            tool_calls: choice.message.tool_calls
          },
          finish_reason: choice.finish_reason
        })),
        usage: response.usage ? {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens
        } : undefined
      };
    } catch (error) {
      logger.error('Groq chat request failed:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw error; // Re-throw abort errors as-is
      }
      
      throw new ProviderError(
        `Groq API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'CHAT_REQUEST_ERROR'
      );
    }
  }

  supportsTools(): boolean {
    return true; // Groq supports function calling
  }

  async initialize(): Promise<void> {
    const apiKey = process.env.GROQ_API_KEY || this.apiKey;
    
    if (!apiKey) {
      throw new ProviderError(
        'Groq API key not found. Please set GROQ_API_KEY environment variable or use /login command.',
        this.name,
        'API_KEY_MISSING'
      );
    }

    this.client = new Groq({ apiKey });
    logger.debug('Groq provider initialized');
  }

  async cleanup(): Promise<void> {
    this.client = null;
    logger.debug('Groq provider cleaned up');
  }

  validateModel(modelId: string): boolean {
    // Groq model IDs are typically in format: provider/model-name
    // Examples: llama3-70b-8192, mixtral-8x7b-32768, etc.
    return /^[a-zA-Z0-9_-]+$/.test(modelId) || /^[^/]+\/[^/]+$/.test(modelId);
  }

  getConfigRequirements() {
    return {
      required: ['GROQ_API_KEY'],
      optional: [],
      instructions: 'Get your free API key from https://console.groq.com/keys'
    };
  }

  /**
   * Set API key for this provider
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.client = null; // Force re-initialization
  }

  /**
   * Get current API key (masked for security)
   */
  getApiKey(): string | null {
    const key = this.apiKey || process.env.GROQ_API_KEY;
    return key ? `${key.substring(0, 8)}...` : null;
  }

  /**
   * Clear stored API key
   */
  clearApiKey(): void {
    this.apiKey = null;
    this.client = null;
  }

  private getContextLength(modelId: string): number {
    // Map known Groq models to their context lengths
    const contextLengths: Record<string, number> = {
      'llama3-8b-8192': 8192,
      'llama3-70b-8192': 8192,
      'mixtral-8x7b-32768': 32768,
      'gemma-7b-it': 8192,
      'gemma2-9b-it': 8192,
    };

    return contextLengths[modelId] || 8192; // Default to 8K context
  }

  private modelSupportsTools(modelId: string): boolean {
    // Most Groq models support function calling
    const toolSupportedModels = [
      'llama3-8b-8192',
      'llama3-70b-8192',
      'mixtral-8x7b-32768',
      'gemma-7b-it',
      'gemma2-9b-it'
    ];

    return toolSupportedModels.includes(modelId);
  }
}
