#!/usr/bin/env node

/**
 * Android Environment Validation Script
 * Checks if all required tools and configurations are present
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🤖 Validating Android build environment...\n');

let hasErrors = false;
let hasWarnings = false;

// Helper to run commands safely
function runCommand(command, description) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description}`);
    return output.trim();
  } catch (error) {
    console.log(`❌ ${description}`);
    hasErrors = true;
    return null;
  }
}

// Check Java version
console.log('📋 Checking Java...');
const javaVersion = runCommand('java -version 2>&1', 'Java installed');
if (javaVersion) {
  const match = javaVersion.match(/version "(\d+)/);
  if (match) {
    const version = parseInt(match[1]);
    if (version >= 17) {
      console.log(`   Java ${version} detected (required: 17+)\n`);
    } else {
      console.log(`   ⚠️  Java ${version} detected, but 17+ recommended\n`);
      hasWarnings = true;
    }
  }
}

// Check Android SDK
console.log('📋 Checking Android SDK...');
const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (androidHome) {
  console.log(`✅ ANDROID_HOME set: ${androidHome}`);
  
  // Check for required SDK components
  const sdkManager = path.join(androidHome, 'cmdline-tools', 'latest', 'bin', 'sdkmanager');
  const sdkManagerAlt = path.join(androidHome, 'tools', 'bin', 'sdkmanager');
  
  if (fs.existsSync(sdkManager) || fs.existsSync(sdkManagerAlt)) {
    console.log('✅ SDK Manager found');
  } else {
    console.log('⚠️  SDK Manager not found');
    hasWarnings = true;
  }
  
  // Check for platform-tools (adb)
  const adb = path.join(androidHome, 'platform-tools', 'adb.exe');
  const adbUnix = path.join(androidHome, 'platform-tools', 'adb');
  if (fs.existsSync(adb) || fs.existsSync(adbUnix)) {
    console.log('✅ ADB found');
  } else {
    console.log('❌ ADB not found - install Android SDK Platform-Tools');
    hasErrors = true;
  }
  console.log('');
} else {
  console.log('❌ ANDROID_HOME not set');
  console.log('   Set ANDROID_HOME environment variable to your Android SDK path\n');
  hasErrors = true;
}

// Check Gradle
console.log('📋 Checking Gradle...');
const gradleVersion = runCommand('gradle --version 2>&1', 'Gradle installed');
if (gradleVersion) {
  console.log('   (Using project wrapper is recommended)\n');
}

// Check for gradlew
if (fs.existsSync('gradlew') || fs.existsSync('gradlew.bat')) {
  console.log('✅ Gradle wrapper found\n');
} else {
  console.log('❌ Gradle wrapper not found\n');
  h