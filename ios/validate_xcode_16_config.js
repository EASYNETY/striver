#!/usr/bin/env node

/**
 * Validation script for Xcode 16.2 compatibility with React Native 0.75.4
 * This script validates that the Xcode project is properly configured for:
 * - Xcode 16.2 compatibility
 * - React Native 0.75.4 build settings
 * - iOS 15.1+ deployment targets
 * - Proper Hermes configuration
 */

const fs = require('fs');
const path = require('path');

const PROJECT_FILE = path.join(__dirname, 'StriverApp.xcodeproj', 'project.pbxproj');
const SCHEME_FILE = path.join(__dirname, 'StriverApp.xcodeproj', 'xcshareddata', 'xcschemes', 'StriverApp.xcscheme');

function validateProjectFile() {
  console.log('🔍 Validating Xcode project configuration...');
  
  if (!fs.existsSync(PROJECT_FILE)) {
    console.error('❌ project.pbxproj file not found');
    return false;
  }

  const projectContent = fs.readFileSync(PROJECT_FILE, 'utf8');
  const validations = [];

  // Check Xcode version compatibility
  if (projectContent.includes('LastUpgradeCheck = 1620')) {
    validations.push('✅ LastUpgradeCheck set to 1620 (Xcode 16.2)');
  } else {
    validations.push('❌ LastUpgradeCheck not set to 1620');
  }

  if (projectContent.includes('compatibilityVersion = "Xcode 16.0"')) {
    validations.push('✅ Compatibility version set to Xcode 16.0');
  } else {
    validations.push('❌ Compatibility version not set to Xcode 16.0');
  }

  if (projectContent.includes('LastSwiftMigration = 1620')) {
    validations.push('✅ Swift migration version set to 1620');
  } else {
    validations.push('❌ Swift migration version not set to 1620');
  }

  // Check deployment targets
  const deploymentTargetMatches = projectContent.match(/IPHONEOS_DEPLOYMENT_TARGET = ([^;]+);/g);
  if (deploymentTargetMatches && deploymentTargetMatches.every(match => match.includes('15.1'))) {
    validations.push('✅ iOS deployment target set to 15.1+ for all targets');
  } else {
    validations.push('❌ iOS deployment target not consistently set to 15.1+');
  }

  // Check React Native specific settings
  if (projectContent.includes('USE_HERMES = true')) {
    validations.push('✅ Hermes engine enabled');
  } else {
    validations.push('❌ Hermes engine not enabled');
  }

  if (projectContent.includes('REACT_NATIVE_PATH = "${PODS_ROOT}/../../node_modules/react-native"')) {
    validations.push('✅ React Native path configured');
  } else {
    validations.push('❌ React Native path not configured');
  }

  // Check C++ standard
  if (projectContent.includes('CLANG_CXX_LANGUAGE_STANDARD = "c++20"')) {
    validations.push('✅ C++20 standard configured');
  } else {
    validations.push('❌ C++20 standard not configured');
  }

  // Check Swift version
  if (projectContent.includes('SWIFT_VERSION = 5.0')) {
    validations.push('✅ Swift 5.0 configured');
  } else {
    validations.push('❌ Swift 5.0 not configured');
  }

  // Check Bitcode (should be disabled for React Native)
  if (projectContent.includes('ENABLE_BITCODE = NO')) {
    validations.push('✅ Bitcode disabled (required for React Native)');
  } else {
    validations.push('❌ Bitcode not disabled');
  }

  validations.forEach(validation => console.log(`  ${validation}`));
  
  const failedValidations = validations.filter(v => v.startsWith('❌'));
  return failedValidations.length === 0;
}

function validateSchemeFile() {
  console.log('\n🔍 Validating Xcode scheme configuration...');
  
  if (!fs.existsSync(SCHEME_FILE)) {
    console.error('❌ StriverApp.xcscheme file not found');
    return false;
  }

  const schemeContent = fs.readFileSync(SCHEME_FILE, 'utf8');
  const validations = [];

  if (schemeContent.includes('LastUpgradeVersion = "1620"')) {
    validations.push('✅ Scheme LastUpgradeVersion set to 1620 (Xcode 16.2)');
  } else {
    validations.push('❌ Scheme LastUpgradeVersion not set to 1620');
  }

  validations.forEach(validation => console.log(`  ${validation}`));
  
  const failedValidations = validations.filter(v => v.startsWith('❌'));
  return failedValidations.length === 0;
}

function validatePackageJson() {
  console.log('\n🔍 Validating package.json React Native version...');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json file not found');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const validations = [];

  if (packageJson.dependencies && packageJson.dependencies['react-native'] === '0.75.4') {
    validations.push('✅ React Native 0.75.4 configured in package.json');
  } else {
    validations.push('❌ React Native 0.75.4 not configured in package.json');
  }

  if (packageJson.engines && packageJson.engines.node && packageJson.engines.node.includes('18')) {
    validations.push('✅ Node.js 18+ requirement specified');
  } else {
    validations.push('❌ Node.js 18+ requirement not specified');
  }

  validations.forEach(validation => console.log(`  ${validation}`));
  
  const failedValidations = validations.filter(v => v.startsWith('❌'));
  return failedValidations.length === 0;
}

function main() {
  console.log('🚀 Xcode 16.2 & React Native 0.75.4 Configuration Validator\n');
  
  const projectValid = validateProjectFile();
  const schemeValid = validateSchemeFile();
  const packageValid = validatePackageJson();
  
  console.log('\n📊 Validation Summary:');
  console.log(`  Project file: ${projectValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`  Scheme file: ${schemeValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`  Package.json: ${packageValid ? '✅ Valid' : '❌ Invalid'}`);
  
  if (projectValid && schemeValid && packageValid) {
    console.log('\n🎉 All validations passed! Your Xcode project is configured for Xcode 16.2 and React Native 0.75.4.');
    console.log('\n📝 Next steps:');
    console.log('  1. Run `pod install` to update CocoaPods dependencies');
    console.log('  2. Open the project in Xcode 16.2 on macOS');
    console.log('  3. Build and test the project');
    process.exit(0);
  } else {
    console.log('\n❌ Some validations failed. Please review the issues above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('  - Ensure all Xcode project settings are properly configured');
    console.log('  - Verify React Native version in package.json');
    console.log('  - Check that deployment targets are set to iOS 15.1+');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  validateProjectFile,
  validateSchemeFile,
  validatePackageJson
};