#!/usr/bin/env tsx

import chokidar from 'chokidar';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { logger, LogLevel } from '../src/utils/logger.js';

interface BuildResult {
  success: boolean;
  output: string;
  error?: string;
}

class DevAutoWatcher {
  private logPath: string;
  private isBuilding = false;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private readonly debounceDelay = 300; // ms

  constructor() {
    this.logPath = join(process.cwd(), 'scripts', 'dev-auto.log');
    // Enable file logging for the dev watcher
    logger.setFileLogging(true, this.logPath);
    logger.setLevel(LogLevel.DEBUG);
  }

  /**
   * Initialize the log file and ensure scripts directory exists
   */
  private async initializeLog(): Promise<void> {
    try {
      await fs.mkdir(join(process.cwd(), 'scripts'), { recursive: true });
      logger.info('Dev Auto Watcher log directory initialized');
    } catch (error) {
      logger.error('Failed to initialize log directory', error);
    }
  }

  /**
   * Execute TypeScript compilation
   */
  private async runTypeScriptCompilation(): Promise<BuildResult> {
    return new Promise((resolve) => {
      logger.info('🔧 Starting TypeScript compilation...');
      
      const tsc = spawn('npx', ['tsc', '-p', '.', '--pretty', 'false'], {
        stdio: 'pipe',
        shell: true,
      });

      let output = '';
      let error = '';

      tsc.stdout?.on('data', (data) => {
        output += data.toString();
      });

      tsc.stderr?.on('data', (data) => {
        error += data.toString();
      });

      tsc.on('close', (code) => {
        if (code === 0) {
          logger.info('✅ TypeScript compilation successful');
          resolve({ success: true, output });
        } else {
          logger.buildError(
            new Error(`TypeScript compilation failed (exit code: ${code})\n${error || output}`),
            'compile',
            { exitCode: code, output, error }
          );
          resolve({ success: false, output, error });
        }
      });

      tsc.on('error', (err) => {
        logger.buildError(
          new Error(`Failed to start TypeScript compilation: ${err.message}`),
          'compile',
          { originalError: err.message }
        );
        resolve({ success: false, output, error: err.message });
      });
    });
  }

  /**
   * Execute npm link
   */
  private async runNpmLink(): Promise<BuildResult> {
    return new Promise((resolve) => {
      logger.info('🔗 Executing npm link...');
      
      const npmLink = spawn('npm', ['link'], {
        stdio: 'pipe',
        shell: true,
      });

      let output = '';
      let error = '';

      npmLink.stdout?.on('data', (data) => {
        output += data.toString();
      });

      npmLink.stderr?.on('data', (data) => {
        error += data.toString();
      });

      npmLink.on('close', (code) => {
        if (code === 0) {
          logger.info('✅ npm link successful');
          resolve({ success: true, output });
        } else {
          logger.buildError(
            new Error(`npm link failed (exit code: ${code})\n${error || output}`),
            'link',
            { exitCode: code, output, error }
          );
          resolve({ success: false, output, error });
        }
      });

      npmLink.on('error', (err) => {
        logger.buildError(
          new Error(`Failed to start npm link: ${err.message}`),
          'link',
          { originalError: err.message }
        );
        resolve({ success: false, output, error: err.message });
      });
    });
  }

  /**
   * Perform the build and link process
   */
  private async performBuild(): Promise<void> {
    if (this.isBuilding) {
      logger.warn('Build already in progress, skipping...');
      return;
    }

    this.isBuilding = true;
    
    try {
      logger.info('🔄 Starting build process...');
      
      // Run TypeScript compilation
      const tscResult = await this.runTypeScriptCompilation();
      
      if (tscResult.success) {
        // Run npm link only if compilation succeeded
        const linkResult = await this.runNpmLink();
        
        if (linkResult.success) {
          logger.info('🎉 Build and link completed successfully!');
        } else {
          logger.warn('⚠️  Build completed but linking failed');
        }
      } else {
        logger.error('❌ Build process failed at compilation step');
      }
    } catch (error) {
      logger.error('Build process encountered an error', error);
    } finally {
      this.isBuilding = false;
      logger.debug('───────────────────────────────────────');
    }
  }

  /**
   * Debounced build trigger
   */
  private triggerBuild(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      this.performBuild();
    }, this.debounceDelay);
  }

  /**
   * Start watching the src directory
   */
  public async start(): Promise<void> {
    await this.initializeLog();
    
    logger.info('🚀 Starting Dev Auto Watcher...');
    logger.info('📂 Watching: src/**');
    logger.info(`📝 Logging to: ${this.logPath}`);
    logger.info(`⏱️  Debounce delay: ${this.debounceDelay}ms`);
    logger.debug('───────────────────────────────────────');

    // Perform initial build
    await this.performBuild();

    // Setup file watcher
    const watcher = chokidar.watch('src/**/*', {
      ignored: [
        /(^|[\/\\])\../, // ignore dotfiles
        /node_modules/,
        /dist/,
        /\.log$/
      ],
      persistent: true,
      ignoreInitial: true
    });

    watcher
      .on('add', (path) => {
        logger.debug(`📄 File added: ${path}`);
        this.triggerBuild();
      })
      .on('change', (path) => {
        logger.debug(`📝 File changed: ${path}`);
        this.triggerBuild();
      })
      .on('unlink', (path) => {
        logger.debug(`🗑️  File removed: ${path}`);
        this.triggerBuild();
      })
      .on('addDir', (path) => {
        logger.debug(`📁 Directory added: ${path}`);
      })
      .on('unlinkDir', (path) => {
        logger.debug(`📁 Directory removed: ${path}`);
      })
      .on('error', (error) => {
        logger.error('Watcher error', error);
      })
      .on('ready', () => {
        logger.info('👀 Watcher is ready and monitoring for changes...');
      });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.warn('\n🛑 Received SIGINT, shutting down gracefully...');
      
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }
      
      await watcher.close();
      logger.info('👋 Dev Auto Watcher stopped');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.warn('\n🛑 Received SIGTERM, shutting down gracefully...');
      
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }
      
      await watcher.close();
      logger.info('👋 Dev Auto Watcher stopped');
      process.exit(0);
    });
  }
}

// Start the watcher
const watcher = new DevAutoWatcher();
watcher.start().catch((error) => {
  logger.error('Failed to start Dev Auto Watcher', error);
  process.exit(1);
});
