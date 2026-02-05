# Design Document: Ondato Direct API Integration

## Overview

This design implements direct API calls from the React Native app to the Ondato identity verification service, eliminating the UNAUTHENTICATED errors that occur when using Firebase Functions. The solution follows the successful pattern established by the Cloudflare video service, where client-side API calls bypass Firebase authentication issues while maintaining proper security and data tracking.

The key insight is that Firebase Functions authentication can be unreliable in React Native environments, particularly when tokens expire or refresh. By calling Ondato's API directly from the client with stored credentials (similar to how Cloudflare credentials are stored), we eliminate this failure point while maintaining the same functionality.

## Architecture

### Current Architecture (Problematic)

```
React Native App
    ↓ (Firebase Auth Token)
Firebase Functions (startOndatoVerification, checkVerificationStatus)
    ↓ (Basic Auth)
Ondato API
```

**Problem**: Firebase Auth Token can fail or expire, causing UNAUTHENTICATED errors.

### New Architecture (Solution)

```
React Native App
    ↓ (Direct HTTP with Basic Auth)
Ondato API
    ↓ (Results stored in)
Firestore
    ↓ (Webhook updates)
Firebase Functions (ondato-webhook only)
```

**Benefits**:
- No Firebase authentication dependency for client operations
- Faster response times (one less hop)
- Same security model as Cloudflare video service
- Firebase Functions still handle webhooks for server-side processing

## Components and Interfaces

### 1. Ondato Service (`src/services/ondatoService.ts`)

A new service module that encapsulates all direct Ondato API interactions.

```typescript
// Configuration
interface OndatoConfig {
  username: string;
  password: string;
  setupId: string;
  apiUrl: string;
}

// Session creation
interface CreateSessionParams {
  externalReferenceId: string;
  dateOfBirth: string;
}

interface CreateSessionResult {
  success: boolean;
  sessionId?: string;
  identificationId?: string;
  verificationUrl?: string;
  error?: string;
}

// Status checking
interface CheckStatusParams {
  identificationId: string;
}

interface CheckStatusResult {
  success: boolean;
  status?: 'pending' | 'completed' | 'failed';
  ondatoStatus?: string;
  verificationData?: any;
  error?: string;
}

// Service interface
export const ondatoService = {
  createSession(params: CreateSessionParams): Promise<CreateSessionResult>
  checkStatus(params: CheckStatusParams): Promise<CheckStatusResult>
}
```

**Implementation Details**:

- **Credentials**: Store Ondato credentials directly in the service file (same pattern as cloudflareVideoService.ts)
  - Username: From environment or hardcoded
  - Password: From environment or hardcoded
  - Setup ID: `fa1fb2cb-034f-4926-bd38-c8290510ade9`
  - API URL: `https://api.ondato.com`

- **Authentication**: Use Basic Auth with Base64-encoded credentials
  ```typescript
  const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  ```

- **API Endpoints**:
  - Create session: `POST /v1/kyc/identifications`
  - Check status: `GET /v1/kyc/identifications/{identificationId}`

- **Error Handling**: Catch and transform API errors into user-friendly messages

### 2. Updated Verification Hook (`src/hooks/useOndatoVerification.ts`)

Modify the existing hook to use the new ondatoService instead of Firebase Functions.

```typescript
interface VerificationConfig {
  dateOfBirth: string;
}

interface VerificationResult {
  success: boolean;
  sessionId?: string;
  identificationId?: string;
  verificationUrl?: string;
  error?: string;
}

interface VerificationStatus {
  status: 'idle' | 'pending' | 'completed' | 'failed' | 'expired';
  sessionId?: string;
  identificationId?: string;
  metadata?: any;
}

export const useOndatoVerification = () => {
  // State management (unchanged)
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    status: 'idle',
  });
  const [error, setError] = useState<string | null>(null);

  // Start verification - NEW IMPLEMENTATION
  const startVerification = async (config: VerificationConfig): Promise<VerificationResult> => {
    // 1. Generate unique session ID
    // 2. Call ondatoService.createSession()
    // 3. Save verification attempt to Firestore
    // 4. Update user profile status in Firestore
    // 5. Return result
  }

  // Check status - NEW IMPLEMENTATION
  const checkStatus = async (sessionId: string, identificationId: string): Promise<VerificationStatus> => {
    // 1. Call ondatoService.checkStatus()
    // 2. Update verification attempt in Firestore
    // 3. Update user profile if status changed
    // 4. Return status
  }

  // Other methods remain unchanged
  const openVerification = async (verificationUrl: string): Promise<void> => { ... }
  const handleDeepLink = (url: string) => { ... }
  const reset = () => { ... }

  return {
    loading,
    verificationStatus,
    error,
    startVerification,
    checkStatus,
    openVerification,
    handleDeepLink,
    reset,
  };
}
```

