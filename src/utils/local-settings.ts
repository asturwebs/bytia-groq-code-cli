import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { logger } from './logger.js';

interface Config {
  groqApiKey?: string;
  defaultModel?: string;
  lastVersionCheck?: string; // ISO timestamp
  lastVersionWarning?: string; // ISO timestamp of last warning shown
  // New provider system configuration
  providers?: Array<{
    name: string;
    enabled: boolean;
    priority: number;
    config?: Record<string, any>;
  }>;
  activeProvider?: string;
  // Provider-specific settings
  ollamaBaseUrl?: string;
  lmstudioBaseUrl?: string;
  // Session persistence
  lastSession?: {
    provider: string;
    model: string;
    timestamp: string;
    conversationHistory?: Array<{
      role: 'system' | 'user' | 'assistant' | 'tool';
      content: string;
      timestamp?: string;
      tool_calls?: any[];
      tool_call_id?: string;
    }>;
  };
}

const CONFIG_DIR = '.groq'; // In home directory
const CONFIG_FILE = 'config.json';
const OLD_CONFIG_FILE = 'local-settings.json'; // For backward compatibility

export class ConfigManager {
  private configPath: string;
  private oldConfigPath: string;

  constructor() {
    const homeDir = os.homedir();
    this.configPath = path.join(homeDir, CONFIG_DIR, CONFIG_FILE);
    this.oldConfigPath = path.join(homeDir, CONFIG_DIR, OLD_CONFIG_FILE);
    this.migrateOldConfig();
  }

  private migrateOldConfig(): void {
    try {
      // If new config exists, no migration needed
      if (fs.existsSync(this.configPath)) {
        return;
      }

      // If old config exists, migrate it to new location
      if (fs.existsSync(this.oldConfigPath)) {
        const oldConfigData = fs.readFileSync(this.oldConfigPath, 'utf8');
        fs.writeFileSync(this.configPath, oldConfigData, { mode: 0o600 });
        
        // Remove old config file after successful migration
        fs.unlinkSync(this.oldConfigPath);
        logger.debug('Migrated config from local-settings.json to config.json');
      }
    } catch (error) {
      logger.warn('Failed to migrate old config file', error);
    }
  }

