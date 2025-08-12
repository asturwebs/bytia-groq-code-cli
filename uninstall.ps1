# groq-code-cli Automated PowerShell Uninstaller
# This script removes the groq-code-cli tool and cleans up associated files
# 
# Exit Codes:
# 0  - Success (complete removal or nothing to remove)
# 1  - npm not found
# 2  - Permission denied during uninstallation
# 3  - User cancelled operation
# 4  - Partial failure (some components could not be removed)
# 5  - Invalid command line arguments

param(
    [switch]$Force,
    [switch]$Quiet,
    [switch]$DryRun,
    [switch]$SkipConfirm,
    [switch]$Help
)

# Script version and info
$SCRIPT_VERSION = "1.0.0"
$PROJECT_NAME = "groq-code-cli"

# Function to print colored output
function Write-Info {
    param($Message)
    if (-not $Quiet) {
        Write-Host "[INFO] $Message" -ForegroundColor Blue
    }
}

function Write-Success {
    param($Message)
    if (-not $Quiet) {
        Write-Host "[SUCCESS] $Message" -ForegroundColor Green
    }
}

function Write-Warning {
    param($Message)
    if (-not $Quiet) {
        Write-Host "[WARNING] $Message" -ForegroundColor Yellow
    }
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Action {
    param($Message)
    if (-not $Quiet) {
        Write-Host "[ACTION] $Message" -ForegroundColor Cyan
    }
}

# Function to show usage
function Show-Usage {
    Write-Host @"
Usage: .\uninstall.ps1 [OPTIONS]

Automated uninstaller for $PROJECT_NAME

OPTIONS:
    -Force          Force removal without confirmation prompts
    -Quiet          Suppress non-error output
    -DryRun         Show what would be removed without actually removing anything
    -SkipConfirm    Skip confirmation prompts (but still show what will be removed)
    -Help           Show this help message

EXIT CODES:
    0  - Success (complete removal or nothing to remove)
    1  - npm not found
    2  - Permission denied during uninstallation
    3  - User cancelled operation
    4  - Partial failure (some components could not be removed)
    5  - Invalid command line arguments
"@
}

if ($Help) {
    Show-Usage
    exit 0
}

# Force implies SkipConfirm
if ($Force) {
    $SkipConfirm = $true
}

Write-Info "Starting $PROJECT_NAME uninstallation..."

# Function to check if command exists
function Test-Command {
    param($CommandName)
    return [bool](Get-Command $CommandName -ErrorAction SilentlyContinue)
}

# Function to ask for confirmation
function Request-Confirmation {
    param(
        [string]$Message,
        [string]$Default = "n"
    )
    
    if ($SkipConfirm) {
        return $true
    }
    
    $prompt = if ($Default -eq "y") { "[Y/n]" } else { "[y/N]" }
    $defaultResponse = $Default
    
    Write-Host "$Message $prompt" -ForegroundColor Yellow
    $response = Read-Host
    if ([string]::IsNullOrEmpty($response)) {
        $response = $defaultResponse
    }
    
    return $response -match '^[Yy]([Ee][Ss])?$'
}

# Function to safely remove directory
function Remove-DirectorySafely {
    param(
        [string]$DirectoryPath,
        [string]$Description
    )
    
    if (-not (Test-Path $DirectoryPath)) {
        Write-Info "$Description not found at: $DirectoryPath"
        return $true
    }
    
    Write-Action "Found $Description at: $DirectoryPath"
    
    if ($DryRun) {
        Write-Info "[DRY RUN] Would remove: $DirectoryPath"
        return $true
    }
    
    try {
        Remove-Item -Path $DirectoryPath -Recurse -Force
        Write-Success "Removed $Description: $DirectoryPath"
        return $true
    } catch {
        Write-Error "Failed to remove $Description: $DirectoryPath"
        return $false
    }
}

# Initialize removal tracking
$REMOVAL_ERRORS = 0
$ITEMS_FOUND = 0
$ITEMS_REMOVED = 0

# Step 1: Check if npm is available
Write-Info "Checking npm availability..."

if (-not (Test-Command "npm")) {
    Write-Error "npm is not installed or not in PATH."
    Write-Warning "Cannot remove npm global installation without npm"
    Write-Info "You may need to manually remove any global installations"
    exit 1
}

$npmVersion = npm --version
Write-Success "Found npm version: v$npmVersion"

# Step 2: Check for global npm installation
Write-Info "Checking for global npm installation..."

$GLOBALLY_INSTALLED = $false
$GLOBAL_LINK = $false

# Check if package is globally installed
try {
    npm list -g --depth=0 $PROJECT_NAME 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $GLOBALLY_INSTALLED = $true
        $ITEMS_FOUND++
        Write-Action "Found global npm package: $PROJECT_NAME"
    }
} catch {
    # Package not globally installed
}

# Check if there's a global command
if (Test-Command "groq") {
    $groqCommand = Get-Command "groq"
    $GLOBAL_LINK = $true
    $ITEMS_FOUND++
    Write-Action "Found global command: groq → $($groqCommand.Source)"
}

# Step 3: Check for build artifacts
Write-Info "Checking for build artifacts..."

$CURRENT_DIR = Get-Location
$DIST_DIR = Join-Path $CURRENT_DIR "dist"

if (Test-Path $DIST_DIR) {
    $ITEMS_FOUND++
    Write-Action "Found build artifacts in: $DIST_DIR"
}

# Step 4: Check for local cache
Write-Info "Checking for local cache..."

