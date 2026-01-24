#!/bin/bash

# Test script to validate iOS build configuration for React Native 0.75.4
# Run this script on macOS to validate the build setup

echo "🧪 Testing iOS build configuration for React Native 0.75.4..."

# Navigate to iOS directory
cd "$(dirname "$0")"

echo "📍 Current directory: $(pwd)"

# Test 1: Validate Podfile syntax
echo "🔍 Test 1: Validating Podfile syntax..."
if ruby -c Podfile > /dev/null 2>&1; then
    echo "✅ Podfile syntax is valid"
else
    echo "❌ Podfile syntax error"
    exit 1
fi

# Test 2: Check for required configurations
echo "🔍 Test 2: Checking required configurations..."

required_configs=(
    "min_ios_version_supported"
    "use_frameworks.*:linkage.*:static"
    "FlipperConfiguration"
    "react_native_post_install"
    "FirebaseSDKVersion.*10.28.0"
    "HEADER_SEARCH_PATHS"
    "CLANG_CXX_LANGUAGE_STANDARD.*c\+\+20"
    "ENABLE_USER_SCRIPT_SANDBOXING.*NO"
)

all_configs_found=true

for config in "${required_configs[@]}"; do
    if grep -q "$config" Podfile; then
        echo "✅ Found: $config"
    else
        echo "❌ Missing: $config"
        all_configs_found=false
    fi
done

# Test 3: Validate Node.js configuration
echo "🔍 Test 3: Validating Node.js configuration..."
if [ -f ".xcode.env.local" ]; then
    echo "✅ .xcode.env.local exists"
    if grep -q "NODE_BINARY" .xcode.env.local; then
        echo "✅ NODE_BINARY configured"
    else
        echo "❌ NODE_BINARY not configured"
        all_configs_found=false
    fi
else
    echo "❌ .xcode.env.local not found"
    all_configs_found=false
fi

# Test 4: Check build script
echo "🔍 Test 4: Validating build script..."
if [ -f "build_ios.sh" ]; then
    echo "✅ build_ios.sh exists"
    if grep -q "React Native 0.75.4" build_ios.sh; then
        echo "✅ Build script mentions React Native 0.75.4"
    else
        echo "⚠️  Build script doesn't mention React Native 0.75.4"
    fi
else
    echo "❌ build_ios.sh not found"
    all_configs_found=false
fi

# Test 5: Validate Ruby validation script
echo "🔍 Test 5: Validating Ruby validation script..."
if [ -f "validate_podfile.rb" ]; then
    echo "✅ validate_podfile.rb exists"
    if ruby -c validate_podfile.rb > /dev/null 2>&1; then
        echo "✅ validate_podfile.rb syntax is valid"
    else
        echo "❌ validate_podfile.rb syntax error"
        all_configs_found=false
    fi
else
    echo "❌ validate_podfile.rb not found"
    all_configs_found=false
fi

echo ""
echo "="*50

if [ "$all_configs_found" = true ]; then
    echo "🎉 All configuration tests PASSED!"
    echo "✅ iOS build configuration is ready for React Native 0.75.4"
    echo ""
    echo "Next steps:"
    echo "1. Run: ./build_ios.sh"
    echo "2. Run: ruby validate_podfile.rb (optional detailed validation)"
    echo "3. Open StriverApp.xcworkspace in Xcode and build"
    exit 0
else
    echo "❌ Some configuration tests FAILED!"
    echo "Please review the errors above and fix the configuration"
    exit 1
fi