<h2 align="center">
 <br>
 <img src="docs/thumbnail.png" alt="Multi-LLM Code CLI" width="400">
 <br>
 <br>
 Multi-LLM Code CLI: A highly customizable, lightweight, and open-source coding CLI with multi-provider support (Groq, Ollama, LM Studio) for instant iteration.
 <br>
</h2>

<p align="center">
 <a href="https://github.com/build-with-groq/groq-code-cli/stargazers"><img src="https://img.shields.io/github/stars/build-with-groq/groq-code-cli"></a>
 <a href="https://github.com/build-with-groq/groq-code-cli/blob/main/LICENSE">
 <img src="https://img.shields.io/badge/License-MIT-green.svg">
 </a>
</p>

<p align="center">
 <a href="#Overview">Overview</a> •
 <a href="#Installation">Installation</a> •
 <a href="#Usage">Usage</a> •
 <a href="#Development">Development</a>
</p>

<br>

https://github.com/user-attachments/assets/5902fd07-1882-4ee7-825b-50d627f8c96a

<br>

# Overview

Coding CLIs are everywhere. The Groq Code CLI is different. It is a blueprint, a building block, for developers looking to leverage, customize, and extend a CLI to be entirely their own. Leading open-source CLIs are all fantastic, inspiring for the open-source community, and hugely rich in features. However, that's just it: they are *gigantic*. Feature-rich: yes, but local development with such a large and interwoven codebase is unfriendly and overwhelming. **This is a project for developers looking to dive in.**

Groq Code CLI is your chance to make a CLI truly your own. Equipped with all of the features, tools, commands, and UI/UX that’s familiar to your current favorite CLI, we make it simple to add new features you’ve always wanted. By massively cutting down on bloat and code mass without compromising on quality, you can jump into modifying this CLI however you see fit. By leveraging models on Groq, you can iterate even faster (`/models` to see available models). Simply activate the CLI by typing `groq` in your terminal. Use Groq Code CLI in any directory just like you would with any other coding CLI. Use it in this directory to have it build and customize itself!

A few customization ideas to get started:
- New slash commands (e.g. /mcp, /deadcode, /complexity, etc.)
- Additional tools (e.g. web search, merge conflict resolver, knowledge graph builder, etc.)
- Custom start-up ASCII art
- Change the start-up command
- Anything you can think of!


## Installation

### Quick Install
```bash
# Install globally via npm
npm install -g groq-code-cli

# Or try it out without installing
npx groq-code-cli@latest
```

### For Development (Recommended)

#### Linux/macOS
```bash
git clone https://github.com/build-with-groq/groq-code-cli.git
cd groq-code-cli
./install.sh    # Automated installer with various options
```

Or manually:
```bash
npm install
npm run build
npm link        # Enables the `groq` command in any directory
```

#### Windows

**PowerShell (Recommended):**
```powershell
git clone https://github.com/build-with-groq/groq-code-cli.git
cd groq-code-cli
.\install.ps1    # Automated PowerShell installer
```

**Command Prompt/Git Bash:**
```cmd
git clone https://github.com/build-with-groq/groq-code-cli.git
cd groq-code-cli
install.bat     # Automated batch installer
```

### Auto-Dev
```bash
# Run this in the background during development to automatically apply any changes to the source code
npm run dev  
```

This watch mode automatically rebuilds the TypeScript code whenever you make changes, enabling rapid development and testing. See [docs/dev-auto.md](docs/dev-auto.md) for more details about the auto-development workflow.

### Run Instantly
```bash
# Using npx, no installation required
npx groq-code-cli@latest
```

### Install Globally
```bash
npm install -g groq-code-cli@latest
```

### Self-Update
```bash
# Update to the latest version (if installed globally)
npm update -g groq-code-cli

# Or for development installations
git pull origin main
npm install
npm run build
```

### Uninstall

