# Self-Update Commands

## Overview
The Groq Code CLI now includes self-update capability with two new commands:

## `/version` Command
- **Aliases**: `/v`
- **Description**: Show current version information
- **Usage**: Type `/version` or `/v` in the CLI

### Example:
```
/version
```
Output:
```
Groq Code CLI version: 1.0.2

Type '/update' to check for updates and upgrade to the latest version.
```

## `/update` Command  
- **Description**: Check for updates and upgrade to the latest version
- **Usage**: Type `/update` in the CLI

### Example:
```
/update
```

### Behavior:
1. **Checking for updates**: Contacts `https://registry.npmjs.org/groq-code-cli/latest` to get the latest published version
2. **Version comparison**: Compares the current version (from `package.json`) with the latest available version
3. **No update available**: Shows a message that you're already on the latest version
4. **Update available**: Automatically runs `npm install -g groq-code-cli@latest` to update
5. **Success**: Shows success message and prompts to restart the CLI
6. **Failure**: Shows error message and suggests running with elevated privileges if needed

### Sample Outputs:

**No update available:**
```
You are already using the latest version (1.0.2).
```

**Update available and successful:**
```
Update available!

Current version: 1.0.2
Latest version: 1.0.3

Starting update...
Installing groq-code-cli@1.0.3...
✅ Successfully updated to version 1.0.3!

Please restart the CLI to use the new version.
You can exit with Ctrl+C and run 'groq' again.
```

**Update failed:**
```
❌ Update failed with exit code 1.

Error output:
npm ERR! code EACCES
npm ERR! syscall access
...

You may need to run the update command with elevated privileges:
sudo npm install -g groq-code-cli@1.0.3
```

## Implementation Details

### Files Added:
- `src/utils/version.ts` - Version utility functions
- `src/commands/definitions/version.ts` - Version command implementation  
- `src/commands/definitions/update.ts` - Update command implementation

### Files Modified:
- `src/commands/base.ts` - Added aliases support to CommandDefinition interface
- `src/commands/index.ts` - Added new commands and alias support to command handler
- `src/commands/definitions/help.ts` - Updated to show command aliases
- `src/core/cli.ts` - Updated to use dynamic version from package.json

### Key Features:
- **Dynamic version reading**: Reads version from `package.json` at runtime
- **NPM Registry API**: Uses the official NPM registry API to check for latest versions
- **Semantic version comparison**: Compares versions using semantic versioning rules
- **Automatic update**: Spawns npm install process to perform the update
- **Error handling**: Comprehensive error handling and user feedback
- **Command aliases**: Supports `/v` as an alias for `/version`
- **Help integration**: Shows aliases in help command output

### Error Handling:
- Network connectivity issues when checking for updates
- NPM registry API failures
- Permission issues during global package installation
- Invalid version formats
- File system access issues when reading package.json

The commands are fully integrated into the existing slash command system and follow the same patterns as other CLI commands.
