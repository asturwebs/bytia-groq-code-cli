#!/bin/bash

# groq-code-cli Automated Uninstaller
# This script removes the groq-code-cli tool and cleans up associated files
# 
# Exit Codes:
# 0  - Success (complete removal or nothing to remove)
# 1  - npm not found
# 2  - Permission denied during uninstallation
# 3  - User cancelled operation
# 4  - Partial failure (some components could not be removed)
# 5  - Invalid command line arguments

set -e  # Exit on any error

# Script version and info
SCRIPT_VERSION="1.0.0"
PROJECT_NAME="groq-code-cli"

# Default options
QUIET=false
FORCE=false
SKIP_CONFIRMATION=false
DRY_RUN=false

# Colors for output (disabled if --quiet)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

print_action() {
    if [ "$QUIET" = false ]; then
        echo -e "${CYAN}[ACTION]${NC} $1"
    fi
}

# Function to show usage
show_usage() {
    cat <<EOF
Usage: $0 [OPTIONS]

Automated uninstaller for $PROJECT_NAME

OPTIONS:
    --force           Force removal without confirmation prompts
    --quiet           Suppress non-error output
    --dry-run         Show what would be removed without actually removing anything
    --skip-confirm    Skip confirmation prompts (but still show what will be removed)
    --help            Show this help message

EXIT CODES:
    0  - Success (complete removal or nothing to remove)
    1  - npm not found
    2  - Permission denied during uninstallation
    3  - User cancelled operation
    4  - Partial failure (some components could not be removed)
    5  - Invalid command line arguments

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE=true
            SKIP_CONFIRMATION=true
            shift
            ;;
        --quiet)
            QUIET=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-confirm)
            SKIP_CONFIRMATION=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 5
            ;;
    esac
done

print_info "Starting $PROJECT_NAME uninstallation..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to ask for confirmation
ask_confirmation() {
    local message="$1"
    local default="${2:-n}"
    
    if [ "$SKIP_CONFIRMATION" = true ]; then
        return 0
    fi
    
    if [ "$default" = "y" ]; then
        prompt="[Y/n]"
        default_response="y"
    else
        prompt="[y/N]"
        default_response="n"
    fi
    
    echo -e "${YELLOW}$message $prompt${NC}"
    read -r response
    response="${response:-$default_response}"
    
    case "$response" in
        [Yy]|[Yy][Ee][Ss])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Function to safely remove directory
safe_remove_dir() {
    local dir_path="$1"
    local description="$2"
    
    if [ ! -d "$dir_path" ]; then
        print_info "$description not found at: $dir_path"
        return 0
    fi
    
    print_action "Found $description at: $dir_path"
    
    if [ "$DRY_RUN" = true ]; then
        print_info "[DRY RUN] Would remove: $dir_path"
        return 0
    fi
    
    if rm -rf "$dir_path" 2>/dev/null; then
        print_success "Removed $description: $dir_path"
        return 0
    else
        print_error "Failed to remove $description: $dir_path"
        return 1
    fi
}

# Function to check npm permissions
check_npm_permissions() {
    local npm_prefix
    npm_prefix=$(npm config get prefix 2>/dev/null || echo "")
    
    if [ -z "$npm_prefix" ]; then
        print_warning "Could not determine npm prefix"
        return 1
    fi
    
    if [ ! -w "$npm_prefix" ] && [ ! -w "$npm_prefix/lib/node_modules" ] 2>/dev/null; then
        print_warning "No write permissions to npm global directory: $npm_prefix"
        print_info "You may need to use sudo for npm operations"
        return 1
    fi
    
    return 0
}

# Initialize removal tracking
REMOVAL_ERRORS=0
ITEMS_FOUND=0
ITEMS_REMOVED=0

# Step 1: Check if npm is available
print_info "Checking npm availability..."

if ! command_exists npm; then
    print_error "npm is not installed or not in PATH."
    print_warning "Cannot remove npm global installation without npm"
    print_info "You may need to manually remove any global installations"
    exit 1
fi

NPM_VERSION=$(npm --version)
print_success "Found npm version: v$NPM_VERSION"

# Step 2: Check for global npm installation
print_info "Checking for global npm installation..."

GLOBALLY_INSTALLED=false
GLOBAL_LINK=false

# Check if package is globally installed
if npm list -g --depth=0 "$PROJECT_NAME" >/dev/null 2>&1; then
    GLOBALLY_INSTALLED=true
    ITEMS_FOUND=$((ITEMS_FOUND + 1))
    print_action "Found global npm package: $PROJECT_NAME"
