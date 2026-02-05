/**
 * Cloudflare Worker: Ondato API Proxy
 * 
 * This worker acts as a proxy between the React Native app and Ondato API,
 * eliminating Firebase authentication issues.
 * 
 * Endpoints:
 * - POST /create-session - Create Ondato verification session
 * - GET /check-status/:identificationId - Check verification status
 */

// Ondato OAuth2 credentials
const ONDATO_CLIENT_ID = 'app.ondato.striver-technoloigies-limited.b653f';
const ONDATO_CLIENT_SECRET = '988801522c607b82cff1b06786cb6499e2e4a97b11443705da2ec42fd486e09b';
const ONDATO_SETUP_ID = '896724ce-42f4-47d3-96b3-db599d07bfe3';
const ONDATO_API_URL = 'https://idvapi.ondato.com';
const ONDATO_AUTH_URL = 'https://id.ondato.com/connect/token';

// Cache for access token
let cachedToken = null;
let tokenExpiry = 0;

// CORS headers for React Native requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Get OAuth2 access token
 */
async function getAccessToken() {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    console.log('[Auth] Using cached token');
    return cachedToken;
  }

  console.log('[Auth] Fetching new access token...');

  try {
    const response = await fetch(ONDATO_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: ONDATO_CLIENT_ID,
        client_secret: ONDATO_CLIENT_SECRET,
        grant_type: 'client_credentials',
      }),
    });

    const responseText = await response.text();
    console.log('[Auth] Response status:', response.status);

    if (!response.ok) {
      console.error('[Auth] Failed to get token:', responseText);
      throw new Error(`Authentication failed: ${responseText}`);
    }

    const data = JSON.parse(responseText);
    cachedToken = data.access_token;
    
    // Set expiry to 5 minutes before actual expiry for safety
    const expiresIn = (data.expires_in || 3600) - 300;
    tokenExpiry = Date.now() + (expiresIn * 1000);

    console.log('[Auth] Token obtained, expires in:', expiresIn, 'seconds');
    return cachedToken;

  } catch (error) {
    console.error('[Auth] Error getting token:', error);
    throw error;
  }
}

/**
 * Main request handler
 */
async function handleRequest(request) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // Create session endpoint
    if (path === '/create-session' && request.method === 'POST') {
      return await handleCreateSession(request);
    }

    // Check status endpoint
    if (path.startsWith('/check-status/') && request.method === 'GET') {
      return await handleCheckStatus(path);
    }

    // Health check endpoint
    if (path === '/health' && request.method === 'GET') {
      return jsonResponse({ 
        status: 'ok', 
        message: 'Ondato proxy worker is running',
        timestamp: new Date().toISOString()
      });
    }

    return jsonResponse({ error: 'Not found' }, 404);

  } catch (error) {
    console.error('Worker error:', error);
    return jsonResponse({ 
      error: error.message || 'Internal server error',
      details: error.stack 
    }, 500);
  }
}

/**
 * Handle create session request
 */
async function handleCreateSession(request) {
  try {
    const body = await request.json();
    const { externalReferenceId, language = 'en' } = body;

    // Validate input
    if (!externalReferenceId) {
      return jsonResponse({ 
        error: 'externalReferenceId is required' 
      }, 400);
    }

    console.log('[CreateSession] Creating session for:', externalReferenceId);

    // Get OAuth2 access token
    const accessToken = await getAccessToken();

    // Call Ondato API (using newer v1/identity-verifications endpoint)
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
        language,
      }),
    });

    // Get response text first to handle non-JSON responses
    const responseText = await response.text();
    console.log('[CreateSession] Response status:', response.status);
    console.log('[CreateSession] Response text (first 200 chars):', responseText.substring(0, 200));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[CreateSession] Failed to parse response as JSON');
      return jsonResponse({ 
        error: 'Invalid response from Ondato API',
        details: `Status: ${response.status}, Response: ${responseText.substring(0, 500)}`,
        statusCode: response.status
      }, 500);
    }

    if (!response.ok) {
      console.error('[CreateSession] Ondato API error:', data);
      return jsonResponse({ 
        error: data.message || 'Failed to create session',
        ondatoError: data,
        statusCode: response.status
      }, response.status);
    }

    // Generate verification URL
    const verificationUrl = `https://idv.ondato.com/setups/${ONDATO_SETUP_ID}?externalRef=${externalReferenceId}&successUrl=striver://verification-success&failureUrl=striver://verification-failed`;

    console.log('[CreateSession] Session created:', data.id);

    return jsonResponse({
      success: true,
      identificationId: data.id,
      sessionId: externalReferenceId,
      verificationUrl,
      ondatoResponse: data
    });

  } catch (error) {
    console.error('[CreateSession] Error:', error);
    return jsonResponse({ 
      error: error.message || 'Failed to create session',
      details: error.stack
    }, 500);
  }
}

/**
 * Handle check status request
 */
async function handleCheckStatus(path) {
  try {
    const identificationId = path.split('/check-status/')[1];

    // Validate input
    if (!identificationId) {
      return jsonResponse({ 
        error: 'identificationId is required' 
      }, 400);
    }

    console.log('[CheckStatus] Checking status for:', identificationId);

    // Get OAuth2 access token
    const accessToken = await getAccessToken();

    // Call Ondato API (using newer v1/identity-verifications endpoint)
    const response = await fetch(`${ONDATO_API_URL}/v1/identity-verifications/${identificationId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    // Get response text first to handle non-JSON responses
    const responseText = await response.text();
    console.log('[CheckStatus] Response status:', response.status);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[CheckStatus] Failed to parse response as JSON');
      return jsonResponse({ 
        error: 'Invalid response from Ondato API',
        details: `Status: ${response.status}, Response: ${responseText.substring(0, 500)}`,
        statusCode: response.status
      }, 500);
    }

    if (!response.ok) {
      console.error('[CheckStatus] Ondato API error:', data);
      return jsonResponse({ 
        error: data.message || 'Failed to check status',
        ondatoError: data,
        statusCode: response.status
      }, response.status);
    }

    // Map Ondato status to app status
    let appStatus = 'pending';
    if (data.status === 'Approved') {
      appStatus = 'completed';
    } else if (data.status === 'Rejected') {
      appStatus = 'failed';
    } else if (data.status === 'Pending' || data.status === 'Awaiting') {
      appStatus = 'pending';
    }

    console.log('[CheckStatus] Status:', data.status, '→', appStatus);

    return jsonResponse({
      success: true,
      status: appStatus,
      ondatoStatus: data.status,
      identificationId: data.id,
      externalReferenceId: data.externalReferenceId,
      verificationData: data.verificationData || {},
      rejectionReasons: data.rejectionReasons || [],
      ondatoResponse: data
    });

  } catch (error) {
    console.error('[CheckStatus] Error:', error);
    return jsonResponse({ 
      error: error.message || 'Failed to check status',
      details: error.stack
    }, 500);
  }
}

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// Register event listener
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
