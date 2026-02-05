/**
 * Test Ondato API directly to see what's wrong
 */

const ONDATO_CLIENT_ID = 'app.ondato.striver-technoloigies-limited.b653f';
const ONDATO_CLIENT_SECRET = '988801522c607b82cff1b06786cb6499e2e4a97b11443705da2ec42fd486e09b';
const ONDATO_SETUP_ID = '896724ce-42f4-47d3-96b3-db599d07bfe3';
const ONDATO_API_URL = 'https://idvapi.ondato.com';
const ONDATO_AUTH_URL = 'https://id.ondato.com/connect/token';

async function getAccessToken() {
  console.log('Getting OAuth2 access token...');
  
  const params = new URLSearchParams({
    client_id: ONDATO_CLIENT_ID,
    client_secret: ONDATO_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });

  const response = await fetch(ONDATO_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const responseText = await response.text();
  console.log('Auth response status:', response.status);
  console.log('Auth response:', responseText);
  console.log('');

  if (!response.ok) {
    throw new Error(`Authentication failed: ${responseText}`);
  }

  const data = JSON.parse(responseText);
  return data.access_token;
}

async function testOndatoAPI() {
  console.log('Testing Ondato API...\n');

  const externalReferenceId = `test_${Date.now()}`;

  console.log('1. Testing credentials...');
  console.log('   Client ID:', ONDATO_CLIENT_ID);
  console.log('   Client Secret:', '*'.repeat(ONDATO_CLIENT_SECRET.length));
  console.log('   Setup ID:', ONDATO_SETUP_ID);
  console.log('   API URL:', ONDATO_API_URL);
  console.log('   Auth URL:', ONDATO_AUTH_URL);
  console.log('');

  try {
    // Get access token
    const accessToken = await getAccessToken();
    console.log('✅ Access token obtained:', accessToken.substring(0, 20) + '...');
    console.log('');

    console.log('2. Creating session...');
    console.log('   External Ref:', externalReferenceId);
    console.log('');

    const response = await fetch(`${ONDATO_API_URL}/v1/identity-verifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        externalReferenceId,
        setupId: ONDATO_SETUP_ID,
        successUrl: 'striver://verification-success',
        errorUrl: 'striver://verification-failed',
        language: 'en',
      }),
    });

    console.log('3. Response received:');
    console.log('   Status:', response.status, response.statusText);
    console.log('   Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
    console.log('');

    const responseText = await response.text();
    console.log('4. Response body:');
    console.log(responseText);
    console.log('');

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ SUCCESS! Session created:');
      console.log('   ID:', data.id);
      console.log('   Status:', data.status);
      console.log('');
    } else {
      console.log('❌ FAILED! Ondato API returned error');
      console.log('');
      
      // Try to parse as JSON
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error details:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('Response is not JSON. Raw response:', responseText);
      }
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

testOndatoAPI();
