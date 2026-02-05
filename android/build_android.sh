#!/bin/bash

# Android Build Script for StriverApp
# React Native 0.75.4 + Android Gradle Plugin 8.6.0

set -e

echo "🤖 Starting Android build process..."
echo ""

# Check if we're in the android directory
if [ ! -f "build.gradle" ]; then
    echo "❌ Error: Must run from android/ directory"
    exit 1
fi

# Check for google-services.json
if [ ! -f "app/google-services.json" ]; then
    echo "⚠️  Warning: google-services.json not found"
    echo "   Firebase features may not work properly"
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
./gradlew clean

# Build debug APK
echo ""
echo "🔨 Building debug APK..."
./gradlew assembleDebug

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📦 APK location:"
    echo "   app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "To install on device/emulator, run:"
    echo "   adb install app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "Or run the app directly:"
    echo "   cd .. && npx react-native run-android"
else
    echo ""
    echo "❌ Build failed!"
    exit 1
fi
