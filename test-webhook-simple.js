/**
 * Simple Webhook Test Script
 * Tests the deployed Ondato webhook with the actual URL
 */

const https = require('https');

// ACTUAL DEPLOYED WEBHOOK URL
const WEBHOOK_URL = 'https://ondatowebhook-hphu25tfqq-uc.a.run.app';
const USERNAME = 'striver_webhook';
const PASSWORD = 'striver_secure_webhook_2024';

// Create Basic Auth header
const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

// Test payload - Approved verification
const testPayload = {
  EventType: 'KycIdentification.Approved',
  Payload: {
    Id: 'test-webhook-' + Date.now(),
    ExternalReferenceId: 'test_session_' + Date.now(),
    Status: 'Approved',
    VerificationData: {
      DateOfBirth: '01/01/1990',
      Age: 34,
      DocumentType: 'Passport',
      FirstName: 'Test',
      LastName: 'User'
    }
  }
};

console.log('🧪 Testing Ondato Webhook');
console.log('========================\n');
console.log('Webhook URL:', WEBHOOK_URL);
console.log('Payload:', JSON.stringify(testPayload, null, 2));
console.log('\nSending request...\n');

const url = new URL(WEBHOOK_URL);
const postData = JSON.stringify(testPayload);

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

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Response Status: ${res.statusCode}`);
    
    try {
      const jsonData = JSON.parse(data);
      console.log('Response Body:', JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('Response Body:', data);
    }

    if (res.statusCode === 200) {
      console.log('\n✅ SUCCESS! Webhook is working correctly.');
      console.log('\nNote: This test creates a fake verification attempt.');
      console.log('Check Firestore to see if it was processed.');
    } else if (res.statusCode === 404) {
      console.log('\n❌ FAILED: Verification attempt not found in Firestore.');
      console.log('This is expected for test data. The webhook is working,');
      console.log('but the sessionId doesn\'t exist in your database.');
    } else {
      console.log(`\n❌ FAILED with status ${res.statusCode}`);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ ERROR:', error.message);
});

req.write(postData);
req.end();
