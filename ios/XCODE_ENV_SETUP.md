# Xcode Environment Setup Guide

## Overview

The `.xcode.env.local` file has been enhanced with robust Node.js path detection to ensure compatibility with React Native 0.75.4 and various Node.js installation methods. This configuration automatically detects and validates Node.js installations across different environments.

## Features

### 🔍 Multi-Method Node.js Detection

The enhanced configuration supports multiple Node.js installation methods with automatic fallback:

1. **PATH-based detection** - Uses `command -v node` for standard installations
2. **NVM support** - Automatically detects and sources nvm environments
3. **Homebrew support** - Checks both Apple Silicon (`/opt/homebrew`) and Intel (`/usr/local`) paths
4. **System-wide installations** - Fallback to common system paths
5. **Manual override** - Supports custom Node.js binary paths

### ✅ Version Validation

- **React Native 0.75.4 Compatibility**: Ensures Node.js version >=18.0.0
- **Clear Error Messages**: Provides specific guidance when version requirements aren't met
- **Build-time Validation**: Validates Node.js availability before Xcode builds

### 🛠️ Environment Optimization

- **Memory Configuration**: Sets `NODE_OPTIONS="--max-old-space-size=8192"` for large projects
- **PATH Management**: Ensures npm/yarn can find the correct Node.js binary
- **Build Integration**: Seamlessly integrates with Xcode build processes

## Installation Methods Supported

### Node Version Manager (nvm)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js 18+
nvm install 18
nvm use 18
```

### Homebrew

```bash
# Apple Silicon Macs
brew install node

# Intel Macs (also supported)
brew install node
```

### Direct Installation

Download from [nodejs.org](https://nodejs.org/) - the configuration will automatically detect standard installation paths.

## Configuration Details

### Automatic Detection Flow

1. **Primary Detection**: Uses `command -v node` for PATH-based installations
2. **NVM Integration**: Sources nvm environment if available
3. **NVM Fallback**: Checks `~/.nvm/versions/node/` directories
4. **Homebrew Paths**: Checks both Apple Silicon and Intel Homebrew paths
5. **System Paths**: Falls back to common system installation locations
6. **Which Command**: Final fallback using `which node`

### Error Handling

The configuration provides comprehensive error handling:

- **Missing Node.js**: Clear installation instructions with multiple options
- **Version Incompatibility**: Specific guidance for upgrading Node.js
- **Path Issues**: Detailed troubleshooting information

### Environment Variables

The configuration exports the following variables:

- `NODE_BINARY`: Path to the detected Node.js executable
- `NODE_OPTIONS`: Memory optimization settings
- `PATH`: Updated to include Node.js directory

## Testing

### Validation Script

Run the validation script to test the configuration:

```bash
# From the ios directory
node validate_xcode_env.cjs
```

### Manual Testing

Test the configuration manually:

```bash
# Source the configuration
cd ios
source .xcode.env.local

# Verify NODE_BINARY is set
echo $NODE_BINARY

# Test Node.js execution
$NODE_BINARY --version
```

## Troubleshooting

### Common Issues

1. **Node.js Not Found**
   - Install Node.js using one of the supported methods
   - Ensure Node.js is in your PATH
   - Check that the installation is complete

2. **Version Compatibility**
   - Upgrade to Node.js 18+ for React Native 0.75.4 compatibility
   - Use nvm to manage multiple Node.js versions

3. **Permission Issues**
   - Ensure the Node.js binary is executable
   - Check file permissions on the installation directory

### Debug Mode

To debug the detection process, you can add debug output:

```bash
# Add to .xcode.env.local for debugging
set -x  # Enable debug mode
# ... existing configuration ...
set +x  # Disable debug mode
```

## Integration with Xcode

The configuration integrates seamlessly with Xcode builds:

1. **Build Phases**: Xcode automatically sources `.xcode.env.local` during build
2. **React Native CLI**: Works with `npx react-native run-ios`
3. **Metro Bundler**: Ensures correct Node.js version for JavaScript bundling

## Compatibility

- **React Native**: 0.75.4+
- **Node.js**: 18.0.0+
- **Xcode**: 16.2+
- **macOS**: All supported versions
- **Installation Methods**: nvm, Homebrew, direct installation, system-wide

## Migration from Previous Configuration

The enhanced configuration is backward compatible. No manual migration is required - the new detection logic will automatically work with existing Node.js installations.

## Support

For issues with the Node.js path detection:

1. Run the validation script: `node validate_xcode_env.cjs`
2. Check the console output for specific error messages
3. Verify Node.js installation and version compatibility
4. Ensure proper file permissions on the Node.js binary

## Next Steps

1. **Deploy to MacinCloud**: Test the configuration on the target macOS environment
2. **Xcode Integration**: Verify builds work correctly with the enhanced configuration
3. **Team Setup**: Share the configuration with team members for consistent builds