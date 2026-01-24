/**
 * Windows-compatible validation script for iOS build configuration
 * Validates Podfile and build script configurations for React Native 0.75.4
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating iOS build configuration for React Native 0.75.4...\n');

let allTestsPassed = true;

// Test 1: Validate Podfile exists and has required configurations
console.log('Test 1: Validating Podfile configuration...');
const podfilePath = path.join(__dirname, 'Podfile');

if (!fs.existsSync(podfilePath)) {
    console.log('❌ Podfile not found');
    allTestsPassed = false;
} else {
    console.log('✅ Podfile found');
    
    const podfileContent = fs.readFileSync(podfilePath, 'utf8');
    
    const requiredConfigs = [
        { name: 'min_ios_version_supported usage', pattern: /min_ios_version_supported/ },
        { name: 'Static framework linkage', pattern: /use_frameworks!\s*:linkage\s*=>\s*:static/ },
        { name: 'Conditional FlipperConfiguration', pattern: /FlipperConfiguration\.(enabled|disabled)/ },
        { name: 'React Native post-install hook', pattern: /react_native_post_install/ },
        { name: 'Firebase SDK version pinning', pattern: /\$FirebaseSDKVersion\s*=\s*['"]10\.28\.0['"]/ },
        { name: 'Header search paths configuration', pattern: /HEADER_SEARCH_PATHS/ },
        { name: 'C++20 language standard', pattern: /CLANG_CXX_LANGUAGE_STANDARD.*c\+\+20/ },
        { name: 'User script sandboxing disabled', pattern: /ENABLE_USER_SCRIPT_SANDBOXING.*NO/ }
    ];
    
    requiredConfigs.forEach(config => {
        if (podfileContent.match(config.pattern)) {
            console.log(`✅ ${config.name}`);
        } else {
            console.log(`❌ ${config.name} - MISSING`);
            allTestsPassed = false;
        }
    });
}

// Test 2: Validate .xcode.env.local exists and has NODE_BINARY
console.log('\nTest 2: Validating .xcode.env.local configuration...');
const xcodeEnvPath = path.join(__dirname, '.xcode.env.local');

if (!fs.existsSync(xcodeEnvPath)) {
    console.log('❌ .xcode.env.local not found');
    allTestsPassed = false;
} else {
    console.log('✅ .xcode.env.local found');
    
    const envContent = fs.readFileSync(xcodeEnvPath, 'utf8');
    
    if (envContent.includes('NODE_BINARY')) {
        console.log('✅ NODE_BINARY configured');
    } else {
        console.log('❌ NODE_BINARY not configured');
        allTestsPassed = false;
    }
    
    if (envContent.includes('detect_node_binary')) {
        console.log('✅ Enhanced Node.js detection implemented');
    } else {
        console.log('❌ Enhanced Node.js detection not implemented');
        allTestsPassed = false;
    }
}

// Test 3: Validate build_ios.sh exists and has React Native 0.75.4 compatibility
console.log('\nTest 3: Validating build_ios.sh script...');
const buildScriptPath = path.join(__dirname, 'build_ios.sh');

if (!fs.existsSync(buildScriptPath)) {
    console.log('❌ build_ios.sh not found');
    allTestsPassed = false;
} else {
    console.log('✅ build_ios.sh found');
    
    const buildContent = fs.readFileSync(buildScriptPath, 'utf8');
    
    const buildChecks = [
        { name: 'React Native 0.75.4 compatibility', pattern: /React Native 0\.75\.4/ },
        { name: 'Enhanced Node.js validation', pattern: /validate_node_path/ },
        { name: 'Xcode version checking', pattern: /XCODE_VERSION/ },
        { name: 'Enhanced cleanup process', pattern: /React Native 0\.75\.4 specific cache/ },
        { name: 'CocoaPods validation', pattern: /POD_VERSION/ }
    ];
    
    buildChecks.forEach(check => {
        if (buildContent.match(check.pattern)) {
            console.log(`✅ ${check.name}`);
        } else {
            console.log(`❌ ${check.name} - MISSING`);
            allTestsPassed = false;
        }
    });
}

// Test 4: Check for validation scripts
console.log('\nTest 4: Validating helper scripts...');
const helperScripts = [
    'validate_podfile.rb',
    'validate_xcode_env.cjs',
    'test_build_config.sh'
];

helperScripts.forEach(script => {
    const scriptPath = path.join(__dirname, script);
    if (fs.existsSync(scriptPath)) {
        console.log(`✅ ${script} found`);
    } else {
        console.log(`❌ ${script} not found`);
        allTestsPassed = false;
    }
});

// Test 5: Check for documentation files
console.log('\nTest 5: Validating documentation...');
const docFiles = [
    'README_BUILD_SETUP.md',
    'XCODE_ENV_SETUP.md'
];

docFiles.forEach(doc => {
    const docPath = path.join(__dirname, doc);
    if (fs.existsSync(docPath)) {
        console.log(`✅ ${doc} found`);
    } else {
        console.log(`⚠️  ${doc} not found (optional)`);
    }
});

// Summary
console.log('\n' + '='.repeat(50));

if (allTestsPassed) {
    console.log('🎉 All configuration tests PASSED!');
    console.log('✅ iOS build configuration is ready for React Native 0.75.4');
    console.log('\nConfiguration Summary:');
    console.log('- Podfile: React Native 0.75.4 compatible with Firebase SDK 10.28.0');
    console.log('- Node.js: Enhanced detection with multiple fallback methods');
    console.log('- Build Script: Comprehensive validation and cleanup');
    console.log('- Helper Scripts: Validation tools available');
    console.log('\nNext steps for MacinCloud testing:');
    console.log('1. Run: ./build_ios.sh');
    console.log('2. Run: ruby validate_podfile.rb (detailed validation)');
    console.log('3. Open StriverApp.xcworkspace in Xcode and build');
    process.exit(0);
} else {
    console.log('❌ Some configuration tests FAILED!');
    console.log('Please review the errors above and fix the configuration');
    process.exit(1);
}