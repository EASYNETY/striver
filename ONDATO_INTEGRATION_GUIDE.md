# Ondato Age Verification Integration Guide

## Overview

This guide covers the complete integration of Ondato's identity verification service for parent age verification in the Striver app.

## Architecture

### Flow Diagram
```
User (Parent) → Frontend (React Native) → Edge Function (verify-age) → Ondato API
                     ↓                                                      ↓
              Deep Link Return  ←  Webhook (ondato-webhook)  ←  Ondato Callback
```

### Components

1. **Frontend Components**
   - `OndatoVerification.tsx` - Main verification screen
   - `useOndatoVerification.ts` - Hook for verification logic
   - Deep link handling for success/failure

2. **Backend (Supabase Edge Functions)**
   - `verify-age/index.ts` - Creates Ondato session
   - `ondato-webhook/index.ts` - Handles Ondato callbacks

3. **Database Tables**
   - `verification_attempts` - Tracks verification sessions
   - `users` - Stores verification status

## Setup Steps

### 1. Ondato Dashboard Configuration

#### A. Get API Credentials
1. Log in to [Ondato Admin Panel](https://os.ondato.com/admin-panel)
2. Navigate to Settings → API Keys
3. Copy:
   - `ONDATO_USERNAME` (Basic Auth username)
   - `ONDATO_PASSWORD` (Basic Auth password)
   - `ONDATO_SETUP_ID` (from IDV Configuration)

#### B. Configure IDV Flow
1. Go to [IDV Configuration](https://os.ondato.com/admin-panel/idv-configuration)
2. Create/Edit a setup for age verification:
   - **Name**: "Striver Parent Age Verification"
   - **Type**: Identity Verification
   - **Required Documents**: Government ID
   - **Liveness Check**: Enabled
   - **Age Verification**: Minimum age 18+
3. Save and copy the **Setup ID**

#### C. Configure Webhooks
1. In Ondato Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-project.supabase.co/functions/v1/ondato-webhook`
3. Enable events:
   - `KycIdentification.Approved`
   - `KycIdentification.Rejected`
   - `IdentityVerification.StatusChanged`
4. Set authentication: Basic Auth (same credentials as API)

### 2. Environment Variables

Add to your Supabase Edge Functions `.env`:

```env
ONDATO_USERNAME=your_username
ONDATO_PASSWORD=your_password
ONDATO_SETUP_ID=your_setup_id
ONDATO_API_URL=https://api.ondato.com
ONDATO_IDV_URL=https://idv.ondato.com
```

### 3. Database Schema

```sql
-- verification_attempts table
CREATE TABLE IF NOT EXISTS verification_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  method TEXT NOT NULL, -- 'ondato'
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed', 'expired'
  verification_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes
CREATE INDEX idx_verification_attempts_user_id ON verification_attempts(user_id);
CREATE INDEX idx_verification_attempts_session_id ON verification_attempts(session_id);
CREATE INDEX idx_verification_attempts_status ON verification_attempts(status);

-- Update users table for verification status
ALTER TABLE users ADD COLUMN IF NOT EXISTS age_verification_status TEXT DEFAULT 'unverified';
ALTER TABLE users ADD COLUMN IF NOT EXISTS age_verification_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_status JSONB DEFAULT '{}'::jsonb;
```

### 4. Deep Link Configuration

#### iOS (Info.plist)
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>striver</string>
    </array>
  </dict>
</array>
```

#### Android (AndroidManifest.xml)
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="striver" />
</intent-filter>
```

## API Integration

### Ondato API Endpoints

#### 1. Create Verification Session
```
POST https://api.ondato.com/v1/kyc/identifications
Authorization: Basic base64(username:password)
Content-Type: application/json

{
  "externalReferenceId": "unique_session_id",
  "setupId": "your_setup_id",
  "successUrl": "striver://verification-success",
  "errorUrl": "striver://verification-failed",
  "language": "en"
}
```

#### 2. Get Verification Status
```
GET https://api.ondato.com/v1/kyc/identifications/{identificationId}
Authorization: Basic base64(username:password)
```

### Webhook Payload Examples

#### Success Webhook
```json
{
  "EventType": "KycIdentification.Approved",
  "Payload": {
    "Id": "identification_id",
    "ExternalReferenceId": "session_id",
    "Status": "Approved",
    "VerificationData": {
      "DateOfBirth": "1990-01-01",
      "Age": 34,
      "DocumentType": "Passport",
      "DocumentNumber": "XXX"
    }
  }
}
```

#### Failure Webhook
```json
{
  "EventType": "KycIdentification.Rejected",
  "Payload": {
    "Id": "identification_id",
    "ExternalReferenceId": "session_id",
    "Status": "Rejected",
    "RejectionReasons": ["Age requirement not met"]
  }
}
```

## Testing

### Test Mode
Ondato provides a test environment:
- Test API URL: `https://api-sandbox.ondato.com`
- Test IDV URL: `https://idv-sandbox.ondato.com`

### Test Scenarios
1. **Successful Verification**: Use test documents provided by Ondato
2. **Age Rejection**: Use document with DOB showing age < 18
3. **Liveness Failure**: Intentionally fail liveness check
4. **Timeout**: Don't complete verification within 30 minutes

## Error Handling

### Common Errors

| Error Code | Description | Resolution |
|------------|-------------|------------|
| 401 | Invalid credentials | Check ONDATO_USERNAME and ONDATO_PASSWORD |
| 404 | Setup ID not found | Verify ONDATO_SETUP_ID |
| 429 | Rate limit exceeded | Implement retry logic with backoff |
| 500 | Ondato server error | Retry after delay |

### User-Facing Messages

```typescript
const ERROR_MESSAGES = {
  'network_error': 'Unable to connect. Please check your internet connection.',
  'session_expired': 'Verification session expired. Please try again.',
  'age_requirement': 'You must be 18 or older to create a parent account.',
  'verification_failed': 'Verification failed. Please try again or contact support.',
  'too_many_attempts': 'Too many verification attempts. Please try again later.'
};
```

## Security Considerations

1. **API Credentials**: Store in environment variables, never in code
2. **Webhook Validation**: Verify Basic Auth on webhook endpoint
3. **Session Expiry**: Expire sessions after 30 minutes
4. **Rate Limiting**: Limit verification attempts per user
5. **Data Privacy**: Store minimal PII, comply with GDPR/COPPA

## Monitoring

### Key Metrics
- Verification success rate
- Average completion time
- Abandonment rate
- Error rates by type

### Logging
```typescript
// Log verification events
console.log('[Ondato] Session created:', { sessionId, userId });
console.log('[Ondato] Webhook received:', { event, status });
console.log('[Ondato] Verification completed:', { userId, result });
```

## Support

- **Ondato Documentation**: https://ondato.atlassian.net/wiki/spaces/PUB/pages/2268626955/Ondato+APIs
- **Ondato Support**: support@ondato.com
- **Admin Panel**: https://os.ondato.com/admin-panel

## Next Steps

1. Set up Ondato account and get credentials
2. Configure IDV flow in Ondato dashboard
3. Deploy Edge Functions with environment variables
4. Test in sandbox environment
5. Deploy to production
6. Monitor verification metrics