fi

# Check if there's a global symlink
if command_exists groq; then
    GROQ_LOCATION=$(which groq)
    if [ -L "$GROQ_LOCATION" ]; then
        GLOBAL_LINK=true
        ITEMS_FOUND=$((ITEMS_FOUND + 1))
        print_action "Found global symlink: $GROQ_LOCATION"
    else
        ITEMS_FOUND=$((ITEMS_FOUND + 1))
        print_action "Found global executable: $GROQ_LOCATION"
    fi
fi

# Step 3: Check for build artifacts
print_info "Checking for build artifacts..."

CURRENT_DIR=$(pwd)
DIST_DIR="$CURRENT_DIR/dist"

if [ -d "$DIST_DIR" ]; then
    ITEMS_FOUND=$((ITEMS_FOUND + 1))
    print_action "Found build artifacts in: $DIST_DIR"
fi

# Step 4: Check for local cache
print_info "Checking for local cache..."

CACHE_DIR="$HOME/.groq"

if [ -d "$CACHE_DIR" ]; then
    ITEMS_FOUND=$((ITEMS_FOUND + 1))
    print_action "Found local cache in: $CACHE_DIR"
fi

# Step 5: Show summary of what will be removed
echo ""
if [ $ITEMS_FOUND -eq 0 ]; then
    print_info "No $PROJECT_NAME installations or artifacts found."
    print_success "System is already clean!"
    exit 0
fi

print_info "=== UNINSTALLATION SUMMARY ==="
echo ""

if [ "$GLOBALLY_INSTALLED" = true ] || [ "$GLOBAL_LINK" = true ]; then
    echo "🗂️  Global Installation:"
    if [ "$GLOBALLY_INSTALLED" = true ]; then
        echo "   • npm global package: $PROJECT_NAME"
    fi
    if [ "$GLOBAL_LINK" = true ]; then
        echo "   • Global command: groq → $(which groq)"
    fi
    echo ""
fi

if [ -d "$DIST_DIR" ]; then
    echo "🔨 Build Artifacts:"
    echo "   • Directory: $DIST_DIR"
    echo ""
fi

if [ -d "$CACHE_DIR" ]; then
    echo "📂 Local Cache:"
    echo "   • Directory: $CACHE_DIR"
    echo ""
fi

echo "📊 Total items found: $ITEMS_FOUND"
echo ""

# Step 6: Get user confirmation
if [ "$DRY_RUN" = true ]; then
    print_info "=== DRY RUN MODE ==="
    print_info "The above items would be removed in a real run."
    print_info "Run without --dry-run to perform actual removal."
    exit 0
fi

if ! ask_confirmation "Do you want to proceed with the uninstallation?"; then
    print_warning "Uninstallation cancelled by user."
    exit 3
fi

echo ""
print_info "=== PERFORMING UNINSTALLATION ==="

