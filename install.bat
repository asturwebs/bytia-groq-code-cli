@echo off
setlocal enabledelayedexpansion

REM groq-code-cli Automated Batch Installer
REM This script installs the groq-code-cli tool with various configuration options
REM 
REM Exit Codes (for CI reuse):
REM 0  - Success
REM 1  - Node.js not found or version too old
REM 2  - npm not found
REM 3  - npm install failed
REM 4  - npm run build failed
REM 5  - npm link failed (when not using --no-link)
REM 6  - Invalid command line arguments

set "SCRIPT_VERSION=1.0.0"
set "PROJECT_NAME=groq-code-cli"
set "MIN_NODE_VERSION=16"

set "QUIET=false"
set "FORCE=false"
set "NO_LINK=false"

REM Function to print colored output (limited in batch)
:print_info
if "%QUIET%"=="false" echo [INFO] %~1
goto :eof

:print_success
if "%QUIET%"=="false" echo [SUCCESS] %~1
goto :eof

:print_warning
if "%QUIET%"=="false" echo [WARNING] %~1
goto :eof

:print_error
echo [ERROR] %~1 1>&2
goto :eof

:show_usage
echo Usage: install.bat [OPTIONS]
echo.
echo Automated installer for %PROJECT_NAME%
echo.
echo OPTIONS:
echo     --no-link    Skip npm link step (useful for CI or when you don't want global installation)
echo     --force      Force reinstall even if already installed
echo     --quiet      Suppress non-error output
echo     --help       Show this help message
echo.
echo EXIT CODES (for CI reuse):
echo     0  - Success
echo     1  - Node.js not found or version too old
echo     2  - npm not found  
echo     3  - npm install failed
echo     4  - npm run build failed
echo     5  - npm link failed (when not using --no-link)
echo     6  - Invalid command line arguments
echo.
goto :eof

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :start_install
if "%~1"=="--no-link" (
    set "NO_LINK=true"
    shift
    goto :parse_args
)
if "%~1"=="--force" (
    set "FORCE=true"
    shift
    goto :parse_args
)
if "%~1"=="--quiet" (
    set "QUIET=true"
    shift
    goto :parse_args
)
if "%~1"=="--help" (
    call :show_usage
    exit /b 0
)
call :print_error "Unknown option: %~1"
call :show_usage
exit /b 6

:start_install
call :print_info "Starting %PROJECT_NAME% installation..."

REM Step 1: Check Node.js
call :print_info "Checking Node.js installation..."

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    call :print_error "Node.js is not installed or not in PATH."
    echo.
    echo Please install Node.js version %MIN_NODE_VERSION% or higher:
    echo   - Visit: https://nodejs.org/en/download/
    echo   - Or use a version manager like nvm-windows: https://github.com/coreybutler/nvm-windows
    echo.
    echo After installation, restart Command Prompt and run this script again.
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set "NODE_VERSION=%%i"
call :print_info "Found Node.js version: %NODE_VERSION%"

REM Basic version check (simplified for batch)
for /f "tokens=1 delims=.v" %%a in ("%NODE_VERSION%") do set "NODE_MAJOR=%%a"
if %NODE_MAJOR% LSS %MIN_NODE_VERSION% (
    call :print_error "Node.js version %NODE_VERSION% is too old. Required: v%MIN_NODE_VERSION% or higher."
    echo.
    echo Please upgrade Node.js:
    echo   - Visit: https://nodejs.org/en/download/
    echo   - Or use a version manager like nvm-windows
    echo.
    echo After upgrading, restart Command Prompt and run this script again.
    exit /b 1
)

call :print_success "Node.js version check passed (%NODE_VERSION% >= v%MIN_NODE_VERSION%)"

REM Step 2: Check npm
call :print_info "Checking npm installation..."

where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    call :print_error "npm is not installed or not in PATH."
    echo.
    echo npm should be installed with Node.js. Please:
    echo   1. Reinstall Node.js from https://nodejs.org/en/download/
    echo   2. Or install npm separately: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
    echo.
    echo After installation, restart Command Prompt and run this script again.
    exit /b 2
)

for /f "tokens=*" %%i in ('npm --version') do set "NPM_VERSION=%%i"
call :print_success "Found npm version: v%NPM_VERSION%"

REM Step 3: Check if already installed (simplified check)
if "%FORCE%"=="false" if "%NO_LINK%"=="false" (
    where groq >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        call :print_warning "%PROJECT_NAME% appears to already be installed globally."
        call :print_info "Use --force to reinstall or --no-link to skip global installation."
        echo.
        echo Current installation:
        where groq
        groq --version 2>nul || echo Version info not available
        echo.
        echo To continue anyway, run: install.bat --force
        exit /b 0
    )
)

REM Step 4: Run npm install
call :print_info "Installing dependencies..."

if "%QUIET%"=="true" (
    npm install --silent
) else (
    npm install
)
if %ERRORLEVEL% NEQ 0 (
    call :print_error "npm install failed"
    exit /b 3
)

call :print_success "Dependencies installed successfully"

REM Step 5: Run npm run build
call :print_info "Building project..."

if "%QUIET%"=="true" (
    npm run build --silent
) else (
    npm run build
)
if %ERRORLEVEL% NEQ 0 (
    call :print_error "npm run build failed"
    exit /b 4
)

call :print_success "Project built successfully"

REM Step 6: Run npm link (unless --no-link is specified)
if "%NO_LINK%"=="false" (
    call :print_info "Linking package globally..."
    
    if "%QUIET%"=="true" (
        npm link --silent
    ) else (
        npm link
    )
    
    if %ERRORLEVEL% EQU 0 (
        call :print_success "Package linked successfully"
    ) else (
        call :print_error "npm link failed"
        echo.
        echo This might be due to:
        echo   1. Permission issues with your npm global directory
        echo   2. npm configuration problems
        echo.
        echo Try running: npm config get prefix
        echo And ensure you have write permissions to that directory.
        echo.
        echo Alternative: Run this script with --no-link to skip global installation.
        exit /b 5
    )
) else (
    call :print_info "Skipping npm link (--no-link specified)"
)

REM Step 7: Post-install success message
echo.
call :print_success "🎉 %PROJECT_NAME% installation completed successfully!"
echo.

if "%NO_LINK%"=="false" (
    echo The 'groq' command is now available globally. Try:
    echo   groq --help
    echo   groq --version
) else (
    echo To use the CLI without global installation:
    echo   npm start [arguments]
    echo   OR
    echo   node dist/core/cli.js [arguments]
)

echo.
echo 📖 For detailed usage instructions and examples, see:
echo    https://github.com/your-repo/groq-code-cli#usage
echo    or check the README.md file in this directory
echo.
echo 🐛 Found an issue? Report it at:
echo    https://github.com/your-repo/groq-code-cli/issues
echo.

call :print_success "Installation completed with exit code 0"
exit /b 0
