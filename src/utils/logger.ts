import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LoggerConfig {
  level: LogLevel;
  enableFileLogging: boolean;
  logFilePath?: string;
  enableColors: boolean;
  timestamp: boolean;
}

export interface ErrorWithHints {
  error: Error | string;
  hints?: string[];
  context?: Record<string, any>;
}

class Logger {
  private config: LoggerConfig;
  private logFilePath: string;
  private logFileInitialized = false;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: LogLevel.INFO,
      enableFileLogging: false,
      enableColors: true,
      timestamp: true,
      ...config
    };

    // Set default log file path if file logging is enabled
    this.logFilePath = this.config.logFilePath || path.join(process.cwd(), 'groq-cli.log');
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): { console: string; file: string } {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const levelName = levelNames[level];
    
    let baseMessage = message;
    if (data !== undefined) {
      if (typeof data === 'object') {
        baseMessage += `\n${JSON.stringify(data, null, 2)}`;
      } else {
        baseMessage += ` ${String(data)}`;
      }
    }

    // File format (no colors, with timestamp if enabled)
    let fileMessage = this.config.timestamp 
      ? `[${new Date().toISOString()}] [${levelName}] ${baseMessage}`
      : `[${levelName}] ${baseMessage}`;

    // Console format (with colors if enabled, with timestamp if enabled)
    let consoleMessage = this.config.timestamp
      ? `[${new Date().toLocaleTimeString()}] [${levelName}] ${baseMessage}`
      : `[${levelName}] ${baseMessage}`;

    if (this.config.enableColors) {
      const levelColors = {
        [LogLevel.DEBUG]: chalk.gray,
        [LogLevel.INFO]: chalk.blue,
        [LogLevel.WARN]: chalk.yellow,
        [LogLevel.ERROR]: chalk.red
      };
      consoleMessage = levelColors[level](consoleMessage);
    }

    return { console: consoleMessage, file: fileMessage };
  }

  private async initializeLogFile(): Promise<void> {
    if (!this.config.enableFileLogging || this.logFileInitialized) return;

    try {
      // Ensure log directory exists
      const logDir = path.dirname(this.logFilePath);
      await fs.promises.mkdir(logDir, { recursive: true });

      // Write session start marker
      const sessionStart = `\n=== New session started at ${new Date().toISOString()} ===\n`;
      await fs.promises.appendFile(this.logFilePath, sessionStart);
      
      this.logFileInitialized = true;
    } catch (error) {
      console.error(chalk.red('Failed to initialize log file:'), error);
    }
  }

  private async writeToFile(message: string): Promise<void> {
    if (!this.config.enableFileLogging) return;

    try {
      await this.initializeLogFile();
      await fs.promises.appendFile(this.logFilePath, message + '\n');
    } catch (error) {
      console.error(chalk.red('Failed to write to log file:'), error);
    }
  }

  debug(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const formatted = this.formatMessage(LogLevel.DEBUG, message, data);
    console.debug(formatted.console);
    this.writeToFile(formatted.file);
  }

  info(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const formatted = this.formatMessage(LogLevel.INFO, message, data);
    console.log(formatted.console);
    this.writeToFile(formatted.file);
  }

  warn(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const formatted = this.formatMessage(LogLevel.WARN, message, data);
    console.warn(formatted.console);
    this.writeToFile(formatted.file);
  }

  error(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const formatted = this.formatMessage(LogLevel.ERROR, message, data);
    console.error(formatted.console);
    this.writeToFile(formatted.file);
  }

  /**
   * Log an error with actionable hints for common issues
   */
  errorWithHints(errorInfo: ErrorWithHints): void {
    const error = typeof errorInfo.error === 'string' ? errorInfo.error : errorInfo.error.message;
    
    let message = `Error: ${error}`;
    
    if (errorInfo.context) {
      message += `\nContext: ${JSON.stringify(errorInfo.context, null, 2)}`;
    }
    
    if (errorInfo.hints && errorInfo.hints.length > 0) {
      message += '\n\nActionable hints:';
      errorInfo.hints.forEach((hint, index) => {
        message += `\n  ${index + 1}. ${hint}`;
      });
    }

    this.error(message);
  }

  /**
   * Log installation/build errors with specific actionable hints
   */
  buildError(error: Error | string, operation: 'install' | 'build' | 'compile' | 'link', context?: Record<string, any>): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    const hints = this.generateBuildHints(operation, errorMessage);
    
    this.errorWithHints({
      error,
      hints,
      context: {
        operation,
        ...context
      }
    });
  }

  /**
   * Generate actionable hints based on the operation and error message
   */
  private generateBuildHints(operation: string, errorMessage: string): string[] {
    const hints: string[] = [];
    const lowerError = errorMessage.toLowerCase();

    // Common installation issues
    if (operation === 'install') {
      if (lowerError.includes('permission denied') || lowerError.includes('eacces')) {
        hints.push('Try using npm with --prefix to install locally, or fix npm permissions');
        hints.push('Run: npm config set prefix ~/.npm-global');
      }
      if (lowerError.includes('network') || lowerError.includes('timeout') || lowerError.includes('registry')) {
        hints.push('Check your internet connection and npm registry settings');
        hints.push('Try: npm config set registry https://registry.npmjs.org/');
      }
      if (lowerError.includes('node_modules') || lowerError.includes('package-lock')) {
        hints.push('Try deleting node_modules and package-lock.json, then run npm install again');
      }
    }

    // TypeScript compilation issues
    if (operation === 'compile' || operation === 'build') {
      if (lowerError.includes('cannot find module') || lowerError.includes('module not found')) {
        hints.push('Check if all dependencies are installed: npm install');
        hints.push('Verify import paths are correct and case-sensitive');
      }
      if (lowerError.includes('typescript') || lowerError.includes('tsc')) {
        hints.push('Ensure TypeScript is installed: npm install -g typescript');
        hints.push('Check tsconfig.json for correct configuration');
      }
      if (lowerError.includes('type errors') || lowerError.includes('type')) {
        hints.push('Fix TypeScript type errors shown above');
        hints.push('Consider using // @ts-ignore as a temporary workaround');
      }
      if (lowerError.includes('out of memory') || lowerError.includes('heap')) {
        hints.push('Increase Node.js memory limit: NODE_OPTIONS="--max-old-space-size=4096"');
      }
    }

    // Linking issues
    if (operation === 'link') {
      if (lowerError.includes('permission') || lowerError.includes('eacces')) {
        hints.push('Use sudo npm link or fix npm permissions');
        hints.push('Check if the global npm directory is writable');
      }
      if (lowerError.includes('already exists') || lowerError.includes('symlink')) {
        hints.push('Unlink existing package first: npm unlink -g groq');
        hints.push('Then try npm link again');
      }
    }

    // API/Authentication issues
    if (lowerError.includes('401') || lowerError.includes('unauthorized') || lowerError.includes('api key')) {
      hints.push('Check your Groq API key is valid and properly set');
      hints.push('Use /login command to set or update your API key');
      hints.push('Verify the API key has the correct permissions');
    }

    // Generic fallback hints
    if (hints.length === 0) {
      hints.push('Check the error details above for specific issues');
      hints.push('Ensure all dependencies are installed and up to date');
      hints.push('Try clearing caches: npm cache clean --force');
    }

    return hints;
  }

  /**
   * Set log level at runtime
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Enable or disable file logging
   */
  setFileLogging(enabled: boolean, filePath?: string): void {
    this.config.enableFileLogging = enabled;
    if (filePath) {
      this.logFilePath = filePath;
      this.logFileInitialized = false; // Reset so new file gets initialized
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

// Default logger instance
export const logger = new Logger({
  level: LogLevel.INFO,
  enableFileLogging: false,
  enableColors: true,
  timestamp: true
});

// Convenience function to create a logger with specific settings
export function createLogger(config: Partial<LoggerConfig>): Logger {
  return new Logger(config);
}

// Export types for external use
export { Logger };
