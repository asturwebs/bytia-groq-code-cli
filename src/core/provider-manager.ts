import { 
  LLMProvider, 
  ProviderStatus, 
  ProviderDetectionResult,
  Model,
  createProvider,
  getAvailableProviders,
  isValidProvider,
  ProviderName
} from '../providers/index.js';
import { logger } from '../utils/logger.js';
import { getLocalSettings, setLocalSettings } from '../utils/local-settings.js';

export interface ProviderConfig {
  name: ProviderName;
  enabled: boolean;
  priority: number;
  config?: Record<string, any>;
}

export class ProviderManager {
  private providers = new Map<ProviderName, LLMProvider>();
  private activeProvider: LLMProvider | null = null;
  private providerConfigs: ProviderConfig[] = [];

  constructor() {
    this.initializeDefaultConfigs();
  }

  /**
   * Initialize default provider configurations
   */
  private initializeDefaultConfigs(): void {
    this.providerConfigs = [
      { name: 'groq', enabled: true, priority: 1 },
      { name: 'ollama', enabled: true, priority: 2 },
      { name: 'lmstudio', enabled: true, priority: 3 }
    ];
  }

  /**
   * Load provider configurations from settings
   */
  async loadConfig(): Promise<void> {
    try {
      const settings = await getLocalSettings();
      const savedConfigs = settings.providers;
      
      if (savedConfigs && Array.isArray(savedConfigs)) {
        // Validate and convert saved configs to proper types
        this.providerConfigs = savedConfigs
          .filter(config => isValidProvider(config.name))
          .map(config => ({
            name: config.name as ProviderName,
            enabled: config.enabled,
            priority: config.priority,
            config: config.config
          }));
        logger.debug(`Loaded ${this.providerConfigs.length} provider configurations`);
      }
    } catch (error) {
      logger.warn('Could not load provider configs, using defaults:', error);
    }
  }

  /**
   * Save provider configurations to settings
   */
  async saveConfig(): Promise<void> {
    try {
      const settings = await getLocalSettings();
      settings.providers = this.providerConfigs;
      await setLocalSettings(settings);
      logger.debug('Saved provider configurations');
    } catch (error) {
      logger.error('Failed to save provider configs:', error);
    }
  }

  /**
   * Get or create a provider instance
   */
  private getProviderInstance(name: ProviderName): LLMProvider {
    if (!this.providers.has(name)) {
      const provider = createProvider(name);
      this.providers.set(name, provider);
    }
    return this.providers.get(name)!;
  }