#### Linux/macOS
```bash
# If installed globally
npm uninstall -g groq-code-cli

# If using development installation with automated installer
./uninstall.sh    # Automated uninstaller (with dry-run option)

# Or manually
npm unlink  # Remove the global symlink
# Then delete the cloned directory
```

#### Windows

**PowerShell:**
```powershell
# Automated uninstaller
.\uninstall.ps1    # Use -DryRun to preview what will be removed
```

**Manual removal:**
```bash
npm unlink -g groq-code-cli
# Then delete the cloned directory
```

## Usage
```bash
# Start chat session
groq
```

### Command Line Options

```bash
groq [options]

Options:
  -t, --temperature <temp>      Temperature for generation (default: 1)
  -s, --system <message>        Custom system message
  -d, --debug                   Enable debug logging to debug-agent.log in current directory
  -h, --help                    Display help
  -V, --version                 Display version number
```

### Authentication

On first use, start a chat:

```bash
groq
```

And type the `/login` command:

![Login](docs/login.png)
>Get your API key from the <strong>Groq Console</strong> [here](https://console.groq.com/keys)

This creates a .groq/ folder in your home directory that stores your API key, default model selection, and any other config you wish to add.

You can also set your API key for your current directory via environment variable:
```bash
export GROQ_API_KEY=your_api_key_here
```

### Available Commands

#### Core Commands
- `/help` - Show help and available commands
- `/login` - Login with your Groq API key (legacy support)
- `/model <model_name>` - Select your model
- `/clear` - Clear chat history and context
- `/reasoning` - Toggle display of reasoning content in messages
- `/version`, `/v` - Show current version information
- `/update` - Check for updates and upgrade to the latest version

#### 🔥 **Multi-Provider Commands**
- `/providers` - List all available LLM providers and their status
- `/switch <provider>` - Switch between Groq, Ollama, and LM Studio
- `/models [query]` - List or search models from all providers
- `/provider-help` - Setup guide for all providers

#### 🔄 **Session Management Commands**
- `/session save` - Manually save current session
- `/session restore` - Restore last saved session  
- `/session clear` - Delete saved session
- `/session status` - Show session information
- `/sess` - Alias for `/session`

> **💾 Auto-Save**: Sessions are automatically saved after each interaction and restored on startup (expire after 24 hours)

#### 🤖 **Agent Management Commands**
- `/agent [name]` - Switch to a different agent or list available agents
- `/agents` - List all available agents with details
- `/agent-create <name> <prompt>` - Create a new agent with custom system prompt
- `/agent-delete <name>` - Delete a custom agent
- `/agent-export <name> <file>` - Export an agent to a file
- `/agent-import <file>` - Import an agent from a file
- `/system <prompt>` - Set a temporary system prompt for current session
- `/system-reset` - Reset to the default system prompt

> **🌟 Quick Start**: Use `/providers` to see what's available, then `/switch ollama` to use local models!

### 🚨 Interrupt Controls

**Problem Solved**: The CLI now has robust interrupt handling for when the agent gets stuck in loops or long processes.

**Quick Reference:**
- **ESC**: Smart interrupt (context-aware)
- **Ctrl+C**: Force exit (double press if needed)
- **ESC during processing**: Interrupt AI generation
- **ESC during approval**: Reject tool execution
- **ESC while typing**: Clear input text

**When ESC Works:**
- ✅ AI is processing/thinking
- ✅ Waiting for tool approval
- ✅ Clearing input text
- ❌ Tool execution in progress (wait for completion)

📖 **For detailed interrupt documentation**, see [`docs/INTERRUPTIONS.md`](docs/INTERRUPTIONS.md).


## Development

### Testing Locally
```bash
# Run this in the background during development to automatically apply any changes to the source code
npm run dev  
```

### Available Scripts
```bash
npm run build      # Build TypeScript to dist/
npm run dev        # Build in watch mode
```

### Project Structure

```
groq-code-cli/
├── src/
│   ├── commands/           
│   │   ├── definitions/        # Individual command implementations
│   │   │   ├── clear.ts        # Clear chat history command
│   │   │   ├── help.ts         # Help command
│   │   │   ├── login.ts        # Authentication command
│   │   │   ├── model.ts        # Model selection command
│   │   │   └── reasoning.ts    # Reasoning toggle command
│   │   ├── base.ts             # Base command interface
│   │   └── index.ts            # Command exports
│   ├── core/               
│   │   ├── agent.ts            # AI agent implementation
│   │   └── cli.ts              # CLI entry point and setup
│   ├── tools/              
│   │   ├── tool-schemas.ts     # Tool schema definitions
│   │   ├── tools.ts            # Tool implementations
│   │   └── validators.ts       # Input validation utilities
│   ├── ui/                 
│   │   ├── App.tsx             # Main application component
│   │   ├── components/     
│   │   │   ├── core/           # Core chat TUI components
│   │   │   ├── display/        # Auxiliary components for TUI display
│   │   │   └── input-overlays/ # Input overlays and modals that occupy the MessageInput box
│   │   └── hooks/          
│   └── utils/              
│       ├── constants.ts        # Application constants
│       ├── file-ops.ts         # File system operations
│       ├── local-settings.ts   # Local configuration management
│       └── markdown.ts         # Markdown processing utilities
├── docs/                   
├── package.json    
├── tsconfig.json        
└── LICENSE          
```

**TL;DR:** Start with `src/core/cli.ts` (main entry point), `src/core/agent.ts`, and `src/ui/hooks/useAgent.ts` (bridge between TUI and the agent). Tools are in `src/tools/`, slash commands are in `src/commands/definitions/`, and customize the TUI in `src/ui/components/`.

### Customization

#### Adding New Tools

Tools are AI-callable functions that extend the CLI's capabilities. To add a new tool:

1. **Define the tool schema** in `src/tools/tool-schemas.ts`:
```typescript
export const YOUR_TOOL_SCHEMA: ToolSchema = {
  type: 'function',
  function: {
    name: 'your_tool_name',
    description: 'What your tool does',
    parameters: {
      type: 'object',
      properties: {
        param1: { type: 'string', description: 'Parameter description' }
      },
      required: ['param1']
    }
  }
};
```

2. **Implement the tool function** in `src/tools/tools.ts`:
```typescript
export async function yourToolName(param1: string): Promise<ToolResult> {
  // Your implementation here
  return createToolResponse(true, result, 'Success message');
}
```

3. **Register the tool** in the `TOOL_REGISTRY` object and `executeTool` switch statement in `src/tools/tools.ts`.

4. **Add the schema** to `ALL_TOOL_SCHEMAS` array in `src/tools/tool-schemas.ts`.

#### Adding New Slash Commands

Slash commands provide direct user interactions. To add a new command:

1. **Create command definition** in `src/commands/definitions/your-command.ts`:
```typescript
import { CommandDefinition, CommandContext } from '../base.js';

export const yourCommand: CommandDefinition = {
  command: 'yourcommand',
  description: 'What your command does',
  handler: ({ addMessage }: CommandContext) => {
    // Your command logic here
    addMessage({
      role: 'system',
      content: 'Command response'
    });
  }
};
```

2. **Register the command** in `src/commands/index.ts` by importing it and adding to the `availableCommands` array.

#### Changing Start Command
To change the start command from `groq`, change `"groq"` in `"bin"` of `package.json` to your global command of choice.

Re-run `npm run build` and `npm link`.


## Contributing and Support

Improvements through PRs are welcome!

For issues and feature requests, please open an issue on GitHub.

#### Share what you create with Groq on our [socials](https://x.com/GroqInc)!

### Featured Community Creations
- [OpenRouter Support](https://github.com/rahulvrane/groq-code-cli-openrouter) - rahulvrane
