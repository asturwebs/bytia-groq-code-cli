import { CommandDefinition, CommandContext } from '../base.js';
import { Agent } from '../../core/agent.js';

// Helper to get agent from context 
const getAgent = (context: any): Agent | null => {
  return context.agent || null;
};

// Global flag to prevent multiple simultaneous executions
let isProcessingModelCommand = false;

export const modelCommand: CommandDefinition = {
  command: 'model',
  description: 'Switch to a specific model or show model selector',
  handler: async (context: CommandContext & { agent?: Agent }) => {
    // Prevent multiple simultaneous executions
    if (isProcessingModelCommand) {
      return;
    }
    isProcessingModelCommand = true;
    
    try {
    const agent = getAgent(context);
    if (!agent) {
      context.addMessage({
        role: 'system',
        content: '❌ Agent not available for model management.',
      });
      return;
    }

    // Extract model name from the original command if provided
    const fullMessage = (context as any).lastCommand || '';
    const match = fullMessage.match(/\/model\s+(.+)/i);
    const modelName = match ? match[1].trim() : '';

    if (modelName) {
      // Direct model switch
      try {
        // First, check if the model exists in available models
        const allModels = await agent.listAllModels();
        const targetModel = allModels.find(m => 
          m.id.toLowerCase() === modelName.toLowerCase() || 
          m.id.toLowerCase().includes(modelName.toLowerCase())
        );

        if (!targetModel) {
          context.addMessage({
            role: 'system',
            content: `❌ **Model not found**: "${modelName}"\n\nThe specified model was not found in any available provider. Use \`/models\` to see all available models or \`/models ${modelName}\` to search for similar models.`,
          });
          return;
        }

        // Switch to the provider of this model first
        const switchResult = await agent.switchProvider(targetModel.provider);
        if (!switchResult.success) {
          context.addMessage({
            role: 'system',
            content: `❌ **Failed to switch provider**: ${switchResult.message}\n\nCannot switch to provider "${targetModel.provider}" required for model "${targetModel.id}".`,
          });
          return;
        }

        // Now switch to the model
        await agent.setModel(targetModel.id);
        
        context.addMessage({
          role: 'system',
          content: `🎯 **Model switched successfully**\n\n**Model**: ${targetModel.id}\n**Provider**: ${targetModel.provider}\n${targetModel.description ? `**Description**: ${targetModel.description}\n` : ''}\nYour chat history has been preserved.`,
        });
        
      } catch (error) {
        context.addMessage({
          role: 'system',
          content: `❌ Error switching model: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    } else {
      // No model specified, show legacy model selector for backward compatibility
      // But warn that it's deprecated
      context.addMessage({
        role: 'system',
        content: '⚠️ **Legacy Model Selector**\n\nYou\'re using the old Groq-only model selector. For better experience with all providers, use:\n\n• `/models` - List all available models\n• `/model <model_name>` - Switch directly to a specific model\n• `/switch <provider>` - Switch provider first\n\nContinuing with legacy selector...',
      });
      
      if (context.setShowModelSelector) {
        context.setShowModelSelector(true);
      }
    }
    } finally {
      isProcessingModelCommand = false;
    }
  }
};