  /**
   * Detect all available providers and their status
   */
  async detectProviders(): Promise<ProviderDetectionResult[]> {
    logger.info('Detecting available LLM providers...');
    const results: ProviderDetectionResult[] = [];
    
    const availableNames = getAvailableProviders();
    
    for (const name of availableNames) {
      try {
        const provider = this.getProviderInstance(name);
        const available = await provider.isAvailable();
        const status = await provider.getStatus();
        
        let models: Model[] | undefined;
        if (status.connected) {
          try {
            models = await provider.listModels();
          } catch (error) {
            logger.debug(`Failed to list models for ${name}:`, error);
          }
        }
        
        results.push({
          provider: name,
          available,
          status,
          models
        });
        
        logger.debug(`${provider.displayName}: ${available ? 'available' : 'unavailable'}, connected: ${status.connected}`);
      } catch (error) {
        logger.error(`Error detecting provider ${name}:`, error);
        results.push({
          provider: name,
          available: false,
          status: {
            available: false,
            connected: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    }
    
    return results;
  }

  /**
   * Auto-select the best available provider based on priority
   */
  async autoSelectProvider(): Promise<LLMProvider | null> {
    const detection = await this.detectProviders();
    
    // Sort by priority and availability
    const sortedConfigs = [...this.providerConfigs]
      .filter(config => config.enabled)
      .sort((a, b) => a.priority - b.priority);
    
    for (const config of sortedConfigs) {
      const result = detection.find(d => d.provider === config.name);
      if (result?.available && result.status.connected) {
        try {
          const provider = this.getProviderInstance(config.name);
          await provider.initialize();
          this.activeProvider = provider;
          
          logger.info(`Auto-selected provider: ${provider.displayName}`);
          return provider;
        } catch (error) {
          logger.error(`Failed to initialize ${config.name}:`, error);
        }
      }
    }
    
    logger.warn('No available providers found during auto-selection');
    return null;
  }

  /**
   * Manually set the active provider
   */
  async setActiveProvider(name: ProviderName): Promise<void> {
    if (!isValidProvider(name)) {
      throw new Error(`Invalid provider name: ${name}`);
    }

    const provider = this.getProviderInstance(name);
    const status = await provider.getStatus();
    
    if (!status.connected) {
      throw new Error(`Provider ${name} is not available or connected`);
    }

    if (this.activeProvider && this.activeProvider !== provider) {
      await this.activeProvider.cleanup();
    }

    await provider.initialize();
    this.activeProvider = provider;
    
    logger.info(`Active provider set to: ${provider.displayName}`);
  }

  /**
   * Get the currently active provider
   */
  getActiveProvider(): LLMProvider | null {
    return this.activeProvider;
  }

  /**
   * Get provider by name
   */
  getProvider(name: ProviderName): LLMProvider {
    return this.getProviderInstance(name);
  }

  /**
   * List all configured providers
   */
  getProviderConfigs(): ProviderConfig[] {
    return [...this.providerConfigs];
  }

  /**
   * Update provider configuration
   */
  async updateProviderConfig(name: ProviderName, updates: Partial<ProviderConfig>): Promise<void> {
    const index = this.providerConfigs.findIndex(config => config.name === name);
    
    if (index >= 0) {
      this.providerConfigs[index] = { ...this.providerConfigs[index], ...updates };
    } else {
      this.providerConfigs.push({
        name,
        enabled: true,
        priority: this.providerConfigs.length + 1,
        ...updates
      });
    }
    
    await this.saveConfig();
  }

  /**
   * List all models from all connected providers
   */
  async getAllModels(): Promise<Array<Model & { provider: string }>> {
    const detection = await this.detectProviders();
    const allModels: Array<Model & { provider: string }> = [];
    
    for (const result of detection) {
      if (result.models) {
        for (const model of result.models) {
          allModels.push({
            ...model,
            provider: result.provider
          });
        }
      }
    }
    
    return allModels;
  }

  /**
   * Find models matching a query across all providers
   */
  async findModels(query: string): Promise<Array<Model & { provider: string }>> {
    const allModels = await this.getAllModels();
    const lowerQuery = query.toLowerCase();
    
    return allModels.filter(model => 
      model.id.toLowerCase().includes(lowerQuery) ||
      model.name.toLowerCase().includes(lowerQuery) ||
      (model.description && model.description.toLowerCase().includes(lowerQuery)) ||
      model.provider.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get provider status summary
   */
  async getStatusSummary(): Promise<{
    total: number;
    available: number;
    connected: number;
    active: string | null;
  }> {
    const detection = await this.detectProviders();
    
    return {
      total: detection.length,
      available: detection.filter(d => d.available).length,
      connected: detection.filter(d => d.status.connected).length,
      active: this.activeProvider?.name || null
    };
  }

  /**
   * Cleanup all providers
   */
  async cleanup(): Promise<void> {
    logger.debug('Cleaning up providers...');
    
    for (const provider of this.providers.values()) {
      try {
        await provider.cleanup();
      } catch (error) {
        logger.error('Error during provider cleanup:', error);
      }
    }
    
    this.providers.clear();
    this.activeProvider = null;
  }

  /**
   * Health check for active provider
   */
  async healthCheck(): Promise<boolean> {
    if (!this.activeProvider) {
      return false;
    }

    try {
      const status = await this.activeProvider.getStatus();
      return status.connected;
    } catch (error) {
      logger.error('Health check failed for active provider:', error);
      return false;
    }
  }

  /**
   * Switch to next available provider (failover)
   */
  async failover(): Promise<LLMProvider | null> {
    logger.warn('Attempting provider failover...');
    
    const currentName = this.activeProvider?.name;
    if (this.activeProvider) {
      await this.activeProvider.cleanup();
      this.activeProvider = null;
    }
    
    // Try to find the next best provider (excluding the current one)
    const detection = await this.detectProviders();
    const sortedConfigs = [...this.providerConfigs]
      .filter(config => config.enabled && config.name !== currentName)
      .sort((a, b) => a.priority - b.priority);
    
    for (const config of sortedConfigs) {
      const result = detection.find(d => d.provider === config.name);
      if (result?.available && result.status.connected) {
        try {
          await this.setActiveProvider(config.name);
          logger.info(`Failover successful: switched to ${this.activeProvider!.displayName}`);
          return this.activeProvider;
        } catch (error) {
          logger.error(`Failover to ${config.name} failed:`, error);
        }
      }
    }
    
    logger.error('Failover failed: no alternative providers available');
    return null;
  }
}
