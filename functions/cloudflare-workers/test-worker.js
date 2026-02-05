/**
 * Test script for Ondato Proxy Worker
 * 
 * Usage: node test-worker.js <worker-url>
 * Example: node test-worker.js https://ondato-proxy.your-subdomain.workers.dev
 */

const WORKER_URL = process.argv[2] || 'https://ondato-proxy.striver-app.workers.dev';

console.log('========================================');
console.log('Testing Ondato Proxy Worker');
console.log('========================================');
console.log('Worker URL:', WORKER_URL);
console.log('');

async function testHealthCheck() {
  console.log('Test 1: Health Check');
  console.log('-------------------');
  
  try {
    const response = await fetch(`${WORKER_URL}/health`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.status === 'ok') {
      console.log('✅ Health check PASSED');
      return true;
    } else {
      console.log('❌ Health check FAILED');
      return false;
    }
  } catch (error) {
    console.log('❌ Health check ERROR:', error.message);
    return false;
  }
}

async function testCreateSession() {
  console.log('\nTest 2: Create Session');
  console.log('---------------------');
  
  try {
    const testSessionId = `test_${Date.now()}`;
    const response = await fetch(`${WORKER_URL}/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        externalReferenceId: testSessionId,
        language: 'en',
      }),
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success && data.identificationId) {
      console.log('✅ Create session PASSED');
      console.log('Identification ID:', data.identificationId);
      return data.identificationId;
    } else {
      console.log('❌ Create session FAILED');
      if (data.error) {
        console.log('Error:', data.error);
      }
      return null;
    }
  } catch (error) {
    console.log('❌ Create session ERROR:', error.message);
    return null;
  }
}

async function testCheckStatus(identificationId) {
  console.log('\nTest 3: Check Status');
  console.log('-------------------');
  
  if (!identificationId) {
    console.log('⏭️  Skipping (no identification ID from previous test)');
    return false;
  }
  
  try {
    const response = await fetch(`${WORKER_URL}/check-status/${identificationId}`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Check status PASSED');
      console.log('Verification Status:', data.status);
      return true;
    } else {
      console.log('❌ Check status FAILED');
      if (data.error) {
        console.log('Error:', data.error);
      }
      return false;
    }
  } catch (error) {
    console.log('❌ Check status ERROR:', error.message);
    return false;
  }
}

async function testCORS() {
  console.log('\nTest 4: CORS Headers');
  console.log('-------------------');
  
  try {
    const response = await fetch(`${WORKER_URL}/health`, {
      method: 'OPTIONS',
    });
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
    };
    
    console.log('Status:', response.status);
    console.log('CORS Headers:', JSON.stringify(corsHeaders, null, 2));
    
    if (corsHeaders['access-control-allow-origin'] === '*') {
      console.log('✅ CORS headers PASSED');
      return true;
    } else {
      console.log('❌ CORS headers FAILED');
      return false;
    }
  } catch (error) {
    console.log('❌ CORS test ERROR:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('Starting tests...\n');
  
  const results = {
    healthCheck: false,
    createSession: false,
    checkStatus: false,
    cors: false,
  };
  
  // Test 1: Health Check
  results.healthCheck = await testHealthCheck();
  
  // Test 2: Create Session
  const identificationId = await testCreateSession();
  results.createSession = identificationId !== null;
  
  // Test 3: Check Status
  results.checkStatus = await testCheckStatus(identificationId);
  
  // Test 4: CORS
  results.cors = await testCORS();
  
  // Summary
  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  console.log('Health Check:', results.healthCheck ? '✅ PASSED' : '❌ FAILED');
  console.log('Create Session:', results.createSession ? '✅ PASSED' : '❌ FAILED');
  console.log('Check Status:', results.checkStatus ? '✅ PASSED' : '❌ FAILED');
  console.log('CORS Headers:', results.cors ? '✅ PASSED' : '❌ FAILED');
  
  const passedCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;
  
  console.log('\nTotal:', `${passedCount}/${totalCount} tests passed`);
  
  if (passedCount === totalCount) {
    console.log('\n🎉 All tests passed! Worker is ready to use.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
  
  console.log('\nNext steps:');
  console.log('1. Update CLOUDFLARE_WORKER_URL in src/services/ondatoService.ts');
  console.log('2. Test the integration in your React Native app');
  console.log('3. Monitor worker logs with: wrangler tail');
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
