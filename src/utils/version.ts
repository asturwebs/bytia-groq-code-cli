import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface VersionInfo {
  current: string;
  latest?: string;
  hasUpdate?: boolean;
}

export function getCurrentVersion(): string {
  try {
    const packageJsonPath = join(__dirname, '..', '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    console.error('Error reading package.json:', error);
    return 'unknown';
  }
}

export async function getLatestVersion(): Promise<string | null> {
  try {
    // Use dynamic import for node-fetch-like functionality
    const response = await fetch('https://registry.npmjs.org/groq-code-cli/latest');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return data.version;
  } catch (error) {
    console.error('Error fetching latest version:', error);
    return null;
  }
}

export function compareVersions(current: string, latest: string): boolean {
  // Simple semantic version comparison
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);
  
  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;
    
    if (latestPart > currentPart) {
      return true; // Latest is newer
    }
    if (currentPart > latestPart) {
      return false; // Current is newer
    }
  }
  
  return false; // Versions are equal
}

export async function checkForUpdate(): Promise<VersionInfo> {
  const current = getCurrentVersion();
  const latest = await getLatestVersion();
  
  const versionInfo: VersionInfo = {
    current,
    latest: latest || undefined,
    hasUpdate: latest ? compareVersions(current, latest) : false,
  };
  
  return versionInfo;
}

/**
 * Check if enough time has passed to perform version check (non-blocking)
 * Returns true if we should check for updates
 */
export function shouldCheckForUpdate(lastCheck: Date | null): boolean {
  if (!lastCheck) {
    return true; // First time checking
  }
  
  const now = new Date();
  const hoursSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);
  
  // Check once every 24 hours
  return hoursSinceLastCheck >= 24;
}

/**
 * Check if enough time has passed to show update warning again
 * Returns true if we should warn the user
 */
export function shouldShowUpdateWarning(lastWarning: Date | null): boolean {
  if (!lastWarning) {
    return true; // First time warning
  }
  
  const now = new Date();
  const hoursSinceLastWarning = (now.getTime() - lastWarning.getTime()) / (1000 * 60 * 60);
  
  // Warn once per day (24 hours)
  return hoursSinceLastWarning >= 24;
}

/**
 * Perform a non-blocking version check with caching
 * This is meant to be called during CLI bootstrap
 */
export async function performBackgroundVersionCheck(
  onUpdateAvailable?: (versionInfo: VersionInfo) => void
): Promise<void> {
  try {
    // Import ConfigManager dynamically to avoid circular dependencies
    const { ConfigManager } = await import('../utils/local-settings.js');
    const configManager = new ConfigManager();
    
    const lastCheck = configManager.getLastVersionCheck();
    
    // Only check if enough time has passed
    if (!shouldCheckForUpdate(lastCheck)) {
      return;
    }
    
    // Perform the version check
    const versionInfo = await checkForUpdate();
    
    // Update the last check timestamp
    configManager.setLastVersionCheck();
    
    // If there's an update available, check if we should warn
    if (versionInfo.hasUpdate && onUpdateAvailable) {
      const lastWarning = configManager.getLastVersionWarning();
      
      if (shouldShowUpdateWarning(lastWarning)) {
        configManager.setLastVersionWarning();
        onUpdateAvailable(versionInfo);
      }
    }
  } catch (error) {
    // Silently fail - version checking shouldn't interrupt CLI startup
    console.debug('Background version check failed:', error);
  }
}