**Key Changes**:
- Remove `httpsCallable` imports and calls
- Replace Firebase Functions calls with ondatoService calls
- Maintain Firestore operations for data persistence
- Keep the same interface for backward compatibility

### 3. Firestore Integration

The hook will continue to manage Firestore documents for tracking and audit purposes.

**verification_attempts Collection**:
```typescript
interface VerificationAttempt {
  userId: string;
  sessionId: string;
  externalReferenceId: string;
  identificationId: string;
  method: 'ondato';
  status: 'pending' | 'completed' | 'failed' | 'expired';
  verificationUrl: string;
  metadata: {
    dateOfBirth: string;
    ondatoIdentificationId: string;
    ondatoStatus?: string;
    verificationData?: any;
    rejectionReasons?: string[];
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;
}
```

**users Collection Updates**:
```typescript
interface UserVerificationFields {
  ageVerificationStatus: 'pending' | 'verified' | 'rejected';
  ageVerificationMethod: 'ondato';
  ageVerificationDate: Timestamp | null;
  profileStatus: {
    ageVerification: 'pending' | 'verified' | 'rejected';
    verificationStartedAt: Timestamp;
    verificationCompletedAt?: Timestamp;
  };
}
```

### 4. Firebase Functions (Unchanged)

The webhook handler remains unchanged and continues to process Ondato callbacks.

**ondato-webhook.ts**:
- Receives webhook POST requests from Ondato
- Verifies Basic Auth credentials
- Updates verification_attempts documents
- Updates user profile status
- Creates notifications
- Handles profile completion calculations

## Data Models

### Session Creation Request

```typescript
// To Ondato API
{
  externalReferenceId: string;  // Unique session ID
  setupId: string;               // Ondato setup ID
  successUrl: string;            // Deep link for success
  errorUrl: string;              // Deep link for failure
  language: string;              // UI language (e.g., 'en')
}
```

### Session Creation Response

```typescript
// From Ondato API
{
  id: string;                    // Ondato identification ID
  status: string;                // Initial status
  externalReferenceId: string;   // Echo of our session ID
}
```

### Status Check Response

```typescript
// From Ondato API
{
  id: string;
  status: string;                // 'Pending', 'Approved', 'Rejected'
  externalReferenceId: string;
  verificationData?: {
    dateOfBirth?: string;
    age?: number;
    documentType?: string;
    firstName?: string;
    lastName?: string;
  };
  rejectionReasons?: string[];
}
```

### Status Mapping

```typescript
// Ondato Status → App Status
'Pending'  → 'pending'
'Approved' → 'completed'
'Rejected' → 'failed'
```

## Cloudflare Worker Proxy (Recommended Approach)

Based on the successful Cloudflare video upload implementation, we'll use a Cloudflare Worker as a proxy to handle Ondato API calls. This eliminates Firebase authentication issues entirely.

### Architecture with Cloudflare Worker

```
React Native App
    ↓ (HTTPS)
Cloudflare Worker (ondato-proxy)
    ↓ (Basic Auth)
Ondato API
    ↓ (Results returned to app)
React Native App
    ↓ (Save to Firestore)
Firestore
```

### Cloudflare Worker Implementation

**Worker URL**: `https://ondato-proxy.striver-app.workers.dev`

**Endpoints**:
1. `POST /create-session` - Create Ondato verification session
2. `GET /check-status/:identificationId` - Check verification status

**Worker Code** (`ondato-proxy-worker.js`):

