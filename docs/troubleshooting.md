# Troubleshooting Guide

This guide covers common issues you might encounter when installing, developing, or using the Groq Code CLI.

## Node.js Permission Issues

### Global Installation Permission Errors (Unix/Linux/macOS)

**Problem**: Permission denied when installing globally with npm
```bash
npm install -g groq-code-cli
# Error: EACCES: permission denied
```

**Solutions**:

#### Option 1: Use npx (Recommended for testing)
```bash
# Try the CLI without installing
npx groq-code-cli@latest
```

#### Option 2: Fix npm permissions
```bash
# Create a directory for global packages
mkdir ~/.npm-global

# Configure npm to use the new directory
npm config set prefix '~/.npm-global'

# Add to your shell profile (.bashrc, .zshrc, etc.)
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Now install globally
npm install -g groq-code-cli
```

#### Option 3: Use sudo (Not recommended for security reasons)
```bash
sudo npm install -g groq-code-cli
```

#### Option 4: Use a Node.js version manager (Recommended)
```bash
# Install nvm first, then:
nvm install node
nvm use node
npm install -g groq-code-cli
```

### Windows Permission Issues

**Problem**: Access denied on Windows
```cmd
npm install -g groq-code-cli
# Access is denied
```

**Solutions**:

#### Option 1: Run as Administrator
- Right-click Command Prompt or PowerShell
- Select "Run as administrator"
- Run the install command

#### Option 2: Use Windows Package Manager
```powershell
# If you have winget
winget install OpenJS.NodeJS

# Then install the CLI
npm install -g groq-code-cli
```

#### Option 3: Change npm prefix (PowerShell)
```powershell
# Create a directory for global packages
New-Item -ItemType Directory -Path "$env:USERPROFILE\npm-global" -Force

# Configure npm
npm config set prefix "$env:USERPROFILE\npm-global"

# Add to PATH (add this to your PowerShell profile)
$env:PATH += ";$env:USERPROFILE\npm-global"

# Install
npm install -g groq-code-cli
```

## NVM (Node Version Manager) Conflicts

### Version Conflicts
**Problem**: CLI installed with one Node version but using another
```bash
groq: command not found
# or
groq: no such file or directory
```

**Solutions**:

#### Check Current Node Version
```bash
nvm current
node --version
npm --version
```

#### Install CLI with Current Node Version
```bash
# Switch to the Node version you want to use
nvm use 18  # or your preferred version

# Install the CLI with this version
npm install -g groq-code-cli

# Verify installation
which groq
groq --version
```

#### Set Default Node Version
```bash
# Set a default Node version for new terminals
nvm alias default 18

# Use the default version
nvm use default
```

### Multiple Node Installations
**Problem**: System Node vs NVM Node conflicts

**Solution**: Ensure you're using NVM consistently
```bash
# Check what's being used
which node
which npm

# Should show paths like:
# ~/.nvm/versions/node/v18.x.x/bin/node
# ~/.nvm/versions/node/v18.x.x/bin/npm

# If showing system paths, switch to NVM
nvm use default
```

## Windows-Specific Issues

### PowerShell Execution Policy
**Problem**: Scripts cannot be executed in PowerShell
```powershell
groq : cannot be loaded because running scripts is disabled
```

**Solution**: Update execution policy
```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy for current user (recommended)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or for all users (requires admin)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned
```

### Windows Subsystem for Linux (WSL) Issues
**Problem**: CLI works in WSL but not in Windows Command Prompt

**Solutions**:
- Install separately in both environments
- Or use WSL consistently for development

```bash
# In WSL
npm install -g groq-code-cli

# In Windows Command Prompt (separate installation needed)
npm install -g groq-code-cli
```

### Path Issues on Windows
**Problem**: `groq` command not found after installation

