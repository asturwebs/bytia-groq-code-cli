import { CommandDefinition, CommandContext } from '../base.js';
import { getAvailableCommands } from '../index.js';

export const helpCommand: CommandDefinition = {
  command: 'help',
  description: 'Show help and available commands',
  handler: ({ addMessage }: CommandContext) => {
    const commands = getAvailableCommands();
    const commandList = commands.map(cmd => {
      const aliases = cmd.aliases ? ` (aliases: ${cmd.aliases.map(a => `/${a}`).join(', ')})` : '';
      return `/${cmd.command}${aliases} - ${cmd.description}`;
    }).join('\n');
    
    const agentCommandsHelp = `

🤖 **Agent System Commands:**
• \`/agent <name>\` - Switch to specific agent
• \`/agents\` - List all available agents  
• \`/agent-create <name> <prompt>\` - Create new agent
• \`/agent-delete <name>\` - Delete custom agent
• \`/system <prompt>\` - Set temporary system prompt
• \`/system-reset\` - Reset to default prompt
• \`/agent-export <name> <file>\` - Export agent to file
• \`/agent-import <file>\` - Import agent from file

🎯 **Pre-built Agents:**
• \`reviewer\` - Code review specialist
• \`architect\` - System design expert
• \`debugger\` - Bug finding specialist  
• \`teacher\` - Educational mentor
• \`optimizer\` - Performance expert`;

    addMessage({
      role: 'system',
      content: `Available Commands:
${commandList}${agentCommandsHelp}

Navigation:
- Use arrow keys to navigate chat history
- Type '/' to see available slash commands
- Use arrow keys to navigate slash command suggestions
- Press Enter to execute the selected command

Keyboard Shortcuts:
- **ESC** - Smart interrupt control:
  • Clear input text when typing
  • Interrupt AI processing (not tool execution)
  • Reject tool approval when prompted
  • Show this help when nothing else applies
- **Ctrl+C** - Force exit the CLI (double press if needed)
- **Shift+Tab** - Toggle auto-approval for editing tools

🚨 **Interrupt Guide:**
• **Safe to interrupt**: AI thinking, generating responses
• **Cannot interrupt**: Tool execution in progress
• **ESC doesn't work?** Try Ctrl+C for immediate exit
• **In infinite loop?** ESC during "Processing..." state

This is a highly customizable, lightweight, and open-source coding CLI powered by Groq. Ask for help with coding tasks, debugging issues, or explaining code.`
    });
  }
};