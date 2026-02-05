/**
 * Test script for Ondato Webhook
 * 
 * This script sends a test webhook payload to your deployed Firebase Function
 * to verify it's working correctly.
 * 
 * Usage:
 *   node test-ondato-webhook.js YOUR-PROJECT-ID
 * 
 * Example:
 *   node test-ondato-webhook.js striver-app-48562
 */

const https = require('https');

// Get project ID from command line
const projectId = process.argv[2];

if (!projectId) {
  console.error('❌ Error: Please provide your Firebase project ID');
  console.log('\nUsage: node test-ondato-webhook.js YOUR-PROJECT-ID');
  console.log('Example: node test-ondato-webhook.js striver-app-48562');
  process.exit(1);
}

// Webhook configuration
const WEBHOOK_URL = `https://us-central1-${projectId}.cloudfunctions.net/ondatoWebhook`;
const USERNAME = 'striver_webhook';
const PASSWORD = 'striver_secure_webhook_2024';

// Create Basic Auth header
const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

// Test payload - Approved verification
const approvedPayload = {
  EventType: 'KycIdentification.Approved',
  Payload: {
    Id: 'test-webhook-' + Date.now(),
    ExternalReferenceId: 'test_' + Date.now(),
    Status: 'Approved',
    VerificationData: {
      DateOfBirth: '1990-01-01',
      Age: 34,
      DocumentType: 'Passport',
      FirstName: 'Test',
      LastName: 'User'
    }
  }
};

// Test payload - Rejected verification
const rejectedPayload = {
  EventType: 'KycIdentification.Rejected',
  Payload: {
    Id: 'test-webhook-' + Date.now(),
    ExternalReferenceId: 'test_' + Date.now(),
    Status: 'Rejected',
    RejectionReasons: [
      'Document not clear',
      'Face not visible'
    ]
  }
};

console.log('🧪 Testing Ondato Webhook');
console.log('========================\n');
console.log('Webhook URL:', WEBHOOK_URL);
console.log('Auth:', `${USERNAME}:${PASSWORD.substring(0, 10)}...`);
console.log('');

// Function to send webhook test
function testWebhook(payload, testName) {
  return new Promise((resolve, reject) => {
    const url = new URL(WEBHOOK_URL);
    const postData = JSON.stringify(payload);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Basic ${auth}`
      }
    };

    console.log(`\n📤 Test: ${testName}`);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('\nSending request...');

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\n✅ Response Status: ${res.statusCode}`);
        console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
        
        try {
          const jsonData = JSON.parse(data);
          console.log('Response Body:', JSON.stringify(jsonData, null, 2));
        } catch (e) {
          console.log('Response Body:', data);
        }

        if (res.statusCode === 200) {
          console.log(`\n✅ ${testName} - SUCCESS`);
          resolve();
        } else {
          console.log(`\n❌ ${testName} - FAILED (Status: ${res.statusCode})`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`\n❌ ${testName} - ERROR:`, error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Run tests
async function runTests() {
  try {
    // Test 1: Approved verification
    await testWebhook(approvedPayload, 'Approved Verification');
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Rejected verification
    await testWebhook(rejectedPayload, 'Rejected Verification');
    
    console.log('\n\n========================================');
    console.log('✅ All webhook tests completed!');
    console.log('========================================\n');
    console.log('Next steps:');
    console.log('1. Check Firebase Functions logs:');
    console.log('   firebase functions:log --only ondatoWebhook');
    console.log('2. Check Firestore for updated records');
    console.log('3. Configure webhook in Ondato dashboard');
    console.log('');
    
  } catch (error) {
    console.error('\n\n========================================');
    console.error('❌ Webhook tests failed!');
    console.error('========================================\n');
    console.error('Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Verify webhook is deployed:');
    console.log('   firebase deploy --only functions:ondatoWebhook');
    console.log('2. Check Firebase Functions logs:');
    console.log('   firebase functions:log --only ondatoWebhook');
    console.log('3. Verify project ID is correct:', projectId);
    console.log('4. Check Basic Auth credentials in functions/.env');
    console.log('');
    process.exit(1);
  }
}

// Test without auth (should fail with 401)
async function testUnauthorized() {
  console.log('\n📤 Test: Unauthorized Request (should fail)');
  
  const url = new URL(WEBHOOK_URL);
  const postData = JSON.stringify(approvedPayload);

  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
      // No Authorization header
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 401) {
          console.log('✅ Correctly rejected unauthorized request (401)');
        } else {
          console.log(`⚠️  Expected 401, got ${res.statusCode}`);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

// Run all tests
(async () => {
  await testUnauthorized();
  await new Promise(resolve => setTimeout(resolve, 1000));
  await runTests();
})();
