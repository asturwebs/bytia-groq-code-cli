import { CommandDefinition, CommandContext } from '../base.js';
import { getCurrentVersion } from '../../utils/version.js';

export const versionCommand: CommandDefinition = {
  command: 'version',
  aliases: ['v'],
  description: 'Show current version information',
  handler: ({ addMessage }: CommandContext) => {
    const currentVersion = getCurrentVersion();
    
    addMessage({
      role: 'system',
      content: `Groq Code CLI version: ${currentVersion}

Type '/update' to check for updates and upgrade to the latest version.`
    });
  }
};
