#!/bin/bash

# iOS Build Script for Striver App
# This script ensures a clean build environment and resolves common build issues

set -e  # Exit on any error

echo "🚀 Starting iOS build process for Striver App..."

# Navigate to iOS directory
cd "$(dirname "$0")"

echo "📍 Current directory: $(pwd)"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf build/
rm -rf DerivedData/
rm -rf ~/Library/Developer/Xcode/DerivedData/StriverApp-*

# Clean CocoaPods cache
echo "🧹 Cleaning CocoaPods cache..."
rm -rf Pods/
rm -f Podfile.lock

# Clear CocoaPods cache
pod cache clean --all

# Install dependencies
echo "📦 Installing CocoaPods dependencies..."
pod install --repo-update --clean-install

# Verify Node.js is available
echo "🔍 Verifying Node.js installation..."
if command -v node &> /dev/null; then
    echo "✅ Node.js version: $(node --version)"
else
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Verify npm is available
if command -v npm &> /dev/null; then
    echo "✅ npm version: $(npm --version)"
else
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

# Install npm dependencies (from root directory)
echo "📦 Installing npm dependencies..."
cd ..
npm install
cd ios

echo "✅ iOS build preparation completed successfully!"
echo ""
echo "🏗️  You can now build the project using one of these methods:"
echo "   1. Open StriverApp.xcworkspace in Xcode and build"
echo "   2. Run: xcodebuild -workspace StriverApp.xcworkspace -scheme StriverApp -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 15' build"
echo "   3. Run: npx react-native run-ios"
echo ""
echo "📝 Note: Make sure to use StriverApp.xcworkspace (not .xcodeproj) when opening in Xcode"