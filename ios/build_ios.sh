#!/bin/bash

# iOS Build Script for Striver App - React Native 0.75.4 Compatible
# This script ensures a clean build environment and resolves common build issues

set -e  # Exit on any error

# Color codes for better output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}🚀 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_status "Starting iOS build process for Striver App (React Native 0.75.4)..."

# Navigate to iOS directory
cd "$(dirname "$0")"

print_status "Current directory: $(pwd)"

# Enhanced React Native version validation
print_status "Validating React Native version..."
cd ..

# Check if package.json exists
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found. Please run this script from the React Native project root."
    exit 1
fi

# Extract and validate React Native version
RN_VERSION=$(node -p "require('./package.json').dependencies['react-native']" 2>/dev/null || echo "")
if [[ -z "$RN_VERSION" ]]; then
    print_error "React Native dependency not found in package.json"
    exit 1
fi

print_success "React Native version: $RN_VERSION"

# Strict version validation for React Native 0.75.4
if [[ "$RN_VERSION" == "0.75.4" ]]; then
    print_success "React Native version is exactly 0.75.4 - fully compatible"
elif [[ "$RN_VERSION" =~ ^0\.75\. ]]; then
    print_warning "React Native version $RN_VERSION is in 0.75.x series - should be compatible"
elif [[ "$RN_VERSION" =~ ^\^0\.75\. ]] || [[ "$RN_VERSION" =~ ^~0\.75\. ]]; then
    print_warning "React Native version $RN_VERSION uses semver range - ensure it resolves to 0.75.4"
else
    print_error "React Native version $RN_VERSION is not compatible with this build script"
    print_error "This script is specifically designed for React Native 0.75.4"
    exit 1
fi

cd ios

# Enhanced Node.js installation and version validation
print_status "Verifying Node.js installation and configuration..."

# Function to validate Node.js path
validate_node_path() {
    local node_path="$1"
    if [[ -x "$node_path" ]]; then
        local version=$("$node_path" --version 2>/dev/null || echo "")
        if [[ -n "$version" ]]; then
            echo "$version"
            return 0
        fi
    fi
    return 1
}

# Function to find Node.js installation
find_nodejs() {
    local node_paths=(
        "/usr/local/bin/node"
        "/opt/homebrew/bin/node"
        "$HOME/.nvm/current/bin/node"
        "$(which node 2>/dev/null || echo "")"
    )
    
    # Check NVM current version if available
    if [[ -f "$HOME/.nvm/nvm.sh" ]]; then
        source "$HOME/.nvm/nvm.sh"
        if command -v nvm &> /dev/null; then
            local nvm_current=$(nvm current 2>/dev/null || echo "")
            if [[ "$nvm_current" != "system" ]] && [[ -n "$nvm_current" ]]; then
                node_paths+=("$HOME/.nvm/versions/node/$nvm_current/bin/node")
            fi
        fi
    fi
    
    # Try each path
    for path in "${node_paths[@]}"; do
        if [[ -n "$path" ]]; then
            local version=$(validate_node_path "$path")
            if [[ $? -eq 0 ]]; then
                echo "$path"
                return 0
            fi
        fi
    done
    
    return 1
}

# Find and validate Node.js
NODE_PATH=$(find_nodejs)
if [[ -n "$NODE_PATH" ]]; then
    NODE_VERSION=$("$NODE_PATH" --version)
    print_success "Node.js found at: $NODE_PATH"
    print_success "Node.js version: $NODE_VERSION"
    
    # Enhanced version checking for React Native 0.75.4 compatibility
    NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    NODE_MINOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f2)
    
    if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
        print_error "Node.js version $NODE_VERSION is not supported"
        print_error "React Native 0.75.4 requires Node.js >=18.0.0"
        print_error "Please upgrade Node.js and try again"
        exit 1
    elif [ "$NODE_MAJOR_VERSION" -eq 18 ] && [ "$NODE_MINOR_VERSION" -lt 0 ]; then
        print_error "Node.js version $NODE_VERSION is not supported"
        print_error "React Native 0.75.4 requires Node.js >=18.0.0"
        exit 1
    elif [ "$NODE_MAJOR_VERSION" -gt 20 ]; then
        print_warning "Node.js version $NODE_VERSION is newer than tested versions"
        print_warning "React Native 0.75.4 is tested with Node.js 18.x and 20.x"
        print_warning "Consider using Node.js 18.x or 20.x if you encounter issues"
    else
        print_success "Node.js version $NODE_VERSION is compatible with React Native 0.75.4"
    fi
    
    # Set NODE_BINARY for Xcode builds
    export NODE_BINARY="$NODE_PATH"
    print_success "NODE_BINARY set to: $NODE_BINARY"
else
    print_error "Node.js not found in any standard location"
    print_error "Please install Node.js >=18.0.0 using one of these methods:"
    print_error "  1. Homebrew: brew install node"
    print_error "  2. NVM: nvm install 18 && nvm use 18"
    print_error "  3. Official installer: https://nodejs.org/"
    exit 1
