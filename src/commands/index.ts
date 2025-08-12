import { CommandDefinition, CommandContext } from './base.js';
import { helpCommand } from './definitions/help.js';
import { loginCommand } from './definitions/login.js';
import { modelCommand } from './definitions/model.js';
import { clearCommand } from './definitions/clear.js';
import { reasoningCommand } from './definitions/reasoning.js';
import { updateCommand } from './definitions/update.js';
import { versionCommand } from './definitions/version.js';
import { 
  agentCommand, 
  agentsCommand, 
  agentCreateCommand, 
  agentDeleteCommand, 
  systemCommand, 
  systemResetCommand,
  agentExportCommand,
  agentImportCommand
} from './definitions/agent.js';
import {
  providersCommand,
  switchCommand,
  modelsCommand,
  providerHelpCommand
} from './definitions/providers.js';
import { sessionCommand } from './definitions/session.js';
import { AgentManager } from '../utils/agent-manager.js';

const availableCommands: CommandDefinition[] = [
  helpCommand,
  loginCommand,
  modelCommand,
  clearCommand,
  reasoningCommand,
  updateCommand,
  versionCommand,
  // Session management
  sessionCommand,
  // Agent management commands
  agentCommand,
  agentsCommand,
  agentCreateCommand,
  agentDeleteCommand,
  systemCommand,
  systemResetCommand,
  agentExportCommand,
  agentImportCommand,
  // Provider management commands
  providersCommand,
  switchCommand,
  modelsCommand,
  providerHelpCommand,
];

export function getAvailableCommands(): CommandDefinition[] {
  return [...availableCommands];
}

export function getCommandNames(): string[] {
  return getAvailableCommands().map(cmd => cmd.command);
}

export function handleSlashCommand(
  command: string, 
  context: CommandContext
) {
  // Extract the command part, everything up to the first space or end of string
  const fullCommand = command.slice(1);
  const spaceIndex = fullCommand.indexOf(' ');
  const cmd = spaceIndex > -1 ? fullCommand.substring(0, spaceIndex).toLowerCase() : fullCommand.toLowerCase();
  const args = spaceIndex > -1 ? fullCommand.substring(spaceIndex + 1).trim() : '';
  
  // Add user message for the command
  context.addMessage({
    role: 'user',
    content: command,
  });
  
  // Store the full command in context for provider commands to access
  (context as any).lastCommand = command;
  
  // Handle agent commands with arguments
  if (handleAgentCommands(cmd, args, context)) {
    return;
  }
  
  // Handle provider commands with arguments
  if (handleProviderCommands(cmd, args, context)) {
    return;
  }
  
  const commandDef = getAvailableCommands().find(c => 
    c.command === cmd || (c.aliases && c.aliases.includes(cmd))
  );
  
  if (commandDef) {
    commandDef.handler(context);
  } else {
    context.addMessage({
      role: 'system',
      content: `❌ Unknown command: /${cmd}\n\nUse \`/help\` to see available commands.`,
    });
  }
}

/**
 * Maneja comandos de agentes con argumentos
 */
