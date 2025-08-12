# Logging System

The Groq Code CLI now includes a comprehensive logging system with multiple levels and actionable error hints.

## Features

- **Multiple log levels**: DEBUG, INFO, WARN, ERROR
- **Console and file logging**: Optional file output with timestamps
- **Colored output**: Different colors for different log levels
- **Actionable error hints**: Specific suggestions for common build/install errors
- **Build error handling**: Specialized logging for TypeScript compilation, npm linking, and installation errors

## Usage

### Basic Logging

```typescript
import { logger, LogLevel } from '../utils/logger.js';

// Basic logging
logger.debug('Detailed debugging information');
logger.info('General information');
logger.warn('Warning message');
logger.error('Error message');
```

### Configuration

```typescript
// Set log level (only messages at or above this level will be shown)
logger.setLevel(LogLevel.DEBUG);

// Enable file logging
logger.setFileLogging(true, 'my-app.log');

// Disable colors (for programmatic output)
const customLogger = createLogger({
  level: LogLevel.INFO,
  enableColors: false,
  timestamp: true
});
```

### Build Error Handling

The logger provides specialized handling for build/install errors with actionable hints:

```typescript
// TypeScript compilation error with hints
logger.buildError(
  new Error('Cannot find module "react"'),
  'compile',
  { file: 'src/App.tsx', line: 1 }
);

// npm link permission error with hints  
logger.buildError(
  'EACCES: permission denied, symlink',
  'link',
  { target: '/usr/local/bin/groq' }
);

// Installation error with hints
logger.buildError(
  'EACCES: permission denied, mkdir',
  'install', 
  { package: 'typescript' }
);
```

### Custom Error Hints

```typescript
logger.errorWithHints({
  error: 'Custom error occurred',
  hints: [
    'Check your configuration file',
    'Try restarting the service',
    'Contact support if the issue persists'
  ],
  context: {
    userId: 123,
    action: 'deployment'
  }
});
```

## Automatic Hint Generation

The logger automatically generates actionable hints based on error messages and operation types:

### Installation Issues
- Permission errors → npm permission fixes
- Network errors → registry configuration
- Module conflicts → cache clearing

### TypeScript Compilation
- Module not found → dependency installation
- Type errors → type checking suggestions
- Memory issues → Node.js memory limits

### npm Linking
- Permission errors → sudo usage or permission fixes
- Symlink conflicts → unlink and retry suggestions

### API Issues
- 401 errors → API key validation steps
- Network errors → connectivity troubleshooting

## Integration with CLI

The logging system is automatically configured based on CLI flags:

```bash
# Enable debug logging
groq --debug

# Regular operation (INFO level)
groq
```

When debug mode is enabled:
- Log level is set to DEBUG
- File logging is enabled (`groq-cli-debug.log`)
- All operations are logged with detailed context

## Log File Format

Log files contain timestamps and structured data:

```
[2023-08-12T16:25:20.239Z] [INFO] CLI initialized successfully
[2023-08-12T16:25:20.240Z] [ERROR] Build failed
Context: {
  "operation": "compile",
  "exitCode": 1,
  "output": "error TS2307: Cannot find module 'react'"
}

Actionable hints:
  1. Check if all dependencies are installed: npm install
  2. Verify import paths are correct and case-sensitive
```

## Best Practices

1. **Use appropriate log levels**:
   - DEBUG: Detailed diagnostic information
   - INFO: General operational messages
   - WARN: Issues that don't prevent operation
   - ERROR: Serious problems that need attention

2. **Include context**: Provide relevant data with error messages

3. **Use build error logging**: For install/build/compile operations, use `buildError()` for better user experience

4. **File logging in production**: Enable file logging for debugging production issues

5. **Structured logging**: Include relevant context objects with log messages