**Solution**: Verify and fix PATH
```cmd
# Check if npm global bin is in PATH
npm config get prefix

# Should return something like: C:\Users\YourName\AppData\Roaming\npm
# Make sure this path (plus \bin) is in your system PATH
```

## Common Installation Issues

### Network/Proxy Issues
**Problem**: Cannot download packages

**Solutions**:
```bash
# Check npm configuration
npm config list

# If behind a corporate proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Or use alternative registry
npm config set registry https://registry.npmjs.org/
```

### Outdated Node.js Version
**Problem**: CLI requires newer Node.js version

**Solution**: Update Node.js
```bash
# Check current version
node --version

# Update via NVM
nvm install --lts
nvm use --lts

# Or download latest from nodejs.org
```

### Conflicting Global Packages
**Problem**: Other CLI tools conflict with `groq` command

**Solution**: Check for conflicts
```bash
# See what's using the groq command
which groq
type groq

# List all global packages
npm list -g --depth=0

# Uninstall conflicting packages if needed
npm uninstall -g conflicting-package
```

## Development Issues

### Build Failures
**Problem**: TypeScript compilation errors during development

**Solutions**:
```bash
# Clean build
rm -rf dist/ node_modules/
npm install
npm run build

# Check TypeScript version
npx tsc --version

# Use specific TypeScript version if needed
npm install typescript@4.9.5 --save-dev
```

### Watch Mode Not Working
**Problem**: `npm run dev` doesn't detect file changes

**Solutions**:
```bash
# Check if file watching is working
npm run dev -- --verbose

# Increase file watcher limits (Linux/macOS)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Restart watch mode
npm run dev
```

### Linking Issues
**Problem**: Changes not reflected after `npm link`

**Solutions**:
```bash
# Re-link the package
npm unlink
npm run build
npm link

# Or use absolute path
npm link /absolute/path/to/groq-code-cli

# Check link status
npm list -g --depth=0
ls -la $(which groq)
```

## Runtime Issues

### API Key Problems
**Problem**: Authentication failures or API key not found

**Solutions**:
```bash
# Check if API key is set
echo $GROQ_API_KEY

# Check config file
cat ~/.groq/config.json

# Re-login
groq
# Then use: /login
```

### Memory Issues
**Problem**: CLI consumes too much memory

**Solutions**:
```bash
# Check memory usage
ps aux | grep groq

# Limit Node.js memory usage
export NODE_OPTIONS="--max-old-space-size=2048"
groq

# Clear chat history if needed
groq
# Then use: /clear
```

### Performance Issues
**Problem**: CLI is slow to start or respond

**Solutions**:
```bash
# Enable debug mode to identify bottlenecks
groq --debug

# Check for large log files
ls -la debug-agent.log

# Clear logs if needed
rm debug-agent.log
```

## Getting Help

### Debug Information
When reporting issues, include:
```bash
# System information
node --version
npm --version
groq --version

# Operating system
uname -a  # Linux/macOS
ver       # Windows

# Installation method
npm list -g groq-code-cli

# Debug logs (if applicable)
tail -20 debug-agent.log
```

### Common Debug Commands
```bash
# Enable verbose npm output
npm install -g groq-code-cli --verbose

# Check npm configuration
npm doctor

# Verify package integrity
npm ls groq-code-cli

# Test basic functionality
groq --help
```

### Where to Get Support
1. **GitHub Issues**: [Report bugs or request features](https://github.com/build-with-groq/groq-code-cli/issues)
2. **Documentation**: Check README.md and other docs/ files
3. **Community**: Share on Groq's social channels
4. **Debug Logs**: Always include debug output when possible

### Before Reporting Issues
1. Update to the latest version
2. Try a clean installation
3. Check if the issue occurs with `npx groq-code-cli@latest`
4. Include complete error messages and system information
5. Describe steps to reproduce the problem

This troubleshooting guide covers the most common issues. If you encounter problems not covered here, please open an issue on GitHub with detailed information about your system and the specific problem you're experiencing.
