import { CommandDefinition, CommandContext } from '../base.js';
import { Agent } from '../../core/agent.js';

// Helper to get agent from context 
const getAgent = (context: any): Agent | null => {
  return context.agent || null;
};

export const sessionCommand: CommandDefinition = {
  command: 'session',
  aliases: ['sess'],
  description: 'Manage session persistence (save, restore, clear, status)',
  handler: async (context: CommandContext & { agent?: Agent }) => {
    const agent = getAgent(context);
    if (!agent) {
      context.addMessage({
        role: 'system',
        content: '❌ Agent not available for session management.',
      });
      return;
    }

    // Extract subcommand from the original command
    const fullMessage = (context as any).lastCommand || '';
    const match = fullMessage.match(/\/(?:session|sess)\s+(\w+)/i);
    const subcommand = match ? match[1].toLowerCase() : '';

    switch (subcommand) {
      case 'save':
        try {
          agent.saveCurrentSession();
          const activeProvider = await agent.getProviderManager().then(pm => pm.getActiveProvider());
          const providerName = activeProvider?.displayName || 'Unknown';
          const model = agent.getCurrentModel();
          
          context.addMessage({
            role: 'system',
            content: `💾 **Session saved successfully**\n\n**Provider**: ${providerName}\n**Model**: ${model}\n**Timestamp**: ${new Date().toLocaleString()}\n\nYour conversation will be restored automatically when you restart the CLI.`,
          });
        } catch (error) {
          context.addMessage({
            role: 'system',
            content: `❌ Failed to save session: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
        break;

      case 'restore':
        try {
          const restored = await agent.restoreLastSession();
          if (restored) {
            const activeProvider = await agent.getProviderManager().then(pm => pm.getActiveProvider());
            const providerName = activeProvider?.displayName || 'Unknown';
            const model = agent.getCurrentModel();
            
            context.addMessage({
              role: 'system',
              content: `♻️ **Session restored successfully**\n\n**Provider**: ${providerName}\n**Model**: ${model}\n\nYour previous conversation has been restored.`,
            });
            
            // Clear current history to show only restored content
            context.clearHistory();
          } else {
            context.addMessage({
              role: 'system',
              content: '📂 **No recent session found**\n\nThere is no recent session to restore (sessions expire after 24 hours).',
            });
          }
        } catch (error) {
          context.addMessage({
            role: 'system',
            content: `❌ Failed to restore session: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
        break;

      case 'clear':
        try {
          agent.clearSavedSession();
          context.addMessage({
            role: 'system',
            content: '🗑️ **Session cleared**\n\nSaved session has been deleted. Future CLI restarts will start fresh.',
          });
        } catch (error) {
          context.addMessage({
            role: 'system',
            content: `❌ Failed to clear session: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
        break;

      case 'status':
      case 'info':
        try {
          const configManager = new (await import('../../utils/local-settings.js')).ConfigManager();
          const lastSession = configManager.getLastSession();
          
          if (lastSession) {
            const sessionTime = new Date(lastSession.timestamp);
            const now = new Date();
            const hoursDiff = Math.round((now.getTime() - sessionTime.getTime()) / (1000 * 60 * 60));
            const willRestore = hoursDiff < 24;
            
            context.addMessage({
              role: 'system',
              content: `📊 **Session Status**\n\n**Last saved**: ${sessionTime.toLocaleString()}\n**Time ago**: ${hoursDiff} hours\n**Provider**: ${lastSession.provider}\n**Model**: ${lastSession.model}\n**Messages**: ${lastSession.conversationHistory?.length || 0} saved\n**Auto-restore**: ${willRestore ? '✅ Yes' : '❌ No (expired)'}\n\n${willRestore ? 'This session will be restored automatically on next CLI start.' : 'This session is too old and won\'t be restored automatically.'}`,
            });
          } else {
            context.addMessage({
              role: 'system',
              content: '📊 **Session Status**\n\n**Status**: No saved session\n**Auto-restore**: Not available\n\nNo session has been saved yet. Sessions are automatically saved after each interaction.',
            });
          }
        } catch (error) {
          context.addMessage({
            role: 'system',
            content: `❌ Failed to get session status: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
        break;

      default:
        context.addMessage({
          role: 'system',
          content: `🔄 **Session Management**\n\nUsage: \`/session <command>\`\n\n**Available commands:**\n• \`save\` - Manually save current session\n• \`restore\` - Restore last saved session\n• \`clear\` - Delete saved session\n• \`status\` - Show session information\n\n**Auto-save behavior:**\n• Sessions are saved automatically after each interaction\n• Sessions are restored automatically on CLI startup\n• Sessions expire after 24 hours\n• Only last 20 messages are saved to avoid huge files\n\n**Examples:**\n\`/session save\` - Save current state\n\`/session status\` - Check what's saved\n\`/session clear\` - Delete saved data`,
        });
    }
  }
};
