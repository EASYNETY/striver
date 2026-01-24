# iOS Build Setup for React Native 0.75.4

This document describes the iOS build configuration for the Striver App, specifically optimized for React Native 0.75.4 compatibility.

## Overview

The iOS build configuration has been updated to address compatibility issues with React Native 0.75.4, including:

- ✅ FlipperConfiguration conditional usage
- ✅ Proper iOS deployment target configuration
- ✅ Static framework linkage for Swift dependencies
- ✅ React Native 0.75.4 compatible post-install hooks
- ✅ Firebase SDK 10.28.0 compatibility
- ✅ Enhanced header search paths
- ✅ Node.js path configuration with fallback support

## Requirements

- **Node.js**: >=18.0.0 (required by React Native 0.75.4)
- **Xcode**: 15.0+ (recommended: 16.2)
- **CocoaPods**: Latest version
- **React Native**: 0.75.4
- **iOS Deployment Target**: 15.1+

## Quick Start

1. **Run the build script** (recommended):
   ```bash
   cd ios
   ./build_ios.sh
   ```

2. **Manual setup** (if needed):
   ```bash
   cd ios
   pod install --repo-update --clean-install
   ```

3. **Open in Xcode**:
   ```bash
   open StriverApp.xcworkspace
   ```

## Configuration Files

### Podfile
The main CocoaPods configuration file with React Native 0.75.4 optimizations:

- **FlipperConfiguration**: Conditional based on `NO_FLIPPER` environment variable
- **Static Framework Linkage**: Required for Swift dependencies
- **Firebase SDK**: Pinned to version 10.28.0
- **Header Search Paths**: Enhanced for React Native 0.75.4 architecture
- **Build Settings**: Optimized for C++20 and React Native 0.75.4

### .xcode.env.local
Node.js path configuration with automatic detection and fallback support:

- Auto-detects Node.js installation (nvm, Homebrew, direct)
- Validates Node.js version compatibility
- Provides fallback paths for different installation methods

### build_ios.sh
Comprehensive build script with validation and cleanup:

- Validates React Native and Node.js versions
- Cleans build caches and artifacts
- Installs dependencies with proper flags
- Provides clear next steps and troubleshooting

## Validation

### Automated Testing
Run the configuration test script:
```bash
cd ios
./test_build_config.sh
```

### Detailed Podfile Validation
Run the Ruby validation script:
```bash
cd ios
ruby validate_podfile.rb
```

### Manual Validation
1. Check that `pod install` completes without errors
2. Verify Xcode can open the workspace without warnings
3. Ensure builds complete successfully for both simulator and device

## Troubleshooting

### Common Issues

#### FlipperConfiguration Error
```
uninitialized constant Pod::Podfile::FlipperConfiguration
```
**Solution**: The Podfile now uses conditional FlipperConfiguration. If you encounter this error, ensure you're using the updated Podfile.

#### Node.js Not Found
```
Node.js not found during Xcode builds
```
**Solution**: Check `.xcode.env.local` configuration and ensure Node.js is properly installed.

#### Header File Not Found
```
'RCTThirdPartyFabricComponentsProvider.h' file not found
```
**Solution**: The updated Podfile includes enhanced header search paths. Run `pod install` again.

#### Build Settings Conflicts
```
Build setting conflicts between dependencies
```
**Solution**: The post-install hooks now handle build setting conflicts automatically.

### Build Script Options

#### Disable Flipper (faster builds)
```bash
export NO_FLIPPER=1
./build_ios.sh
```

#### Enable Flipper (for debugging)
```bash
unset NO_FLIPPER
./build_ios.sh
```

#### Clean Everything
The build script automatically cleans:
- Xcode build artifacts
- CocoaPods cache
- React Native caches
- Node modules cache

## Architecture Support

### Supported Architectures
- **iOS Simulator**: x86_64, arm64
- **iOS Device**: arm64
- **Deployment Target**: iOS 15.1+

### Build Configurations
- **Debug**: Optimized for development with faster builds
- **Release**: Optimized for production with full optimizations

## Dependencies

### Core Dependencies
- React Native 0.75.4
- Firebase SDK 10.28.0
- Hermes JavaScript Engine (enabled)
- Static Framework Linkage

### Third-party SDKs
- Google Sign-In
- Stripe SDK
- Apple Authentication
- Notifee (notifications)

## Performance Optimizations

### Build Time Optimizations
- Static framework linkage
- Disabled Flipper by default
- Optimized header search paths
- C++20 language standard
- Disabled unnecessary build features

### Runtime Optimizations
- Hermes JavaScript engine
- Dead code stripping
- Optimized compiler flags
- Proper deployment target alignment

## Next Steps

After successful configuration:

1. **Test the build**:
   ```bash
   npx react-native run-ios
   ```

2. **Build for device**:
   ```bash
   npx react-native run-ios --device
   ```

3. **Archive for distribution**:
   - Open Xcode
   - Select "Any iOS Device" 
   - Product → Archive

## Support

If you encounter issues:

1. Run the validation scripts first
2. Check the troubleshooting section
3. Ensure all requirements are met
4. Review Xcode build logs for specific errors

## Version History

- **v1.0**: Initial React Native 0.75.4 compatibility update
  - Updated FlipperConfiguration usage
  - Enhanced header search paths
  - Added Firebase SDK 10.28.0 compatibility
  - Improved Node.js path detection
  - Added comprehensive validation scripts