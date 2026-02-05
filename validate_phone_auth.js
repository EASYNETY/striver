#!/usr/bin/env node

/**
 * Phone Authentication Configuration Validator
 * 
 * This script checks if your Firebase Phone Authentication is properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Phone Authentication Configuration...\n');

let hasErrors = false;
let hasWarnings = false;

// Check Android google-services.json
console.log('📱 Checking Android Configuration...');
const androidGoogleServices = path.join(__dirname, 'android', 'app', 'google-services.json');

if (fs.existsSync(androidGoogleServices)) {
  console.log('  ✅ google-services.json found');
  
  try {
    const content = JSON.parse(fs.readFileSync(androidGoogleServices, 'utf8'));
    
    // Check for OAuth client
    if (content.client && content.client[0] && content.client[0].oauth_client) {
      console.log('  ✅ OAuth client configured');
    } else {
      console.log('  ⚠️  OAuth client not found - this may cause issues');
      hasWarnings = true;
    }
    
    // Check project info
    if (content.project_info && content.project_info.project_id) {
      console.log(`  ✅ Project ID: ${content.project_info.project_id}`);
    }
  } catch (error) {
    console.log('  ❌ Error parsing google-services.json');
    hasErrors = true;
  }
} else {
  console.log('  ❌ google-services.json not found');
  hasErrors = true;
}

// Check iOS GoogleService-Info.plist
console.log('\n🍎 Checking iOS Configuration...');
const iosGoogleService = path.join(__dirname, 'ios', 'StriverApp', 'GoogleService-Info.plist');

if (fs.existsSync(iosGoogleService)) {
  console.log('  ✅ GoogleService-Info.plist found');
  
  const content = fs.readFileSync(iosGoogleService, 'utf8');
  
  if (content.includes('REVERSED_CLIENT_ID')) {
    console.log('  ✅ Client ID configured');
  } else {
    console.log('  ⚠️  Client ID not found - this may cause issues');
    hasWarnings = true;
  }
  
  if (content.includes('BUNDLE_ID')) {
    console.log('  ✅ Bundle ID configured');
  }
} else {
  console.log('  ❌ GoogleService-Info.plist not found');
  hasErrors = true;
}

// Check Firebase package
console.log('\n📦 Checking Firebase Packages...');
const packageJson = path.join(__dirname, 'package.json');

if (fs.existsSync(packageJson)) {
  const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
  
  if (pkg.dependencies['@react-native-firebase/auth']) {
    console.log(`  ✅ @react-native-firebase/auth: ${pkg.dependencies['@react-native-firebase/auth']}`);
  } else {
    console.log('  ❌ @react-native-firebase/auth not installed');
    hasErrors = true;
  }
  
  if (pkg.dependencies['@react-native-firebase/app']) {
    console.log(`  ✅ @react-native-firebase/app: ${pkg.dependencies['@react-native-firebase/app']}`);
  } else {
    console.log('  ❌ @react-native-firebase/app not installed');
    hasErrors = true;
  }
}

// Summary and next steps
console.log('\n' + '='.repeat(60));

if (hasErrors) {
  console.log('❌ Configuration has ERRORS that must be fixed');
  console.log('\nNext Steps:');
  console.log('1. Ensure google-services.json and GoogleService-Info.plist are present');
  console.log('2. Download them from Firebase Console if missing');
  console.log('3. Run npm install to ensure all packages are installed');
} else if (hasWarnings) {
  console.log('⚠️  Configuration has warnings - phone auth may not work correctly');
  console.log('\nNext Steps:');
  console.log('1. Verify Firebase Console has Phone Authentication enabled');
  console.log('2. For Android: Add SHA-1 and SHA-256 fingerprints to Firebase');
  console.log('   Run: cd android && ./gradlew signingReport');
  console.log('3. Download updated google-services.json after adding fingerprints');
  console.log('4. For iOS: Configure APNs in Firebase Console (for production)');
} else {
  console.log('✅ Basic configuration looks good!');
  console.log('\nIf you\'re still experiencing Error Code 39:');
  console.log('\n📱 For Android:');
  console.log('1. Get SHA fingerprints: cd android && ./gradlew signingReport');
  console.log('2. Add BOTH SHA-1 and SHA-256 to Firebase Console');
  console.log('3. Download updated google-services.json');
  console.log('4. Replace android/app/google-services.json');
  console.log('5. Rebuild: cd android && ./gradlew clean && cd .. && npx react-native run-android');
  console.log('\n🍎 For iOS:');
  console.log('1. Enable Phone Auth in Firebase Console');
  console.log('2. Configure APNs (for production)');
  console.log('3. Rebuild: npx react-native run-ios');
  console.log('\n💡 For testing, add test phone numbers in Firebase Console:');
  console.log('   Authentication > Sign-in method > Phone > Phone numbers for testing');
}

console.log('='.repeat(60));

process.exit(hasErrors ? 1 : 0);