$CACHE_DIR = Join-Path $env:USERPROFILE ".groq"

if (Test-Path $CACHE_DIR) {
    $ITEMS_FOUND++
    Write-Action "Found local cache in: $CACHE_DIR"
}

# Step 5: Show summary of what will be removed
Write-Host ""
if ($ITEMS_FOUND -eq 0) {
    Write-Info "No $PROJECT_NAME installations or artifacts found."
    Write-Success "System is already clean!"
    exit 0
}

Write-Info "=== UNINSTALLATION SUMMARY ==="
Write-Host ""

if ($GLOBALLY_INSTALLED -or $GLOBAL_LINK) {
    Write-Host "🗂️  Global Installation:" -ForegroundColor White
    if ($GLOBALLY_INSTALLED) {
        Write-Host "   • npm global package: $PROJECT_NAME"
    }
    if ($GLOBAL_LINK) {
        $groqLocation = (Get-Command groq -ErrorAction SilentlyContinue).Source
        Write-Host "   • Global command: groq → $groqLocation"
    }
    Write-Host ""
}

if (Test-Path $DIST_DIR) {
    Write-Host "🔨 Build Artifacts:" -ForegroundColor White
    Write-Host "   • Directory: $DIST_DIR"
    Write-Host ""
}

if (Test-Path $CACHE_DIR) {
    Write-Host "📂 Local Cache:" -ForegroundColor White
    Write-Host "   • Directory: $CACHE_DIR"
    Write-Host ""
}

Write-Host "📊 Total items found: $ITEMS_FOUND" -ForegroundColor White
Write-Host ""

# Step 6: Get user confirmation
if ($DryRun) {
    Write-Info "=== DRY RUN MODE ==="
    Write-Info "The above items would be removed in a real run."
    Write-Info "Run without -DryRun to perform actual removal."
    exit 0
}

if (-not (Request-Confirmation "Do you want to proceed with the uninstallation?")) {
    Write-Warning "Uninstallation cancelled by user."
    exit 3
}

Write-Host ""
Write-Info "=== PERFORMING UNINSTALLATION ==="

# Step 7: Remove global npm installation
if ($GLOBALLY_INSTALLED -or $GLOBAL_LINK) {
    Write-Info "Removing global npm installation..."
    
    try {
        if ($Quiet) {
            npm unlink -g $PROJECT_NAME 2>$null
        } else {
            npm unlink -g $PROJECT_NAME
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Successfully unlinked global package"
            $ITEMS_REMOVED++
        } else {
            Write-Error "Failed to unlink global package"
            $REMOVAL_ERRORS++
        }
    } catch {
        Write-Error "Failed to unlink global package"
        $REMOVAL_ERRORS++
    }
}

# Step 8: Remove build artifacts
if (Test-Path $DIST_DIR) {
    if ((Request-Confirmation "Remove build artifacts in dist/?")) {
        if (Remove-DirectorySafely $DIST_DIR "build artifacts") {
            $ITEMS_REMOVED++
        } else {
            $REMOVAL_ERRORS++
        }
    } else {
        Write-Info "Skipping build artifacts removal"
    }
}

# Step 9: Remove local cache
if (Test-Path $CACHE_DIR) {
    if ((Request-Confirmation "Remove local cache in `$env:USERPROFILE\.groq?")) {
        if (Remove-DirectorySafely $CACHE_DIR "local cache") {
            $ITEMS_REMOVED++
        } else {
            $REMOVAL_ERRORS++
        }
    } else {
        Write-Info "Skipping local cache removal"
    }
}

# Step 10: Final validation and reporting
Write-Host ""
Write-Info "=== VALIDATION & SUMMARY ==="

# Check if groq command is still available
if (Test-Command "groq") {
    Write-Warning "The 'groq' command is still available in PATH"
    $groqLocation = (Get-Command groq -ErrorAction SilentlyContinue).Source
    Write-Info "Location: $groqLocation"
    $REMAINING_ISSUES = $true
} else {
    Write-Success "The 'groq' command is no longer available in PATH"
}

# Check if npm still shows global package
try {
    npm list -g --depth=0 $PROJECT_NAME 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Warning "npm still shows $PROJECT_NAME as globally installed"
        $REMAINING_ISSUES = $true
    } else {
        Write-Success "npm no longer shows $PROJECT_NAME as globally installed"
    }
} catch {
    Write-Success "npm no longer shows $PROJECT_NAME as globally installed"
}

# Report final status
Write-Host ""
Write-Info "📊 UNINSTALLATION REPORT:"
Write-Host "   • Items found: $ITEMS_FOUND"
Write-Host "   • Items removed: $ITEMS_REMOVED"
Write-Host "   • Errors encountered: $REMOVAL_ERRORS"

if ($REMOVAL_ERRORS -gt 0) {
    Write-Host ""
    Write-Error "❌ Uninstallation completed with errors"
    Write-Info "Some components could not be removed automatically."
    Write-Info "You may need to:"
    Write-Host "   • Check file permissions"
    Write-Host "   • Run with -Force for non-interactive removal"
    Write-Host "   • Manually remove remaining components"
    exit 4
} elseif ($ITEMS_REMOVED -eq 0) {
    Write-Host ""
    Write-Info "ℹ️  No items were removed (user choice or nothing to remove)"
    exit 0
} else {
    Write-Host ""
    Write-Success "✅ $PROJECT_NAME uninstallation completed successfully!"
    Write-Info "All components have been cleanly removed from your system."
    exit 0
}