fi

# Verify npm is available and compatible
print_status "Verifying npm installation..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm version: $NPM_VERSION"
    
    # Check npm version compatibility
    NPM_MAJOR_VERSION=$(echo $NPM_VERSION | cut -d'.' -f1)
    if [ "$NPM_MAJOR_VERSION" -lt 8 ]; then
        print_warning "npm version $NPM_VERSION is older than recommended"
        print_warning "Consider upgrading npm: npm install -g npm@latest"
    fi
else
    print_error "npm not found. Please install npm first."
    exit 1
fi

# Enhanced Xcode version compatibility checking
print_status "Checking Xcode version compatibility..."
if command -v xcodebuild &> /dev/null; then
    XCODE_VERSION=$(xcodebuild -version | head -n 1 | awk '{print $2}')
    XCODE_BUILD=$(xcodebuild -version | tail -n 1 | awk '{print $3}')
    print_success "Xcode version: $XCODE_VERSION (Build $XCODE_BUILD)"
    
    # Enhanced version compatibility checking for React Native 0.75.4
    XCODE_MAJOR_VERSION=$(echo $XCODE_VERSION | cut -d'.' -f1)
    XCODE_MINOR_VERSION=$(echo $XCODE_VERSION | cut -d'.' -f2)
    
    if [ "$XCODE_MAJOR_VERSION" -lt 15 ]; then
        print_error "Xcode version $XCODE_VERSION is not supported"
        print_error "React Native 0.75.4 requires Xcode 15.0 or later"
        print_error "Please upgrade Xcode and try again"
        exit 1
    elif [ "$XCODE_MAJOR_VERSION" -eq 15 ]; then
        print_success "Xcode version $XCODE_VERSION is compatible with React Native 0.75.4"
    elif [ "$XCODE_MAJOR_VERSION" -eq 16 ]; then
        if [ "$XCODE_MINOR_VERSION" -ge 2 ]; then
            print_success "Xcode version $XCODE_VERSION is fully compatible (recommended for React Native 0.75.4)"
        else
            print_success "Xcode version $XCODE_VERSION is compatible with React Native 0.75.4"
            print_warning "Consider upgrading to Xcode 16.2+ for optimal compatibility"
        fi
    elif [ "$XCODE_MAJOR_VERSION" -gt 16 ]; then
        print_warning "Xcode version $XCODE_VERSION is newer than tested versions"
        print_warning "React Native 0.75.4 is tested with Xcode 15.x and 16.x"
        print_warning "Monitor for potential compatibility issues"
    fi
    
    # Check command line tools
    print_status "Verifying Xcode command line tools..."
    if xcode-select -p &> /dev/null; then
        XCODE_PATH=$(xcode-select -p)
        print_success "Command line tools configured at: $XCODE_PATH"
    else
        print_warning "Xcode command line tools may not be properly configured"
        print_warning "Run: sudo xcode-select --install"
    fi
else
    print_error "Xcode not found in PATH"
    print_error "Please install Xcode 15.0+ and configure command line tools:"
    print_error "  1. Install Xcode from the App Store"
    print_error "  2. Run: sudo xcode-select --install"
    print_error "  3. Accept the Xcode license: sudo xcodebuild -license accept"
    exit 1
fi

# Enhanced cleanup process for React Native 0.75.4 specific cache locations
print_status "Cleaning previous builds and caches..."