  private ensureConfigDir(): void {
    const configDir = path.dirname(this.configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  }

  public getApiKey(): string | null {
    try {
      if (!fs.existsSync(this.configPath)) {
        return null;
      }

      const configData = fs.readFileSync(this.configPath, 'utf8');
      const config: Config = JSON.parse(configData);
      return config.groqApiKey || null;
    } catch (error) {
      logger.warn('Failed to read config file', error);
      return null;
    }
  }

  public setApiKey(apiKey: string): void {
    try {
      this.ensureConfigDir();

      let config: Config = {};
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        config = JSON.parse(configData);
      }

      config.groqApiKey = apiKey;

      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), {
        mode: 0o600 // Read/write for owner only
      });
    } catch (error) {
      throw new Error(`Failed to save API key: ${error}`);
    }
  }

  public clearApiKey(): void {
    try {
      if (!fs.existsSync(this.configPath)) {
        return;
      }

      const configData = fs.readFileSync(this.configPath, 'utf8');
      const config: Config = JSON.parse(configData);
      delete config.groqApiKey;

      if (Object.keys(config).length === 0) {
        fs.unlinkSync(this.configPath);
      } else {
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), {
          mode: 0o600
        });
      }
    } catch (error) {
      logger.warn('Failed to clear API key', error);
    }
  }

  public getDefaultModel(): string | null {
    try {
      if (!fs.existsSync(this.configPath)) {
        return null;
      }

      const configData = fs.readFileSync(this.configPath, 'utf8');
      const config: Config = JSON.parse(configData);
      return config.defaultModel || null;
    } catch (error) {
      logger.warn('Failed to read default model', error);
      return null;
    }
  }

  public setDefaultModel(model: string): void {
    try {
      this.ensureConfigDir();

      let config: Config = {};
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        config = JSON.parse(configData);
      }

      config.defaultModel = model;

      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), {
        mode: 0o600 // Read/write for owner only
      });
    } catch (error) {
      throw new Error(`Failed to save default model: ${error}`);
    }
  }

  public getLastVersionCheck(): Date | null {
    try {
      if (!fs.existsSync(this.configPath)) {
        return null;
      }

      const configData = fs.readFileSync(this.configPath, 'utf8');
      const config: Config = JSON.parse(configData);
      return config.lastVersionCheck ? new Date(config.lastVersionCheck) : null;
    } catch (error) {
      logger.warn('Failed to read last version check', error);
      return null;
    }
  }

  public setLastVersionCheck(): void {
    try {
      this.ensureConfigDir();

      let config: Config = {};
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        config = JSON.parse(configData);
      }

      config.lastVersionCheck = new Date().toISOString();

      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), {
        mode: 0o600
      });
    } catch (error) {
      logger.warn('Failed to save last version check', error);
    }
  }

  public getLastVersionWarning(): Date | null {
    try {
      if (!fs.existsSync(this.configPath)) {
        return null;
      }

      const configData = fs.readFileSync(this.configPath, 'utf8');
      const config: Config = JSON.parse(configData);
      return config.lastVersionWarning ? new Date(config.lastVersionWarning) : null;
    } catch (error) {
      logger.warn('Failed to read last version warning', error);
      return null;
    }
  }

  public setLastVersionWarning(): void {
    try {
      this.ensureConfigDir();

      let config: Config = {};
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        config = JSON.parse(configData);
      }

      config.lastVersionWarning = new Date().toISOString();

      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), {
        mode: 0o600
      });
    } catch (error) {
      logger.warn('Failed to save last version warning', error);
    }
  }

  /**
   * Get the full configuration object
   */
  public getConfig(): Config {
    try {
      if (!fs.existsSync(this.configPath)) {
        return {};
      }

      const configData = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      logger.warn('Failed to read config file', error);
      return {};
    }
  }

  /**
   * Set the full configuration object
   */
  public setConfig(config: Config): void {
    try {
      this.ensureConfigDir();
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), {
        mode: 0o600
      });
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  /**
   * Update specific config fields
   */
  public updateConfig(updates: Partial<Config>): void {
    try {
      const currentConfig = this.getConfig();
      const newConfig = { ...currentConfig, ...updates };
      this.setConfig(newConfig);
    } catch (error) {
      throw new Error(`Failed to update config: ${error}`);
    }
  }

  /**
   * Save the current session state
   */
  public saveSession(provider: string, model: string, conversationHistory?: any[]): void {
    try {
      const config = this.getConfig();
      
      // Limit conversation history to last 20 messages to avoid huge config files
      const limitedHistory = conversationHistory ? conversationHistory.slice(-20) : undefined;
      
      config.lastSession = {
        provider,
        model,
        timestamp: new Date().toISOString(),
        conversationHistory: limitedHistory?.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date().toISOString(),
          tool_calls: msg.tool_calls,
          tool_call_id: msg.tool_call_id
        }))
      };
      
      this.setConfig(config);
      logger.debug(`Session saved: ${provider}/${model} with ${limitedHistory?.length || 0} messages`);
    } catch (error) {
      logger.warn('Failed to save session', error);
    }
  }

  /**
   * Get the last session state
   */
  public getLastSession(): {
    provider: string;
    model: string;
    timestamp: string;
    conversationHistory?: any[];
  } | null {
    try {
      const config = this.getConfig();
      return config.lastSession || null;
    } catch (error) {
      logger.warn('Failed to read last session', error);
      return null;
    }
  }

  /**
   * Clear saved session
   */
  public clearSession(): void {
    try {
      const config = this.getConfig();
      delete config.lastSession;
      this.setConfig(config);
      logger.debug('Session cleared');
    } catch (error) {
      logger.warn('Failed to clear session', error);
    }
  }

  /**
   * Check if a session should be restored (not older than 24 hours)
   */
  public shouldRestoreSession(): boolean {
    try {
      const lastSession = this.getLastSession();
      if (!lastSession) return false;
      
      const sessionTime = new Date(lastSession.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - sessionTime.getTime()) / (1000 * 60 * 60);
      
      // Restore if session is less than 24 hours old
      return hoursDiff < 24;
    } catch (error) {
      logger.warn('Failed to check session restore', error);
      return false;
    }
  }
}

// Global instance for backward compatibility
const globalConfigManager = new ConfigManager();

/**
 * Get the global configuration object
 */
export function getLocalSettings(): Config {
  return globalConfigManager.getConfig();
}

/**
 * Set the global configuration object
 */
export function setLocalSettings(config: Config): void {
  globalConfigManager.setConfig(config);
}

/**
 * Update specific fields in the global configuration
 */
export function updateLocalSettings(updates: Partial<Config>): void {
  globalConfigManager.updateConfig(updates);
}
