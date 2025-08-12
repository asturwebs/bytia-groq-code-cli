import { CommandDefinition, CommandContext } from '../base.js';
import { Agent } from '../../core/agent.js';

// Helper to get agent from context 
const getAgent = (context: any): Agent | null => {
  return context.agent || null;
};

// /providers - List all providers and their status
export const providersCommand: CommandDefinition = {
  command: 'providers',
  aliases: ['prov', 'p'],
  description: 'List all available LLM providers and their status',
  handler: async (context: CommandContext & { agent?: Agent }) => {
    const agent = getAgent(context);
    if (!agent) {
      context.addMessage({
        role: 'system',
        content: '❌ Agent not available for provider management.',
      });
      return;
    }

    try {
      const detection = await agent.detectProviders();
      const summary = await agent.getProvidersStatus();
      
      let content = '🔍 **Provider Status Summary**\n\n';
      content += `📊 **Overview**: ${summary.connected}/${summary.available}/${summary.total} (connected/available/total)\n`;
      content += `🎯 **Active**: ${summary.active || 'None'}\n\n`;

      content += '**Providers:**\n';
      
      for (const result of detection) {
        const provider = agent.getProviderManager().then(pm => pm.getProvider(result.provider as any));
        const providerInstance = await provider;
        
        let icon = '❌';
        let statusText = 'Not Available';
        
        if (result.available) {
          if (result.status.connected) {
            icon = summary.active === result.provider ? '🎯' : '✅';
            statusText = result.status.connected ? 'Connected' : 'Available';
          } else {
            icon = '🔶';
            statusText = 'Available but not connected';
          }
        }
        
        content += `${icon} **${providerInstance.displayName}** (${result.provider})\n`;
        content += `   ${providerInstance.description}\n`;
        content += `   Status: ${statusText}\n`;
        
        if (result.status.endpoint) {
          content += `   Endpoint: ${result.status.endpoint}\n`;
        }
        
        if (result.status.version) {
          content += `   Version: ${result.status.version}\n`;
        }
        
        if (result.models && result.models.length > 0) {
          content += `   Models: ${result.models.length} available\n`;
        }
        
        if (result.status.error) {
          content += `   Error: ${result.status.error}\n`;
        }
        
        content += '\n';
      }
      
      content += '**Available Commands:**\n';
      content += '• `/switch <provider>` - Switch to a specific provider\n';
      content += '• `/models` - List models from active provider (or all if none active)\n';
      content += '• `/models <query>` - Search models by name across all providers\n';
      content += '• `/provider-help` - Get help with provider setup\n';

      context.addMessage({
        role: 'system',
        content,
      });
    } catch (error) {
      context.addMessage({
        role: 'system',
        content: `❌ Failed to get provider information: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  },
};

// /switch - Switch between providers
export const switchCommand: CommandDefinition = {
  command: 'switch',
  aliases: ['sw', 'provider'],
  description: 'Switch to a specific LLM provider (groq, ollama, lmstudio)',
  handler: async (context: CommandContext & { agent?: Agent }, args?: string) => {
    const agent = getAgent(context);
    if (!agent) {
      context.addMessage({
        role: 'system',
        content: '❌ Agent not available for provider switching.',
      });
      return;
    }

    // Extract provider name from the original command if not passed as args
    // This is a bit of a workaround since we don't get args directly
    const fullMessage = (context as any).lastCommand || '';
    const match = fullMessage.match(/\/(?:switch|sw|provider)\s+(\w+)/i);
    const providerName = match ? match[1].toLowerCase() : '';

    if (!providerName) {
      const detection = await agent.detectProviders();
      let content = '🔄 **Switch Provider**\n\n';
      content += 'Usage: `/switch <provider_name>`\n\n';
      content += '**Available Providers:**\n';
      
      for (const result of detection) {
        const status = result.status.connected ? '✅' : (result.available ? '🔶' : '❌');
        content += `• ${status} \`${result.provider}\` - ${result.status.connected ? 'Connected' : (result.available ? 'Available' : 'Not available')}\n`;
      }
      
      content += '\nExample: `/switch ollama`';
      
      context.addMessage({
        role: 'system',
        content,
      });
      return;
    }

    try {
      const result = await agent.switchProvider(providerName);
      
      if (result.success) {
        context.addMessage({
          role: 'system',
          content: `🎯 **${result.message}**\n\nYou are now using the **${providerName}** provider. All subsequent chat requests will use this provider.\n\nUse \`/models\` to see available models for this provider.`,
        });
      } else {
        context.addMessage({
          role: 'system',
          content: `❌ **Failed to switch provider**\n\n${result.message}\n\nUse \`/providers\` to see available providers and their status.`,
        });
      }
    } catch (error) {
      context.addMessage({
        role: 'system',
        content: `❌ Error switching provider: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  },
};

// /models - List models from all providers or search
export const modelsCommand: CommandDefinition = {
  command: 'models',
  aliases: ['m', 'model-list'],
  description: 'List all available models from all providers, or search with /models <query>',
  handler: async (context: CommandContext & { agent?: Agent }) => {
    const agent = getAgent(context);
    if (!agent) {
      context.addMessage({
        role: 'system',
        content: '❌ Agent not available for model listing.',
      });
      return;
    }

    try {
      // Check active provider
      const providerManager = await agent.getProviderManager();
      const activeProvider = providerManager.getActiveProvider();

      // Extract search query if provided
      const fullMessage = (context as any).lastCommand || '';
      const match = fullMessage.match(/\/(?:models|m|model-list)\s+(.+)/i);
      const query = match ? match[1].trim() : '';

      let models;
      let content = '';

      if (query) {
        // Search models
        models = await agent.findModels(query);
        content = `🔍 **Search Results for "${query}"**\n\n`;
        
        if (models.length === 0) {
          content += `No models found matching "${query}".\n\n`;
          content += 'Try a different search term or use `/models` to see all available models.';
          
          context.addMessage({
            role: 'system',
            content,
          });
          return;
        }
      } else {
        // List models - prioritize active provider if available
        if (activeProvider) {
          // Show only models from active provider
          const detection = await agent.detectProviders();
          const activeProviderResult = detection.find(d => d.provider === activeProvider.name);
          
          if (activeProviderResult && activeProviderResult.models) {
            models = activeProviderResult.models.map(m => ({
              ...m,
              provider: activeProvider.name
            }));
            content = `🎯 **${activeProvider.displayName} Models** (active provider)\n\n`;
          } else {
            models = await agent.listAllModels();
            content = '🎯 **All Available Models** (active provider has no models)\n\n';
          }
        } else {
          // No active provider, show all models
          models = await agent.listAllModels();
          content = '🎯 **All Available Models** (no active provider)\n\n';
        }
      }

      // Group models by provider
      const modelsByProvider = models.reduce((acc, model) => {
        if (!acc[model.provider]) {
          acc[model.provider] = [];
        }
        acc[model.provider].push(model);
        return acc;
      }, {} as Record<string, typeof models>);

      let totalModels = 0;

      for (const [providerName, providerModels] of Object.entries(modelsByProvider)) {
        content += `**${providerName.charAt(0).toUpperCase() + providerName.slice(1)} (${providerModels.length} models)**\n`;
        
        providerModels.forEach(model => {
          totalModels++;
          content += `• \`${model.id}\``;
          
          if (model.description && model.description !== model.id) {
            content += ` - ${model.description}`;
          }
          
          const details = [];
          if (model.contextLength) {
            details.push(`${Math.round(model.contextLength / 1024)}K context`);
          }
          if (model.supportsFunctions) {
            details.push('functions');
          }
          if (model.size) {
            details.push(`${Math.round(model.size / (1024 * 1024 * 1024))}GB`);
          }
          
          if (details.length > 0) {
            content += ` (${details.join(', ')})`;
          }
          
          content += '\n';
        });
        
        content += '\n';
      }

      content += `**Total**: ${totalModels} models across ${Object.keys(modelsByProvider).length} providers\n\n`;
      content += '**Commands:**\n';
      content += '• `/switch <provider>` - Switch to a specific provider\n';
      content += '• `/model <model_id>` - Switch to a specific model\n';
      if (!query) {
        content += '• `/models <search>` - Search for models\n';
      }

      context.addMessage({
        role: 'system',
        content,
      });
    } catch (error) {
      context.addMessage({
        role: 'system',
        content: `❌ Failed to list models: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  },
};

// /provider-help - Help with provider setup
export const providerHelpCommand: CommandDefinition = {
  command: 'provider-help',
  aliases: ['phelp', 'setup'],
  description: 'Get help with setting up LLM providers',
  handler: async (context: CommandContext & { agent?: Agent }) => {
    const agent = getAgent(context);
    if (!agent) {
      context.addMessage({
        role: 'system',
        content: '❌ Agent not available.',
      });
      return;
    }

    try {
      const providerManager = await agent.getProviderManager();
      
      let content = '🛠️ **Provider Setup Guide**\n\n';
      
      const providers = ['groq', 'ollama', 'lmstudio'] as const;
      
      for (const providerName of providers) {
        const provider = providerManager.getProvider(providerName);
        const requirements = provider.getConfigRequirements();
        
        content += `**${provider.displayName}**\n`;
        content += `${provider.description}\n\n`;
        
        if (requirements.required.length > 0) {
          content += `Required:\n`;
          requirements.required.forEach(req => {
            content += `• ${req}\n`;
          });
        }
        
        if (requirements.optional.length > 0) {
          content += `Optional:\n`;
          requirements.optional.forEach(opt => {
            content += `• ${opt}\n`;
          });
        }
        
        content += `Setup: ${requirements.instructions}\n\n`;
        content += '---\n\n';
      }
      
      content += '**Quick Setup:**\n';
      content += '• **Groq**: Set `GROQ_API_KEY` environment variable\n';
      content += '• **Ollama**: Install from https://ollama.ai and run `ollama serve`\n';
      content += '• **LM Studio**: Install from https://lmstudio.ai and enable local server\n\n';
      content += 'Use `/providers` to check status after setup.';

      context.addMessage({
        role: 'system',
        content,
      });
    } catch (error) {
      context.addMessage({
        role: 'system',
        content: `❌ Error getting provider help: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  },
};