# Clean Xcode build artifacts
print_status "Cleaning Xcode build artifacts..."
rm -rf build/
rm -rf DerivedData/
rm -rf ~/Library/Developer/Xcode/DerivedData/StriverApp-*
rm -rf ~/Library/Developer/Xcode/DerivedData/*StriverApp*

# Clean Xcode caches
print_status "Cleaning Xcode caches..."
rm -rf ~/Library/Caches/com.apple.dt.Xcode/
rm -rf ~/Library/Caches/com.apple.dt.Xcode.Build/

# Clean CocoaPods artifacts and caches
print_status "Cleaning CocoaPods artifacts..."
rm -rf Pods/
rm -f Podfile.lock

# Clean CocoaPods global cache
print_status "Cleaning CocoaPods global cache..."
if command -v pod &> /dev/null; then
    pod cache clean --all
    print_success "CocoaPods cache cleaned"
else
    print_warning "CocoaPods not found - skipping pod cache clean"
fi

# Enhanced React Native 0.75.4 specific cache cleanup
print_status "Cleaning React Native 0.75.4 specific caches..."
cd ..

# Clean node_modules cache directories
rm -rf node_modules/.cache/
rm -rf node_modules/.bin/.cache/

# Clean Metro bundler caches (React Native 0.75.4 specific locations)
rm -rf /tmp/metro-*
rm -rf /tmp/react-*
rm -rf /tmp/haste-map-*
rm -rf ~/.metro
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/react-*

# Clean React Native specific caches
rm -rf /tmp/react-native-*
rm -rf ~/.rncache

# Clean Flipper caches if they exist
rm -rf ~/Library/Caches/Flipper/
rm -rf ~/.flipper/

# Clean Watchman caches if Watchman is installed
if command -v watchman &> /dev/null; then
    print_status "Cleaning Watchman caches..."
    watchman watch-del-all
    print_success "Watchman caches cleaned"
fi

# Clean Yarn cache if Yarn is being used
if [[ -f "yarn.lock" ]] && command -v yarn &> /dev/null; then
    print_status "Cleaning Yarn cache..."
    yarn cache clean
    print_success "Yarn cache cleaned"
fi

# Clean npm cache
print_status "Cleaning npm cache..."
npm cache clean --force
print_success "npm cache cleaned"

print_success "All caches and build artifacts cleaned"

# Install npm dependencies with validation
print_status "Installing npm dependencies..."

# Check if package-lock.json exists and validate it
if [[ -f "package-lock.json" ]]; then
    print_success "Found package-lock.json - using npm ci for faster, reliable installs"
    npm ci
elif [[ -f "yarn.lock" ]]; then
    if command -v yarn &> /dev/null; then
        print_success "Found yarn.lock - using yarn install"
        yarn install --frozen-lockfile
    else
        print_warning "yarn.lock found but yarn not installed - falling back to npm install"
        npm install
    fi
else
    print_warning "No lock file found - using npm install (consider committing package-lock.json)"
    npm install
fi

print_success "Dependencies installed successfully"

cd ios

# Validate CocoaPods installation
print_status "Validating CocoaPods installation..."
if command -v pod &> /dev/null; then
    POD_VERSION=$(pod --version)
    print_success "CocoaPods version: $POD_VERSION"
    
    # Check CocoaPods version compatibility
    POD_MAJOR_VERSION=$(echo $POD_VERSION | cut -d'.' -f1)
    if [ "$POD_MAJOR_VERSION" -lt 1 ]; then
        print_error "CocoaPods version $POD_VERSION is not supported"
        print_error "Please upgrade CocoaPods: sudo gem install cocoapods"
        exit 1
    fi
else
    print_error "CocoaPods not found"
    print_error "Please install CocoaPods: sudo gem install cocoapods"
    exit 1
fi

# Install CocoaPods dependencies with enhanced error handling
print_status "Installing CocoaPods dependencies..."

# Set environment variables for React Native 0.75.4 compatibility
export NO_FLIPPER=1  # Disable Flipper for faster builds (can be removed if Flipper is needed)
export RCT_NEW_ARCH_ENABLED=0  # Disable New Architecture by default (can be enabled if needed)

# Validate Podfile exists
if [[ ! -f "Podfile" ]]; then
    print_error "Podfile not found in ios directory"
    print_error "Please ensure you're running this script from the correct location"
    exit 1
fi

# Run pod install with comprehensive options
print_status "Running pod install with React Native 0.75.4 optimizations..."
if pod install --repo-update --clean-install --verbose; then
    print_success "CocoaPods dependencies installed successfully"
else
    print_error "CocoaPods installation failed"
    print_error "Try the following troubleshooting steps:"
    print_error "  1. Update CocoaPods: sudo gem install cocoapods"
    print_error "  2. Update CocoaPods repo: pod repo update"
    print_error "  3. Clean and retry: rm -rf Pods/ Podfile.lock && pod install"
    exit 1
fi

print_success "iOS build preparation completed successfully!"
echo ""
print_status "Build Environment Summary:"
echo "  📱 React Native: $RN_VERSION"
echo "  🟢 Node.js: $NODE_VERSION (at $NODE_PATH)"
echo "  📦 npm: $NPM_VERSION"
echo "  🔨 Xcode: $XCODE_VERSION"
echo "  🏗️  CocoaPods: $POD_VERSION"
echo ""
print_status "You can now build the project using one of these methods:"
echo "   1. Open StriverApp.xcworkspace in Xcode and build"
echo "   2. Run: xcodebuild -workspace StriverApp.xcworkspace -scheme StriverApp -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 15' build"
echo "   3. Run: npx react-native run-ios"
echo "   4. Run: npx react-native run-ios --simulator='iPhone 15'"
echo ""
print_status "Important Notes:"
echo "   ✅ Always use StriverApp.xcworkspace (not .xcodeproj) when opening in Xcode"
echo "   ✅ NODE_BINARY is configured for Xcode builds: $NODE_BINARY"
echo "   ✅ All caches have been cleaned for a fresh build"
echo "   ✅ React Native 0.75.4 compatibility validated"
echo ""
if [[ "$NO_FLIPPER" == "1" ]]; then
    print_status "Flipper Configuration:"
    echo "   🔧 Flipper is currently DISABLED for faster builds"
    echo "   🔧 To enable Flipper: remove NO_FLIPPER=1 export and run pod install again"
fi
echo ""
print_status "Troubleshooting:"
echo "   🔧 If you encounter build issues, try running this script again"
echo "   🔧 For persistent issues, check the React Native 0.75.4 upgrade guide"
echo "   🔧 Ensure all dependencies are compatible with React Native 0.75.4"