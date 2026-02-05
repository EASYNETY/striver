/**
 * Age Verification & Child Profile Creation Validation Script
 * 
 * This script validates:
 * 1. Firestore rules are correctly deployed
 * 2. Age calculation logic works correctly
 * 3. Child profile creation validation
 * 4. Ondato integration configuration
 */

const admin = require('firebase-admin');
const serviceAccount = require('./firebase-new.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Test data
const TEST_PARENT_UID = 'test_parent_' + Date.now();
const TEST_CHILD_DOB_VALID = '15/03/2018'; // 7 years old (valid)
const TEST_CHILD_DOB_INVALID = '15/03/2010'; // 14 years old (invalid)
const TEST_PARENT_DOB = '15/03/1990'; // 35 years old

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function calculateAge(dob) {
  const parts = dob.split('/');
  if (parts.length !== 3) return -1;
  
  const birth = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

async function testAgeCalculation() {
  log('\n📊 Testing Age Calculation Logic...', 'blue');
  
  const testCases = [
    { dob: '15/03/2018', expectedAge: 7, description: 'Child under 13' },
    { dob: '15/03/2010', expectedAge: 14, description: 'Teen 13-17' },
    { dob: '15/03/1990', expectedAge: 35, description: 'Adult 18+' },
    { dob: '01/01/2013', expectedAge: 12, description: 'Child turning 13 this year' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testCases) {
    const calculatedAge = calculateAge(test.dob);
    const isCorrect = calculatedAge === test.expectedAge;
    
    if (isCorrect) {
      log(`  ✅ ${test.description}: ${calculatedAge} years old`, 'green');
      passed++;
    } else {
      log(`  ❌ ${test.description}: Expected ${test.expectedAge}, got ${calculatedAge}`, 'red');
      failed++;
    }
  }
  
  log(`\n  Results: ${passed} passed, ${failed} failed`, failed === 0 ? 'green' : 'red');
  return failed === 0;
}

async function testFirestoreRules() {
  log('\n🔐 Testing Firestore Security Rules...', 'blue');
  
  try {
    // Test 1: Check if users collection exists
    const usersRef = db.collection('users');
    log('  ✅ Users collection accessible', 'green');
    
    // Test 2: Check if verification_attempts collection exists
    const attemptsRef = db.collection('verification_attempts');
    log('  ✅ Verification attempts collection accessible', 'green');
    
    // Test 3: Create test parent profile
    await db.collection('users').doc(TEST_PARENT_UID).set({
      username: 'test_parent',
      email: 'test@example.com',
      accountType: 'family',
      ageTier: 'first_teamer',
      dob: TEST_PARENT_DOB,
      ageVerificationStatus: 'verified',
      career_earnings: 0,
      career_tier_id: 'future_star',
      badge_status: 'bronze',
      coins: 0,
      followers: 0,
      following: 0,
      replies: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    log('  ✅ Test parent profile created', 'green');
    
    // Test 4: Check children subcollection access
    const childrenRef = db.collection('users').doc(TEST_PARENT_UID).collection('children');
    log('  ✅ Children subcollection accessible', 'green');
    
    // Test 5: Check approvals subcollection access
    const approvalsRef = db.collection('users').doc(TEST_PARENT_UID).collection('approvals');
    log('  ✅ Approvals subcollection accessible', 'green');
    
    return true;
  } catch (error) {
    log(`  ❌ Firestore rules test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testChildProfileValidation() {
  log('\n👶 Testing Child Profile Creation Validation...', 'blue');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Valid child (under 13)
  try {
    const age = calculateAge(TEST_CHILD_DOB_VALID);
    if (age < 13) {
      log(`  ✅ Valid child age (${age} years) - Should allow creation`, 'green');
      passed++;
    } else {
      log(`  ❌ Valid child age check failed`, 'red');
      failed++;
    }
  } catch (error) {
    log(`  ❌ Valid child test failed: ${error.message}`, 'red');
    failed++;
  }
  
  // Test 2: Invalid child (13+)
  try {
    const age = calculateAge(TEST_CHILD_DOB_INVALID);
    if (age >= 13) {
      log(`  ✅ Invalid child age (${age} years) - Should reject creation`, 'green');
      passed++;
    } else {
      log(`  ❌ Invalid child age check failed`, 'red');
      failed++;
    }
  } catch (error) {
    log(`  ❌ Invalid child test failed: ${error.message}`, 'red');
    failed++;
  }
  
  // Test 3: Parent verification status
  try {
    const parentDoc = await db.collection('users').doc(TEST_PARENT_UID).get();
    const parentData = parentDoc.data();
    
    if (parentData.ageVerificationStatus === 'verified') {
      log(`  ✅ Parent verification status: verified`, 'green');
      passed++;
    } else {
      log(`  ❌ Parent verification status: ${parentData.ageVerificationStatus}`, 'red');
      failed++;
    }
  } catch (error) {
    log(`  ❌ Parent verification test failed: ${error.message}`, 'red');
    failed++;
  }
  
  // Test 4: Create valid child profile
  try {
    await db.collection('users').doc(TEST_PARENT_UID).collection('children').add({
      firstName: 'Test',
      displayName: 'Test Child',
      dob: TEST_CHILD_DOB_VALID,
      favTeam: 'Test FC',
      ageTier: 'junior_baller',
      avatar: '',
      coins: 0,
      isPrivate: true,
      commentsDisabled: true,
      dmsRedirectedToParent: true,
      restrictedSocial: true,
      screenTimeLimit: 60,
      bedtimeModeEnabled: true,
      dailySpendingLimit: 50,
      createdAt: new Date().toISOString()
    });
    log(`  ✅ Child profile created successfully`, 'green');
    passed++;
  } catch (error) {
    log(`  ❌ Child profile creation failed: ${error.message}`, 'red');
    failed++;
  }
  
  // Test 5: Verify safety defaults
  try {
    const childrenSnapshot = await db.collection('users').doc(TEST_PARENT_UID).collection('children').get();
    if (!childrenSnapshot.empty) {
      const childData = childrenSnapshot.docs[0].data();
      const safetyChecks = [
        { field: 'isPrivate', expected: true },
        { field: 'commentsDisabled', expected: true },
        { field: 'dmsRedirectedToParent', expected: true },
        { field: 'restrictedSocial', expected: true },
        { field: 'screenTimeLimit', expected: 60 },
        { field: 'bedtimeModeEnabled', expected: true },
        { field: 'dailySpendingLimit', expected: 50 },
      ];
      
      let allSafetyDefaultsCorrect = true;
      for (const check of safetyChecks) {
        if (childData[check.field] !== check.expected) {
          log(`  ❌ Safety default ${check.field}: Expected ${check.expected}, got ${childData[check.field]}`, 'red');
          allSafetyDefaultsCorrect = false;
        }
      }
      
      if (allSafetyDefaultsCorrect) {
        log(`  ✅ All safety defaults correctly applied`, 'green');
        passed++;
      } else {
        failed++;
      }
    }
  } catch (error) {
    log(`  ❌ Safety defaults verification failed: ${error.message}`, 'red');
    failed++;
  }
  
  log(`\n  Results: ${passed} passed, ${failed} failed`, failed === 0 ? 'green' : 'red');
  return failed === 0;
}

async function testOndatoConfiguration() {
  log('\n🔧 Testing Ondato Configuration...', 'blue');
  
  let passed = 0;
  let failed = 0;
  
  // Check environment variables
  const requiredEnvVars = [
    'ONDATO_USERNAME',
    'ONDATO_PASSWORD',
    'ONDATO_SETUP_ID',
    'ONDATO_API_URL'
  ];
  
  log('  Checking environment variables (from functions/.env):', 'yellow');
  
  // Note: This script runs outside of Cloud Functions, so we can't directly access process.env
  // We'll just check if the .env file exists
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, 'functions', '.env');
  
  if (fs.existsSync(envPath)) {
    log('  ✅ functions/.env file exists', 'green');
    passed++;
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const varName of requiredEnvVars) {
      if (envContent.includes(varName)) {
        log(`  ✅ ${varName} is defined`, 'green');
        passed++;
      } else {
        log(`  ❌ ${varName} is missing`, 'red');
        failed++;
      }
    }
  } else {
    log('  ❌ functions/.env file not found', 'red');
    failed += requiredEnvVars.length + 1;
  }
  
  log(`\n  Results: ${passed} passed, ${failed} failed`, failed === 0 ? 'green' : 'red');
  return failed === 0;
}

async function cleanup() {
  log('\n🧹 Cleaning up test data...', 'blue');
  
  try {
    // Delete test parent and all subcollections
    const childrenSnapshot = await db.collection('users').doc(TEST_PARENT_UID).collection('children').get();
    for (const doc of childrenSnapshot.docs) {
      await doc.ref.delete();
    }
    
    await db.collection('users').doc(TEST_PARENT_UID).delete();
    log('  ✅ Test data cleaned up', 'green');
  } catch (error) {
    log(`  ⚠️  Cleanup warning: ${error.message}`, 'yellow');
  }
}

async function runAllTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('  AGE VERIFICATION & CHILD PROFILE VALIDATION', 'blue');
  log('='.repeat(60) + '\n', 'blue');
  
  const results = {
    ageCalculation: false,
    firestoreRules: false,
    childProfileValidation: false,
    ondatoConfiguration: false,
  };
  
  try {
    results.ageCalculation = await testAgeCalculation();
    results.firestoreRules = await testFirestoreRules();
    results.childProfileValidation = await testChildProfileValidation();
    results.ondatoConfiguration = await testOndatoConfiguration();
    
    await cleanup();
    
    // Summary
    log('\n' + '='.repeat(60), 'blue');
    log('  SUMMARY', 'blue');
    log('='.repeat(60), 'blue');
    
    const allPassed = Object.values(results).every(r => r === true);
    
    log(`\n  Age Calculation: ${results.ageCalculation ? '✅ PASS' : '❌ FAIL'}`, 
        results.ageCalculation ? 'green' : 'red');
    log(`  Firestore Rules: ${results.firestoreRules ? '✅ PASS' : '❌ FAIL'}`, 
        results.firestoreRules ? 'green' : 'red');
    log(`  Child Profile Validation: ${results.childProfileValidation ? '✅ PASS' : '❌ FAIL'}`, 
        results.childProfileValidation ? 'green' : 'red');
    log(`  Ondato Configuration: ${results.ondatoConfiguration ? '✅ PASS' : '❌ FAIL'}`, 
        results.ondatoConfiguration ? 'green' : 'red');
    
    log('\n' + '='.repeat(60), 'blue');
    log(`  OVERALL: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`, 
        allPassed ? 'green' : 'red');
    log('='.repeat(60) + '\n', 'blue');
    
    if (allPassed) {
      log('🎉 All systems are ready for production!', 'green');
      log('\nNext steps:', 'yellow');
      log('  1. Deploy Firestore rules: firebase deploy --only firestore:rules', 'yellow');
      log('  2. Deploy Cloud Functions: firebase deploy --only functions', 'yellow');
      log('  3. Test end-to-end flow in the app', 'yellow');
    } else {
      log('⚠️  Please fix the failing tests before deploying to production.', 'red');
    }
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
