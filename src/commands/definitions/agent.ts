import { CommandDefinition, CommandContext } from '../base.js';
import { AgentManager } from '../../utils/agent-manager.js';

export const agentCommand: CommandDefinition = {
  command: 'agent',
  description: 'Switch to a different agent or manage agents',
  aliases: ['a'],
  handler: ({ addMessage }: CommandContext) => {
    const agentManager = AgentManager.getInstance();
    const agents = agentManager.listAgents();
    const current = agentManager.getCurrentAgent();

    let agentList = `🤖 **Available Agents:**\n\n`;
    
    agents.forEach(agent => {
      const isCurrent = agent.name === current.name ? '**→ ' : '   ';
      const endMarker = agent.name === current.name ? ' ← CURRENT**' : '';
      const lastUsed = agent.lastUsed ? 
        ` (used: ${agent.lastUsed.toLocaleDateString()})` : '';
      
      agentList += `${isCurrent}\`${agent.name}\`${endMarker} - ${agent.description}${lastUsed}\n`;
    });

    agentList += `\n📋 **Agent Commands:**\n`;
    agentList += `• \`/agent <name>\` - Switch to agent\n`;
    agentList += `• \`/agent-create <name> <prompt>\` - Create new agent\n`;
    agentList += `• \`/agent-delete <name>\` - Delete agent\n`;
    agentList += `• \`/agents\` - List all agents\n`;
    agentList += `• \`/system <prompt>\` - Set temporary system prompt\n`;
    agentList += `• \`/system-reset\` - Reset to default system prompt\n`;

    addMessage({
      role: 'system',
      content: agentList,
    });
  }
};

export const agentsCommand: CommandDefinition = {
  command: 'agents',
  description: 'List all available agents',
  handler: ({ addMessage }: CommandContext) => {
    const agentManager = AgentManager.getInstance();
    const agents = agentManager.listAgents();
    const current = agentManager.getCurrentAgent();

    let agentList = `🤖 **All Agents (${agents.length}):**\n\n`;
    
    agents.forEach((agent, index) => {
      const isCurrent = agent.name === current.name ? '**→ ' : `${index + 1}. `;
      const endMarker = agent.name === current.name ? ' ← CURRENT**' : '';
      
      agentList += `${isCurrent}\`${agent.name}\`${endMarker}\n`;
      agentList += `   ${agent.description}\n`;
      if (agent.temperature !== undefined) {
        agentList += `   Temperature: ${agent.temperature} | Model: ${agent.model || 'default'}\n`;
      }
      if (agent.lastUsed) {
        agentList += `   Last used: ${agent.lastUsed.toLocaleDateString()} at ${agent.lastUsed.toLocaleTimeString()}\n`;
      }
      agentList += `\n`;
    });

    addMessage({
      role: 'system',
      content: agentList,
    });
  }
};

export const agentCreateCommand: CommandDefinition = {
  command: 'agent-create',
  description: 'Create a new agent with custom system prompt',
  aliases: ['ac'],
  handler: ({ addMessage }: CommandContext) => {
    addMessage({
      role: 'system',
      content: `🤖 **Create New Agent**

**Usage:** \`/agent-create <name> <system_prompt>\`

**Example:**
\`/agent-create security "You are a cybersecurity expert focused on finding vulnerabilities and security best practices..."\`

**Tips:**
• Use quotes for multi-word prompts
• Agent names will be normalized (lowercase, underscores)
• Include tool usage instructions in your prompt
• Specify temperature and model preferences in the prompt

**Quick Templates:**
• \`/agent-create reviewer "You are a code reviewer..."\`
• \`/agent-create teacher "You are a patient coding instructor..."\`
• \`/agent-create optimizer "You are a performance optimization expert..."\`

After creation, use \`/agent <name>\` to switch to your new agent.`,
    });
  }
};

export const agentDeleteCommand: CommandDefinition = {
  command: 'agent-delete',
  description: 'Delete a custom agent',
  aliases: ['ad'],
  handler: ({ addMessage }: CommandContext) => {
    addMessage({
      role: 'system',
      content: `🗑️ **Delete Agent**

**Usage:** \`/agent-delete <name>\`

**Example:**
\`/agent-delete my_custom_agent\`

**Note:** You cannot delete the 'default' agent. Use \`/agents\` to see which agents can be deleted.

⚠️ **Warning:** This action cannot be undone. Consider exporting the agent first with \`/agent-export <name> <file>\` if you might want to restore it later.`,
    });
  }
};

export const systemCommand: CommandDefinition = {
  command: 'system',
  description: 'Set a temporary system prompt for the current session',
  aliases: ['sys'],
  handler: ({ addMessage }: CommandContext) => {
    addMessage({
      role: 'system',
      content: `⚙️ **Temporary System Prompt**

**Usage:** \`/system <your_custom_prompt>\`

**Example:**
\`/system "You are a Python expert focused on data science and machine learning. Always provide working code examples and explain complex concepts clearly."\`

**Features:**
• Changes system prompt for the current session only
• Maintains all tool access and CLI functionality
• Does not save permanently (use \`/agent-create\` for that)
• Use \`/system-reset\` to return to default

**When to use:**
• Quick prompt tweaks for specific tasks
• Testing new prompt ideas before creating an agent
• One-time specialized assistance
• Experimenting with different AI personalities

**Pro tip:** Combine with model switching (\`/model\`) for complete customization!`,
    });
  }
};

export const systemResetCommand: CommandDefinition = {
  command: 'system-reset',
  description: 'Reset to the default system prompt',
  aliases: ['sr'],
  handler: ({ addMessage }: CommandContext) => {
    const agentManager = AgentManager.getInstance();
    agentManager.resetToDefault();
    
    addMessage({
      role: 'system',
      content: `🔄 **System prompt reset to default**

You are now using the default coding assistant agent with full tool access and standard behavior.

To switch to a different agent, use \`/agent <name>\` or create a new one with \`/agent-create\`.`,
    });
  }
};

export const agentExportCommand: CommandDefinition = {
  command: 'agent-export',
  description: 'Export an agent to a file',
  aliases: ['ae'],
  handler: ({ addMessage }: CommandContext) => {
    addMessage({
      role: 'system',
      content: `📤 **Export Agent**

**Usage:** \`/agent-export <agent_name> <file_path>\`

**Example:**
\`/agent-export reviewer ./my-reviewer-agent.json\`

**Features:**
• Saves agent configuration to JSON file
• Includes system prompt, settings, and metadata
• Can be shared with other users
• Use \`/agent-import\` to load exported agents

**Use cases:**
• Backup your custom agents
• Share agents with team members
• Version control your AI configurations
• Transfer agents between machines`,
    });
  }
};

export const agentImportCommand: CommandDefinition = {
  command: 'agent-import',
  description: 'Import an agent from a file',
  aliases: ['ai'],
  handler: ({ addMessage }: CommandContext) => {
    addMessage({
      role: 'system',
      content: `📥 **Import Agent**

**Usage:** \`/agent-import <file_path>\`

**Example:**
\`/agent-import ./shared-agent.json\`

**Features:**
• Loads agent from JSON file
• Automatically validates agent format
• Adds imported agent to your collection
• Overwrites existing agents with same name

**File format:** JSON with required fields:
• \`name\` - Agent identifier
• \`systemPrompt\` - The AI instructions
• \`description\` - Human-readable description
• Optional: \`model\`, \`temperature\`, metadata

After import, use \`/agent <name>\` to switch to the imported agent.`,
    });
  }
};
