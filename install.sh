#!/bin/bash

# groq-code-cli Automated Installer
# This script installs the groq-code-cli tool with various configuration options
# 
# Exit Codes (for CI reuse):
# 0  - Success
# 1  - Node.js not found or version too old
# 2  - npm not found
# 3  - npm install failed
# 4  - npm run build failed
# 5  - npm link failed (when not using --no-link)
# 6  - Invalid command line arguments

set -e  # Exit on any error

# Script version and info
SCRIPT_VERSION="1.0.0"
PROJECT_NAME="groq-code-cli"
MIN_NODE_VERSION="16"

# Default options
QUIET=false
FORCE=false
NO_LINK=false

# Colors for output (disabled if --quiet)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    if [ "$QUIET" = false ]; then
        echo -e "${BLUE}[INFO]${NC} $1"
    fi
}

print_success() {
    if [ "$QUIET" = false ]; then
        echo -e "${GREEN}[SUCCESS]${NC} $1"
    fi
}

print_warning() {
    if [ "$QUIET" = false ]; then
        echo -e "${YELLOW}[WARNING]${NC} $1"
    fi
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Automated installer for $PROJECT_NAME

OPTIONS:
    --no-link    Skip npm link step (useful for CI or when you don't want global installation)
    --force      Force reinstall even if already installed
    --quiet      Suppress non-error output
    --help       Show this help message

EXIT CODES (for CI reuse):
    0  - Success
    1  - Node.js not found or version too old
    2  - npm not found  
    3  - npm install failed
    4  - npm run build failed
    5  - npm link failed (when not using --no-link)
    6  - Invalid command line arguments

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-link)
            NO_LINK=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --quiet)
            QUIET=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 6
            ;;
    esac
done