# Step 7: Remove global npm installation
if [ "$GLOBALLY_INSTALLED" = true ] || [ "$GLOBAL_LINK" = true ]; then
    print_info "Removing global npm installation..."
    
    # Check permissions first
    check_npm_permissions
    NEEDS_SUDO=$?
    
    # Try to unlink first (safer than uninstall)
    if npm list -g --depth=0 "$PROJECT_NAME" >/dev/null 2>&1; then
        print_action "Attempting npm unlink for $PROJECT_NAME..."
        
        if [ $NEEDS_SUDO -eq 1 ] && [ "$FORCE" = false ]; then
            print_warning "May require elevated permissions..."
            if ask_confirmation "Try with sudo?"; then
                if [ "$QUIET" = true ]; then
                    if sudo npm unlink -g "$PROJECT_NAME" >/dev/null 2>&1; then
                        print_success "Successfully unlinked global package with sudo"
                        ITEMS_REMOVED=$((ITEMS_REMOVED + 1))
                    else
                        print_error "Failed to unlink global package with sudo"
                        REMOVAL_ERRORS=$((REMOVAL_ERRORS + 1))
                    fi
                else
                    if sudo npm unlink -g "$PROJECT_NAME"; then
                        print_success "Successfully unlinked global package with sudo"
                        ITEMS_REMOVED=$((ITEMS_REMOVED + 1))
                    else
                        print_error "Failed to unlink global package with sudo"
                        REMOVAL_ERRORS=$((REMOVAL_ERRORS + 1))
                    fi
                fi
            else
                print_warning "Skipping global npm removal due to permissions"
                REMOVAL_ERRORS=$((REMOVAL_ERRORS + 1))
            fi
        else
            # Try without sudo first
            if [ "$QUIET" = true ]; then
                if npm unlink -g "$PROJECT_NAME" >/dev/null 2>&1; then
                    print_success "Successfully unlinked global package"
                    ITEMS_REMOVED=$((ITEMS_REMOVED + 1))
                elif [ $NEEDS_SUDO -eq 1 ] && command_exists sudo; then
                    print_warning "Trying with sudo..."
                    if sudo npm unlink -g "$PROJECT_NAME" >/dev/null 2>&1; then
                        print_success "Successfully unlinked global package with sudo"
                        ITEMS_REMOVED=$((ITEMS_REMOVED + 1))
                    else
                        print_error "Failed to unlink global package"
                        REMOVAL_ERRORS=$((REMOVAL_ERRORS + 1))
                    fi
                else
                    print_error "Failed to unlink global package"
                    REMOVAL_ERRORS=$((REMOVAL_ERRORS + 1))
                fi
            else
                if npm unlink -g "$PROJECT_NAME"; then
                    print_success "Successfully unlinked global package"
                    ITEMS_REMOVED=$((ITEMS_REMOVED + 1))
                elif [ $NEEDS_SUDO -eq 1 ] && command_exists sudo; then
                    print_warning "Trying with sudo..."
                    if sudo npm unlink -g "$PROJECT_NAME"; then
                        print_success "Successfully unlinked global package with sudo"
                        ITEMS_REMOVED=$((ITEMS_REMOVED + 1))
                    else
                        print_error "Failed to unlink global package"
                        REMOVAL_ERRORS=$((REMOVAL_ERRORS + 1))
                    fi
                else
                    print_error "Failed to unlink global package"
                    REMOVAL_ERRORS=$((REMOVAL_ERRORS + 1))
                fi
            fi
        fi
    fi
fi

# Step 8: Remove build artifacts
if [ -d "$DIST_DIR" ]; then
    if ask_confirmation "Remove build artifacts in dist/?"; then
        if safe_remove_dir "$DIST_DIR" "build artifacts"; then
            ITEMS_REMOVED=$((ITEMS_REMOVED + 1))
        else
            REMOVAL_ERRORS=$((REMOVAL_ERRORS + 1))
        fi
    else
        print_info "Skipping build artifacts removal"
    fi
fi

# Step 9: Remove local cache
if [ -d "$CACHE_DIR" ]; then
    if ask_confirmation "Remove local cache in \$HOME/.groq?"; then
        if safe_remove_dir "$CACHE_DIR" "local cache"; then
            ITEMS_REMOVED=$((ITEMS_REMOVED + 1))
        else
            REMOVAL_ERRORS=$((REMOVAL_ERRORS + 1))
        fi
    else
        print_info "Skipping local cache removal"
    fi
fi

# Step 10: Final validation and reporting
echo ""
print_info "=== VALIDATION & SUMMARY ==="

# Check if groq command is still available
if command_exists groq; then
    print_warning "The 'groq' command is still available in PATH"
    print_info "Location: $(which groq)"
    REMAINING_ISSUES=true
else
    print_success "The 'groq' command is no longer available in PATH"
fi

# Check if npm still shows global package
if npm list -g --depth=0 "$PROJECT_NAME" >/dev/null 2>&1; then
    print_warning "npm still shows $PROJECT_NAME as globally installed"
    REMAINING_ISSUES=true
else
    print_success "npm no longer shows $PROJECT_NAME as globally installed"
fi

# Report final status
echo ""
print_info "📊 UNINSTALLATION REPORT:"
echo "   • Items found: $ITEMS_FOUND"
echo "   • Items removed: $ITEMS_REMOVED"
echo "   • Errors encountered: $REMOVAL_ERRORS"

if [ $REMOVAL_ERRORS -gt 0 ]; then
    echo ""
    print_error "❌ Uninstallation completed with errors"
    print_info "Some components could not be removed automatically."
    print_info "You may need to:"
    echo "   • Check file permissions"
    echo "   • Run with --force for non-interactive removal"
    echo "   • Manually remove remaining components"
    exit 4
elif [ $ITEMS_REMOVED -eq 0 ]; then
    echo ""
    print_info "ℹ️  No items were removed (user choice or nothing to remove)"
    exit 0
else
    echo ""
    print_success "✅ $PROJECT_NAME uninstallation completed successfully!"
    print_info "All components have been cleanly removed from your system."
    exit 0
fi