```javascript
// Ondato credentials (stored as Worker secrets)
const ONDATO_USERNAME = 'your_ondato_username';
const ONDATO_PASSWORD = 'your_ondato_password';
const ONDATO_SETUP_ID = 'fa1fb2cb-034f-4926-bd38-c8290510ade9';
const ONDATO_API_URL = 'https://api.ondato.com';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function handleRequest(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // Create session endpoint
    if (path === '/create-session' && request.method === 'POST') {
      const body = await request.json();
      const { externalReferenceId, language = 'en' } = body;

      if (!externalReferenceId) {
        return jsonResponse({ error: 'externalReferenceId is required' }, 400);
      }

      // Call Ondato API
      const authHeader = btoa(`${ONDATO_USERNAME}:${ONDATO_PASSWORD}`);
      const response = await fetch(`${ONDATO_API_URL}/v1/kyc/identifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
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

      const data = await response.json();

      if (!response.ok) {
        return jsonResponse({ error: data.message || 'Failed to create session' }, response.status);
      }

      // Generate verification URL
      const verificationUrl = `https://idv.ondato.com/setups/${ONDATO_SETUP_ID}?externalRef=${externalReferenceId}&successUrl=striver://verification-success&failureUrl=striver://verification-failed`;

      return jsonResponse({
        success: true,
        identificationId: data.id,
        sessionId: externalReferenceId,
        verificationUrl,
      });
    }

    // Check status endpoint
    if (path.startsWith('/check-status/') && request.method === 'GET') {
      const identificationId = path.split('/check-status/')[1];

      if (!identificationId) {
        return jsonResponse({ error: 'identificationId is required' }, 400);
      }

      // Call Ondato API
      const authHeader = btoa(`${ONDATO_USERNAME}:${ONDATO_PASSWORD}`);
      const response = await fetch(`${ONDATO_API_URL}/v1/kyc/identifications/${identificationId}`, {
        headers: {
          'Authorization': `Basic ${authHeader}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return jsonResponse({ error: data.message || 'Failed to check status' }, response.status);
      }

      // Map Ondato status to app status
      let appStatus = 'pending';
      if (data.status === 'Approved') appStatus = 'completed';
      else if (data.status === 'Rejected') appStatus = 'failed';

      return jsonResponse({
        success: true,
        status: appStatus,
        ondatoStatus: data.status,
        identificationId: data.id,
        verificationData: data.verificationData || {},
        rejectionReasons: data.rejectionReasons || [],
      });
    }

    return jsonResponse({ error: 'Not found' }, 404);

  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
```

### Updated Service Implementation

**src/services/ondatoService.ts**:

```typescript
const CLOUDFLARE_WORKER_URL = 'https://ondato-proxy.striver-app.workers.dev';

export interface CreateSessionParams {
  externalReferenceId: string;
  language?: string;
}

export interface CreateSessionResult {
  success: boolean;
  sessionId?: string;
  identificationId?: string;
  verificationUrl?: string;
  error?: string;
}

export interface CheckStatusParams {
  identificationId: string;
}

export interface CheckStatusResult {
  success: boolean;
  status?: 'pending' | 'completed' | 'failed';
  ondatoStatus?: string;
  verificationData?: any;
  rejectionReasons?: string[];
  error?: string;
}

export const ondatoService = {
  async createSession(params: CreateSessionParams): Promise<CreateSessionResult> {
    try {
      console.log('[OndatoService] Creating session:', params.externalReferenceId);
      
      const response = await fetch(`${CLOUDFLARE_WORKER_URL}/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          externalReferenceId: params.externalReferenceId,
          language: params.language || 'en',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('[OndatoService] Create session failed:', data);
        return {
          success: false,
          error: data.error || 'Failed to create verification session',
        };
      }

      console.log('[OndatoService] Session created:', data.identificationId);
      return {
        success: true,
        sessionId: data.sessionId,
        identificationId: data.identificationId,
        verificationUrl: data.verificationUrl,
      };

    } catch (error: any) {
      console.error('[OndatoService] Create session error:', error);
      return {
        success: false,
        error: error.message || 'Network error creating session',
      };
    }
  },

  async checkStatus(params: CheckStatusParams): Promise<CheckStatusResult> {
    try {
      console.log('[OndatoService] Checking status:', params.identificationId);
      
      const response = await fetch(`${CLOUDFLARE_WORKER_URL}/check-status/${params.identificationId}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('[OndatoService] Check status failed:', data);
        return {
          success: false,
          error: data.error || 'Failed to check verification status',
        };
      }

      console.log('[OndatoService] Status:', data.status);
      return {
        success: true,
        status: data.status,
        ondatoStatus: data.ondatoStatus,
        verificationData: data.verificationData,
        rejectionReasons: data.rejectionReasons,
      };

    } catch (error: any) {
      console.error('[OndatoService] Check status error:', error);
      return {
        success: false,
        error: error.message || 'Network error checking status',
      };
    }
  },
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

