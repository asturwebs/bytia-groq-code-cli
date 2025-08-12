#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { render } from 'ink';
import React from 'react';
import { Agent } from './agent.js';
import App from '../ui/App.js';
import { logger, LogLevel } from '../utils/logger.js';
import { getCurrentVersion, performBackgroundVersionCheck, VersionInfo } from '../utils/version.js';
import { initializeInterruptHandler, onInterrupt } from '../utils/interrupt-handler.js';

const program = new Command();

async function startChat(
  temperature: number,
  system: string | null,
  debug?: boolean
): Promise<void> {
  // Configure logger based on debug mode
  if (debug) {
    logger.setLevel(LogLevel.DEBUG);
    logger.setFileLogging(true, 'groq-cli-debug.log');
    logger.debug('Debug mode enabled');
  }
  
  // Show the CLI banner
  console.log(chalk.hex('#FF4500')(`                             
  ██████    ██████   ██████   ██████
 ███░░███░░███░░░██ ███░░███ ███░░███ 
░███ ░███ ░███ ░░░ ░███ ░███░███ ░███ 
░███ ░███ ░███     ░███ ░███░███ ░███ 
░░███░███ ░███     ░░██████ ░░███░███ 
 ░░░░░███ ░░░░      ░░░░░░   ░░░░░███ 
 ██  ░███                        ░███ 
░░██████                         ░███
 ░░░░░░                          ░░░ 
                        ███          
                      ░░███           
  ██████   ██████   ███████   ██████  
 ███░░███ ███░░███ ███░░███  ███░░███ 
░███ ░░░ ░███ ░███░███ ░███ ░███████  
░███  ███░███ ░███░███ ░███ ░███░░░   
░░██████ ░░██████ ░░███████ ░░██████  
 ░░░░░░   ░░░░░░   ░░░░░░░░  ░░░░░░   
`));

  // Perform non-blocking background version check
  performBackgroundVersionCheck((versionInfo: VersionInfo) => {
    console.log(chalk.yellow(`\n⚠️  Update available! Current: ${versionInfo.current}, Latest: ${versionInfo.latest}`));
    console.log(chalk.yellow(`   Run '/update' command or 'npm install -g groq-code-cli@latest' to upgrade.\n`));
  }).catch(() => {
    // Silently ignore version check failures
  });
    
  let defaultModel = 'moonshotai/kimi-k2-instruct';
  try {
    // Initialize robust interrupt handling
    const interruptHandler = initializeInterruptHandler();
    logger.info('Interrupt handler initialized');
    
    logger.info('Initializing Groq Code CLI...');
    logger.debug('Configuration', { temperature, system, debug, model: defaultModel });
    
    // Create agent (API key will be checked on first message)
    const agent = await Agent.create(defaultModel, temperature, system, debug);
    logger.info('Agent created successfully');
    
    // Try to restore last session
    try {
      const sessionRestored = await agent.restoreLastSession();
      if (sessionRestored) {
        logger.info('Previous session restored successfully');
      }
    } catch (error) {
      logger.debug('Failed to restore session, starting fresh:', error);
    }
    
    // Register cleanup callback for graceful shutdown
    onInterrupt(async () => {
      logger.info('Cleaning up agent during shutdown...');
      try {
        agent.interrupt(); // Stop any ongoing requests
        logger.info('Agent cleanup completed');
      } catch (error) {
        logger.error('Error during agent cleanup', error);
      }
    });

    render(React.createElement(App, { agent }));
  } catch (error) {
    logger.error('Failed to initialize agent', error);
    console.log(chalk.red(`Error initializing agent: ${error}`));
    process.exit(1);
  }
}

program
  .name('groq')
  .description('Groq Code CLI')
  .version(getCurrentVersion())
  .option('-t, --temperature <temperature>', 'Temperature for generation', parseFloat, 1.0)
  .option('-s, --system <message>', 'Custom system message')
  .option('-d, --debug', 'Enable debug logging to debug-agent.log in current directory')
  .action(async (options) => {
    await startChat(
      options.temperature,
      options.system || null,
      options.debug
    );
  });

program.parse();
