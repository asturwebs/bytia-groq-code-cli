# Auto-Development Workflow

The Groq Code CLI provides an efficient auto-development workflow that streamlines the development process by automatically rebuilding and applying changes as you code.

## Overview

The `npm run dev` command enables a watch mode that monitors your TypeScript source files and automatically rebuilds the project whenever changes are detected. This eliminates the need to manually run build commands after each change, significantly speeding up the development cycle.

## Getting Started

### 1. Initial Setup
```bash
# Clone and set up the project
git clone https://github.com/build-with-groq/groq-code-cli.git
cd groq-code-cli
npm install
npm run build
npm link
```

### 2. Enable Auto-Development
```bash
# Start the watch mode (run this in a separate terminal)
npm run dev
```

This command will:
- Build the TypeScript code to the `dist/` directory
- Watch for changes in the `src/` directory
- Automatically rebuild when files are modified
- Apply changes immediately to the linked CLI

## Development Workflow

### Typical Development Session
1. **Start Watch Mode**: Open a terminal and run `npm run dev`
2. **Make Changes**: Edit files in the `src/` directory
3. **Test Immediately**: Changes are automatically built and available via the `groq` command
4. **Iterate Rapidly**: Continue editing - no manual build steps required

### File Watching Behavior
The watch mode monitors:
- All TypeScript files in `src/` and subdirectories
- Configuration files that affect the build
- Automatically handles new files and deleted files

### What Happens During Auto-Rebuild
1. **Change Detection**: The watcher detects file modifications
2. **TypeScript Compilation**: Source files are compiled to JavaScript
3. **Module Resolution**: Dependencies and imports are resolved
4. **Output Generation**: Compiled files are written to `dist/`
5. **CLI Update**: The linked `groq` command immediately uses the new build

## Development Tips

### Testing Your Changes
```bash
# In a separate terminal, test your changes
groq

# Or test specific features
groq --help
groq --version
```

### Debugging During Development
```bash
# Enable debug logging while developing
groq --debug

# This creates debug-agent.log in the current directory
tail -f debug-agent.log  # Monitor logs in real-time
```

### Working with Different Components

#### Adding New Tools
1. Edit `src/tools/tool-schemas.ts` - changes are automatically compiled
2. Edit `src/tools/tools.ts` - implementation updates immediately
3. Test with `groq` - your new tool is available instantly

#### Adding New Commands
1. Create file in `src/commands/definitions/` - automatically detected
2. Update `src/commands/index.ts` - registration is immediate
3. Test with `groq` and use `/your-command`

#### UI/UX Changes
1. Edit React components in `src/ui/` - changes rebuild automatically
2. Modify styles or layouts - immediately visible
3. Test interaction changes with `groq`

## Advanced Usage

### Multiple Development Sessions
You can run multiple development workflows simultaneously:
```bash
# Terminal 1: Main development watch
npm run dev

# Terminal 2: Test the CLI
groq

# Terminal 3: Monitor debug logs
tail -f debug-agent.log
```

### Working with External Dependencies
When adding new dependencies:
```bash
# Install new dependency
npm install new-package

# Restart the watch mode to pick up new dependencies
# Press Ctrl+C to stop, then:
npm run dev
```

### Build Artifacts
The watch mode creates the same output as `npm run build`:
- Compiled JavaScript in `dist/`
- Source maps for debugging
- Type definitions if generated

## Troubleshooting

### Watch Mode Not Detecting Changes
```bash
# Restart the watch mode
# Press Ctrl+C, then:
npm run dev
```

### Changes Not Appearing in CLI
```bash
# Ensure the CLI is properly linked
npm unlink
npm link

# Or check if you have multiple versions installed
npm list -g groq-code-cli
```

### Performance Issues
The watch mode is optimized for performance, but for very large projects:
- Only modified files are recompiled
- Incremental compilation reduces build times
- File system polling is optimized

### Memory Usage
Watch mode keeps file system watchers active. If you encounter memory issues:
```bash
# Stop watch mode when not actively developing
# Press Ctrl+C to stop npm run dev
```

## Integration with IDEs

### VS Code
The auto-development workflow works seamlessly with VS Code:
- IntelliSense updates automatically as you type
- Error highlighting reflects real build issues
- Integrated terminal can run `npm run dev`

### Other IDEs
Any editor that supports TypeScript will work well with this workflow:
- File watching is handled by the npm script, not the IDE
- Compilation errors appear in the terminal running `npm run dev`
- Changes take effect regardless of which editor you use

## Best Practices

1. **Keep Watch Mode Running**: Leave `npm run dev` running during your entire development session
2. **Test Frequently**: Since changes are immediate, test features as you build them
3. **Monitor the Terminal**: Watch the build output for compilation errors
4. **Use Debug Mode**: Enable `--debug` when developing new features
5. **Restart When Needed**: Restart watch mode when adding new dependencies or making major structural changes

This auto-development workflow enables rapid iteration and testing, making it easy to customize and extend the Groq Code CLI to fit your exact needs.
