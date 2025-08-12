import { CommandDefinition, CommandContext } from '../base.js';
import { checkForUpdate } from '../../utils/version.js';
import { spawn } from 'child_process';

export const updateCommand: CommandDefinition = {
  command: 'update',
  description: 'Check for updates and upgrade to the latest version',
  handler: async ({ addMessage }: CommandContext) => {
    addMessage({
      role: 'system',
      content: 'Checking for updates...'
    });

    try {
      const versionInfo = await checkForUpdate();
      
      if (!versionInfo.latest) {
        addMessage({
          role: 'system',
          content: 'Unable to check for updates. Please check your internet connection and try again.'
        });
        return;
      }
      
      if (!versionInfo.hasUpdate) {
        addMessage({
          role: 'system',
          content: `You are already using the latest version (${versionInfo.current}).`
        });
        return;
      }
      
      addMessage({
        role: 'system',
        content: `Update available!\n\nCurrent version: ${versionInfo.current}\nLatest version: ${versionInfo.latest}\n\nStarting update...`
      });
      
      // Perform the update
      await performUpdate(versionInfo.latest!, addMessage);
      
    } catch (error) {
      addMessage({
        role: 'system',
        content: `Error checking for updates: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }
};

async function performUpdate(latestVersion: string, addMessage: (message: any) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    addMessage({
      role: 'system',
      content: `Installing groq-code-cli@${latestVersion}...`
    });
    
    const updateProcess = spawn('npm', ['install', '-g', `groq-code-cli@${latestVersion}`], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    updateProcess.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    updateProcess.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    updateProcess.on('close', (code) => {
      if (code === 0) {
        addMessage({
          role: 'system',
          content: `✅ Successfully updated to version ${latestVersion}!\n\nPlease restart the CLI to use the new version.\nYou can exit with Ctrl+C and run 'groq' again.`
        });
        resolve();
      } else {
        addMessage({
          role: 'system',
          content: `❌ Update failed with exit code ${code}.\n\nError output:\n${stderr}\n\nYou may need to run the update command with elevated privileges:\nsudo npm install -g groq-code-cli@${latestVersion}`
        });
        reject(new Error(`Update process failed with exit code ${code}`));
      }
    });
    
    updateProcess.on('error', (error) => {
      addMessage({
        role: 'system',
        content: `❌ Failed to start update process: ${error.message}\n\nPlease ensure npm is installed and accessible.`
      });
      reject(error);
    });
  });
}
