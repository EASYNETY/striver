/**
 * Test Ondato Configuration
 * This script verifies that Ondato is properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('Ondato Configuration Test');
console.log('========================================\n');

// Read .env file
const envPath = path.join(__dirname, 'functions', '.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Found functions/.env file\n');
} catch (error) {
  console.log('❌ Could not read functions/.env file');
  process.exit(1);
}

// Parse environment variables
const envVars = {};
const lines = envContent.replace(/\r\n/g, '\n').split('\n');

lines.forEach((line, index) => {
  // Skip comments and empty lines
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  
  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
  }
});

// Check Ondato configuration
console.log('Ondato Configuration:');
console.log('─────────────────────────────────────────\n');

const setupId = envVars.ONDATO_SETUP_ID;
const username = envVars.ONDATO_USERNAME;
const password = envVars.ONDATO_PASSWORD;
const apiUrl = envVars.ONDATO_API_URL;

console.log(`Setup ID: ${setupId}`);
if (setupId === 'a535d849-e70e-4d40-bc31-fd1b0950d008') {
  console.log('  ✅ Setup ID is configured correctly\n');
} else {
  console.log('  ❌ Setup ID is incorrect\n');
}

console.log(`API URL: ${apiUrl}`);
if (apiUrl === 'https://api.ondato.com') {
  console.log('  ✅ API URL is correct\n');
} else {
  console.log('  ⚠️  API URL might be incorrect\n');
}

console.log(`Username: ${username}`);
if (username && username !== 'your_ondato_username') {
  console.log('  ✅ Username is configured\n');
} else {
  console.log('  ❌ Username is NOT configured (placeholder value)\n');
}

console.log(`Password: ${password ? '***' + password.slice(-4) : 'NOT SET'}`);
if (password && password !== 'your_ondato_password') {
  console.log('  ✅ Password is configured\n');
} else {
  console.log('  ❌ Password is NOT configured (placeholder value)\n');
}

// Generate verification URL
const verificationUrl = `https://idv.ondato.com/setups/${setupId}`;
console.log('─────────────────────────────────────────\n');
console.log(`Verification URL: ${verificationUrl}\n`);

// Summary
console.log('========================================');
console.log('Summary');
console.log('========================================\n');

const hasSetupId = setupId === 'a535d849-e70e-4d40-bc31-fd1b0950d008';
const hasUsername = username && username !== 'your_ondato_username';
const hasPassword = password && password !== 'your_ondato_password';

if (hasSetupId && hasUsername && hasPassword) {
  console.log('✅ Ondato is FULLY CONFIGURED');
  console.log('\nNext steps:');
  console.log('1. Deploy functions: firebase deploy --only functions:startOndatoVerification,functions:checkVerificationStatus --config firebase-new.json');
  console.log('2. Test verification in the app');
} else {
  console.log('⚠️  Ondato is PARTIALLY CONFIGURED\n');
  console.log('Missing:');
  if (!hasSetupId) console.log('  - Setup ID');
  if (!hasUsername) console.log('  - API Username');
  if (!hasPassword) console.log('  - API Password');
  console.log('\nTo complete setup:');
  console.log('1. Contact Ondato support: support@ondato.com');
  console.log('2. Request API credentials for Setup ID: a535d849-e70e-4d40-bc31-fd1b0950d008');
  console.log('3. Update functions/.env with the credentials');
  console.log('4. Deploy functions');
}

console.log('\n========================================\n');
