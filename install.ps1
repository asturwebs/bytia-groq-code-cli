# groq-code-cli Automated PowerShell Installer
# This script installs the groq-code-cli tool with various configuration options
# 
# Exit Codes (for CI reuse):
# 0  - Success
# 1  - Node.js not found or version too old
# 2  - npm not found
# 3  - npm install failed
# 4  - npm run build failed
# 5  - npm link failed (when not using -NoLink)
# 6  - Invalid command line arguments

param(
    [switch]$NoLink,
    [switch]$Force,
    [switch]$Quiet,
    [switch]$Help
)

# Script version and info
$SCRIPT_VERSION = "1.0.0"
$PROJECT_NAME = "groq-code-cli"
$MIN_NODE_VERSION = [Version]"16.0.0"

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

# Function to show usage
function Show-Usage {
    Write-Host @"
Usage: .\install.ps1 [OPTIONS]

Automated installer for $PROJECT_NAME

OPTIONS:
    -NoLink       Skip npm link step (useful for CI or when you don't want global installation)
    -Force        Force reinstall even if already installed
    -Quiet        Suppress non-error output
    -Help         Show this help message

EXIT CODES (for CI reuse):
    0  - Success
    1  - Node.js not found or version too old
    2  - npm not found  
    3  - npm install failed
    4  - npm run build failed
    5  - npm link failed (when not using -NoLink)
    6  - Invalid command line arguments
"@
}

if ($Help) {
    Show-Usage
    exit 0
}

Write-Info "Starting $PROJECT_NAME installation..."

# Function to check if command exists
function Test-Command {
    param($CommandName)
    return [bool](Get-Command $CommandName -ErrorAction SilentlyContinue)
}

# Function to compare version numbers
function Test-VersionGTE {
    param([Version]$Version, [Version]$Required)
    return $Version -ge $Required
}

# Step 1: Verify Node.js is present and meets minimum version requirement
Write-Info "Checking Node.js installation..."

if (-not (Test-Command "node")) {
    Write-Error "Node.js is not installed or not in PATH."
    Write-Host ""
    Write-Host "Please install Node.js version $MIN_NODE_VERSION or higher:"
    Write-Host "  - Visit: https://nodejs.org/en/download/"
    Write-Host "  - Or use a version manager like nvm-windows: https://github.com/coreybutler/nvm-windows"
    Write-Host ""
    Write-Host "After installation, restart PowerShell and run this script again."
    exit 1
}

$nodeVersionString = node --version
$nodeVersion = [Version]($nodeVersionString -replace '^v', '')
Write-Info "Found Node.js version: $nodeVersionString"

if (-not (Test-VersionGTE $nodeVersion $MIN_NODE_VERSION)) {
    Write-Error "Node.js version $nodeVersion is too old. Required: v$MIN_NODE_VERSION or higher."
    Write-Host ""
    Write-Host "Please upgrade Node.js:"
    Write-Host "  - Visit: https://nodejs.org/en/download/"
    Write-Host "  - Or use a version manager like nvm-windows:"
    Write-Host "    nvm install $MIN_NODE_VERSION"
    Write-Host "    nvm use $MIN_NODE_VERSION"
    Write-Host ""
    Write-Host "After upgrading, restart PowerShell and run this script again."
    exit 1
}

Write-Success "Node.js version check passed ($nodeVersionString >= v$MIN_NODE_VERSION)"

# Step 2: Verify npm is present
Write-Info "Checking npm installation..."

if (-not (Test-Command "npm")) {
    Write-Error "npm is not installed or not in PATH."
    Write-Host ""
    Write-Host "npm should be installed with Node.js. Please:"
    Write-Host "  1. Reinstall Node.js from https://nodejs.org/en/download/"
    Write-Host "  2. Or install npm separately: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm"
    Write-Host ""
    Write-Host "After installation, restart PowerShell and run this script again."
    exit 2
}

$npmVersion = npm --version
Write-Success "Found npm version: v$npmVersion"

# Step 3: Check if already installed (when not forcing)
if (-not $Force -and -not $NoLink) {
    if (Test-Command "groq") {
        Write-Warning "$PROJECT_NAME appears to already be installed globally."
        Write-Info "Use -Force to reinstall or -NoLink to skip global installation."
        Write-Host ""
        Write-Host "Current installation:"
        Get-Command groq | Select-Object Source
        try {
            groq --version
        } catch {
            Write-Host "Version info not available"
        }
        Write-Host ""
        Write-Host "To continue anyway, run: .\install.ps1 -Force"
        exit 0
    }
}

# Step 4: Run npm install
Write-Info "Installing dependencies..."

try {
    if ($Quiet) {
        npm install --silent 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed"
        }
    } else {
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed"
        }
    }
} catch {
    Write-Error "npm install failed"
    exit 3
}

Write-Success "Dependencies installed successfully"

# Step 5: Run npm run build
Write-Info "Building project..."

try {
    if ($Quiet) {
        npm run build --silent 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "npm run build failed"
        }
    } else {
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "npm run build failed"
        }
    }
} catch {
    Write-Error "npm run build failed"
    exit 4
}

Write-Success "Project built successfully"

# Step 6: Run npm link (unless -NoLink is specified)
if (-not $NoLink) {
    Write-Info "Linking package globally..."
    
    try {
        if ($Quiet) {
            npm link --silent 2>$null
            if ($LASTEXITCODE -ne 0) {
                throw "npm link failed"
            }
        } else {
            npm link
            if ($LASTEXITCODE -ne 0) {
                throw "npm link failed"
            }
        }
        Write-Success "Package linked successfully"
    } catch {
        Write-Warning "npm link failed. This might be due to permission issues."
        Write-Host ""
        Write-Host "This might be due to:"
        Write-Host "  1. Permission issues with your npm global directory"
        Write-Host "  2. npm configuration problems"
        Write-Host ""
        Write-Host "Try running: npm config get prefix"
        Write-Host "And ensure you have write permissions to that directory."
        Write-Host ""
        Write-Host "Alternative: Run this script with -NoLink to skip global installation."
        exit 5
    }
} else {
    Write-Info "Skipping npm link (-NoLink specified)"
}

# Step 7: Post-install success message
Write-Host ""
Write-Success "🎉 $PROJECT_NAME installation completed successfully!"
Write-Host ""

if (-not $NoLink) {
    Write-Host "The 'groq' command is now available globally. Try:"
    Write-Host "  groq --help"
    Write-Host "  groq --version"
} else {
    Write-Host "To use the CLI without global installation:"
    Write-Host "  npm start [arguments]"
    Write-Host "  OR"
    Write-Host "  node dist/core/cli.js [arguments]"
}

Write-Host ""
Write-Host "📖 For detailed usage instructions and examples, see:"
Write-Host "   https://github.com/your-repo/groq-code-cli#usage"
Write-Host "   or check the README.md file in this directory"
Write-Host ""
Write-Host "🐛 Found an issue? Report it at:"
Write-Host "   https://github.com/your-repo/groq-code-cli/issues"
Write-Host ""

Write-Success "Installation completed with exit code 0"
exit 0