print_info "Starting $PROJECT_NAME installation..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to compare version numbers
version_gte() {
    # Returns 0 if $1 >= $2, 1 otherwise
    printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

# Step 1: Verify Node.js is present and meets minimum version requirement
print_info "Checking Node.js installation..."

if ! command_exists node; then
    print_error "Node.js is not installed or not in PATH."
    echo ""
    echo "Please install Node.js version $MIN_NODE_VERSION or higher:"
    echo "  - Visit: https://nodejs.org/en/download/"
    echo "  - Or use a version manager like nvm: https://github.com/nvm-sh/nvm"
    echo ""
    echo "After installation, restart your terminal and run this script again."
    exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//')
print_info "Found Node.js version: v$NODE_VERSION"

if ! version_gte "$NODE_VERSION" "$MIN_NODE_VERSION"; then
    print_error "Node.js version $NODE_VERSION is too old. Required: v$MIN_NODE_VERSION or higher."
    echo ""
    echo "Please upgrade Node.js:"
    echo "  - Visit: https://nodejs.org/en/download/"
    echo "  - Or use a version manager like nvm:"
    echo "    nvm install $MIN_NODE_VERSION"
    echo "    nvm use $MIN_NODE_VERSION"
    echo ""
    echo "After upgrading, restart your terminal and run this script again."
    exit 1
fi

print_success "Node.js version check passed (v$NODE_VERSION >= v$MIN_NODE_VERSION)"

# Step 2: Verify npm is present
print_info "Checking npm installation..."

if ! command_exists npm; then
    print_error "npm is not installed or not in PATH."
    echo ""
    echo "npm should be installed with Node.js. Please:"
    echo "  1. Reinstall Node.js from https://nodejs.org/en/download/"
    echo "  2. Or install npm separately: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm"
    echo ""
    echo "After installation, restart your terminal and run this script again."
    exit 2
fi

NPM_VERSION=$(npm --version)
print_success "Found npm version: v$NPM_VERSION"

# Step 3: Check if already installed (when not forcing)
if [ "$FORCE" = false ] && [ "$NO_LINK" = false ]; then
    if command_exists groq; then
        print_warning "$PROJECT_NAME appears to already be installed globally."
        print_info "Use --force to reinstall or --no-link to skip global installation."
        echo ""
        echo "Current installation:"
        which groq
        groq --version 2>/dev/null || echo "Version info not available"
        echo ""
        echo "To continue anyway, run: $0 --force"
        exit 0
    fi
fi

# Step 4: Run npm install
print_info "Installing dependencies..."

if [ "$QUIET" = true ]; then
    if ! npm install --silent; then
        print_error "npm install failed"
        exit 3
    fi
else
    if ! npm install; then
        print_error "npm install failed"
        exit 3
    fi
fi

print_success "Dependencies installed successfully"

# Step 5: Run npm run build
print_info "Building project..."

if [ "$QUIET" = true ]; then
    if ! npm run build --silent; then
        print_error "npm run build failed"
        exit 4
    fi
else
    if ! npm run build; then
        print_error "npm run build failed"
        exit 4
    fi
fi

print_success "Project built successfully"

# Step 6: Run npm link (unless --no-link is specified)
if [ "$NO_LINK" = false ]; then
    print_info "Linking package globally..."
    
    # Function to try npm link with sudo fallback
    try_npm_link() {
        if [ "$QUIET" = true ]; then
            npm link --silent 2>/dev/null
        else
            npm link 2>/dev/null
        fi
    }
    
    # Try npm link first
    if try_npm_link; then
        print_success "Package linked successfully"
    else
        # Check if it's a permission error and try with sudo
        print_warning "npm link failed, trying with sudo (you may be prompted for your password)..."
        
        if command_exists sudo; then
            if [ "$QUIET" = true ]; then
                if sudo npm link --silent; then
                    print_success "Package linked successfully with sudo"
                else
                    print_error "npm link failed even with sudo"
                    echo ""
                    echo "This might be due to:"
                    echo "  1. Permission issues with your npm global directory"
                    echo "  2. npm configuration problems"
                    echo ""
                    echo "Try running: npm config get prefix"
                    echo "And ensure you have write permissions to that directory."
                    echo ""
                    echo "Alternative: Run this script with --no-link to skip global installation."
                    exit 5
                fi
            else
                if sudo npm link; then
                    print_success "Package linked successfully with sudo"
                else
                    print_error "npm link failed even with sudo"
                    echo ""
                    echo "This might be due to:"
                    echo "  1. Permission issues with your npm global directory"
                    echo "  2. npm configuration problems"
                    echo ""
                    echo "Try running: npm config get prefix"
                    echo "And ensure you have write permissions to that directory."
                    echo ""
                    echo "Alternative: Run this script with --no-link to skip global installation."
                    exit 5
                fi
            fi
        else
            print_error "npm link failed and sudo is not available"
            echo ""
            echo "This might be due to permission issues with your npm global directory."
            echo "Try running: npm config get prefix"
            echo "And ensure you have write permissions to that directory."
            echo ""
            echo "Alternative: Run this script with --no-link to skip global installation."
            exit 5
        fi
    fi
else
    print_info "Skipping npm link (--no-link specified)"
fi

# Step 7: Post-install success message
echo ""
print_success "🎉 $PROJECT_NAME installation completed successfully!"
echo ""

if [ "$NO_LINK" = false ]; then
    echo "The 'groq' command is now available globally. Try:"
    echo "  groq --help"
    echo "  groq --version"
else
    echo "To use the CLI without global installation:"
    echo "  npm start [arguments]"
    echo "  OR"
    echo "  node dist/core/cli.js [arguments]"
fi

echo ""
echo "📖 For detailed usage instructions and examples, see:"
echo "   https://github.com/your-repo/groq-code-cli#usage"
echo "   or check the README.md file in this directory"
echo ""
echo "🐛 Found an issue? Report it at:"
echo "   https://github.com/your-repo/groq-code-cli/issues"
echo ""

print_success "Installation completed with exit code 0"
exit 0
