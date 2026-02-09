#!/bin/bash

# Deploy iOS App to App Store Connect
# This script builds and uploads your app to TestFlight

set -e

echo "🚀 Starting iOS App Store deployment..."

# Navigate to iOS directory
cd "$(dirname "$0")"

# Check if we're in the ios directory
if [ ! -f "Podfile" ]; then
    echo "❌ Error: Not in iOS directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
bundle install
pod install --repo-update

# Build and upload
echo "🔨 Building and uploading to TestFlight..."
bundle exec fastlane deploy

echo "✅ Deployment complete! Check App Store Connect for your build."
echo "📱 It will appear in TestFlight within 5-10 minutes after processing."