function handleAgentCommands(cmd: string, args: string, context: CommandContext): boolean {
  const agentManager = AgentManager.getInstance();
  
  switch (cmd) {
    case 'agent':
    case 'a':
      if (args) {
        // Switch to specific agent
        const agentName = args.toLowerCase();
        if (agentManager.setCurrentAgent(agentName)) {
          context.addMessage({
            role: 'system',
            content: `🤖 Switched to agent: **${agentName}**\n\nYou are now using the ${agentName} agent profile. Use \`/agents\` to see all available agents.`,
          });
        } else {
          context.addMessage({
            role: 'system',
            content: `❌ Agent '${agentName}' not found.\n\nUse \`/agents\` to see available agents or \`/agent-create ${agentName} "prompt"\` to create it.`,
          });
        }
        return true;
      }
      return false; // Let the regular handler show the help
      
    case 'agent-create':
    case 'ac':
      if (args) {
        const parts = args.match(/^(\S+)\s+(.+)$/);
        if (parts && parts.length >= 3) {
          const [, name, prompt] = parts;
          const cleanPrompt = prompt.replace(/^["']|["']$/g, ''); // Remove quotes
          const agent = agentManager.createAgent(name, cleanPrompt);
          context.addMessage({
            role: 'system',
            content: `✅ Created agent: **${agent.name}**\n\n${agent.description}\n\nUse \`/agent ${agent.name}\` to switch to this agent.`,
          });
        } else {
          context.addMessage({
            role: 'system',
            content: `❌ Invalid format. Use: \`/agent-create <name> <prompt>\`\n\nExample: \`/agent-create security "You are a cybersecurity expert..."\``,
          });
        }
        return true;
      }
      return false;
      
    case 'agent-delete':
    case 'ad':
      if (args) {
        const agentName = args.toLowerCase();
        if (agentManager.deleteAgent(agentName)) {
          context.addMessage({
            role: 'system',
            content: `🗑️ Deleted agent: **${agentName}**\n\nIf you were using this agent, you've been switched back to the default agent.`,
          });
        } else {
          context.addMessage({
            role: 'system',
            content: `❌ Could not delete agent '${agentName}'. It may not exist or be undeletable (like 'default').\n\nUse \`/agents\` to see available agents.`,
          });
        }
        return true;
      }
      return false;
      
    case 'system':
    case 'sys':
      if (args) {
        const cleanPrompt = args.replace(/^["']|["']$/g, ''); // Remove quotes
        agentManager.setTemporarySystemPrompt(cleanPrompt);
        context.addMessage({
          role: 'system',
          content: `⚙️ **Temporary system prompt set for this session**\n\n✨ Your custom prompt is now active and will be used for all subsequent interactions.\n\nUse \`/system-reset\` to return to default, or \`/agent-create\` to save this as a permanent agent.`,
        });
        
        // Important: Clear history so new prompt takes effect
        context.clearHistory();
        return true;
      }
      return false;
      
    case 'agent-export':
    case 'ae':
      if (args) {
        const parts = args.match(/^(\S+)\s+(.+)$/);
        if (parts && parts.length >= 3) {
          const [, agentName, filePath] = parts;
          if (agentManager.exportAgent(agentName, filePath)) {
            context.addMessage({
              role: 'system',
              content: `📤 **Agent exported successfully**\n\nAgent '${agentName}' has been saved to: \`${filePath}\`\n\nYou can now share this file or import it on another machine using \`/agent-import ${filePath}\`.`,
            });
          } else {
            context.addMessage({
              role: 'system',
              content: `❌ Could not export agent '${agentName}'. Agent may not exist.\n\nUse \`/agents\` to see available agents.`,
            });
          }
        } else {
          context.addMessage({
            role: 'system',
            content: `❌ Invalid format. Use: \`/agent-export <agent_name> <file_path>\`\n\nExample: \`/agent-export reviewer ./my-agent.json\``,
          });
        }
        return true;
      }
      return false;
      
    case 'agent-import':
    case 'ai':
      if (args) {
        const filePath = args.trim();
        const agent = agentManager.importAgent(filePath);
        if (agent) {
          context.addMessage({
            role: 'system',
            content: `📥 **Agent imported successfully**\n\nAgent '${agent.name}' has been imported: ${agent.description}\n\nUse \`/agent ${agent.name}\` to switch to this agent.`,
          });
        } else {
          context.addMessage({
            role: 'system',
            content: `❌ Could not import agent from '${filePath}'. File may not exist or have invalid format.\n\nExpected JSON format with required fields: name, systemPrompt, description.`,
          });
        }
        return true;
      }
      return false;
      
    default:
      return false; // Not an agent command
  }
}

/**
 * Maneja comandos de proveedores con argumentos
 */
function handleProviderCommands(cmd: string, args: string, context: CommandContext): boolean {
  switch (cmd) {
    case 'switch':
    case 'sw':
    case 'provider':
      if (args) {
        // Let the provider command handle the switch
        switchCommand.handler(context);
        return true;
      }
      return false; // Let the regular handler show the help
      
    case 'models':
    case 'm':
    case 'model-list':
      // Let the models command handle search or listing
      modelsCommand.handler(context);
      return true;
      
    case 'model':
      // Handle both /model (legacy) and /model <name> (new)
      // Let the updated model command handle both cases
      modelCommand.handler(context);
      return true;
      
    default:
      return false; // Not a provider command
  }
}

export { CommandDefinition, CommandContext } from './base.js';
