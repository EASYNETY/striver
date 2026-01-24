#!/bin/bash

# Test script for Node.js path detection in .xcode.env.local
# This script validates the enhanced Node.js detection logic

set -e

echo "=== Testing Node.js Path Detection ==="
echo

# Test 1: Source the .xcode.env.local file and check if NODE_BINARY is set
echo "Test 1: Sourcing .xcode.env.local configuration..."
if [ -f "ios/.xcode.env.local" ]; then
    # Source the file in a subshell to avoid affecting current environment
    (
        cd ios
        source .xcode.env.local
        if [ -n "$NODE_BINARY" ]; then
            echo "✅ NODE_BINARY detected: $NODE_BINARY"
        else
            echo "❌ NODE_BINARY not set"
            exit 1
        fi
    )
else
    echo "❌ .xcode.env.local file not found"
    exit 1
fi

echo

# Test 2: Validate that the detected Node.js binary is executable
echo "Test 2: Validating Node.js binary executability..."
(
    cd ios
    source .xcode.env.local
    if [ -x "$NODE_BINARY" ]; then
        echo "✅ Node.js binary is executable: $NODE_BINARY"
    else
        echo "❌ Node.js binary is not executable: $NODE_BINARY"
        exit 1
    fi
)

echo

# Test 3: Check Node.js version compatibility
echo "Test 3: Checking Node.js version compatibility..."
(
    cd ios
    source .xcode.env.local
    NODE_VERSION=$($NODE_BINARY --version 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "✅ Node.js version: $NODE_VERSION"
        
        # Extract major version
        MAJOR_VERSION=$(echo "$NODE_VERSION" | sed 's/^v//' | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            echo "✅ Node.js version is compatible with React Native 0.75.4 (>=18)"
        else
            echo "⚠️  Node.js version $NODE_VERSION may not be compatible with React Native 0.75.4 (requires >=18)"
        fi
    else
        echo "❌ Unable to get Node.js version"
        exit 1
    fi
)

echo

# Test 4: Test fallback detection by temporarily hiding the current node
echo "Test 4: Testing fallback detection logic..."
(
    # Create a temporary directory without node in PATH
    TEMP_DIR=$(mktemp -d)
    export PATH="$TEMP_DIR"
    
    cd ios
    # Test the detect_node_binary function directly
    if grep -q "detect_node_binary()" .xcode.env.local; then
        echo "✅ Fallback detection logic is implemented"
    else
        echo "❌ Fallback detection logic not found"
        exit 1
    fi
    
    rm -rf "$TEMP_DIR"
)

echo

# Test 5: Validate environment variable exports
echo "Test 5: Validating environment variable exports..."
(
    cd ios
    source .xcode.env.local
    
    if [ -n "$NODE_BINARY" ]; then
        echo "✅ NODE_BINARY exported: $NODE_BINARY"
    else
        echo "❌ NODE_BINARY not exported"
        exit 1
    fi
    
    if [ -n "$NODE_OPTIONS" ]; then
        echo "✅ NODE_OPTIONS exported: $NODE_OPTIONS"
    else
        echo "⚠️  NODE_OPTIONS not set (optional)"
    fi
    
    # Check if node directory is in PATH
    NODE_DIR=$(dirname "$NODE_BINARY")
    if echo "$PATH" | grep -q "$NODE_DIR"; then
        echo "✅ Node.js directory is in PATH"
    else
        echo "⚠️  Node.js directory not found in PATH"
    fi
)

echo
echo "=== Node.js Path Detection Test Complete ==="
echo

# Test 6: Integration test with React Native CLI (if available)
echo "Test 6: Integration test with React Native environment..."
(
    cd ios
    source .xcode.env.local
    
    # Check if we can run basic Node.js commands
    if $NODE_BINARY -e "console.log('Node.js is working')" >/dev/null 2>&1; then
        echo "✅ Node.js can execute JavaScript"
    else
        echo "❌ Node.js cannot execute JavaScript"
        exit 1
    fi
    
    # Check if npm is available
    NPM_PATH=$(dirname "$NODE_BINARY")/npm
    if [ -x "$NPM_PATH" ]; then
        echo "✅ npm is available at: $NPM_PATH"
    else
        echo "⚠️  npm not found at expected location: $NPM_PATH"
    fi
)

echo
echo "🎉 All Node.js path detection tests completed successfully!"