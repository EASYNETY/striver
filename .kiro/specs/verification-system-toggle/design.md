# Age Verification System Toggle - Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Admin Panel                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Verification Settings                              │    │
│  │  ○ Manual Verification (Selfie + Admin Review)     │    │
│  │  ● Ondato Automated Verification                   │    │
│  │                                                      │    │
│  │  [Save Settings]                                    │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Firestore: appSettings/verification
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Mobile App                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  VerificationRouter                                 │    │
│  │  - Fetches admin settings                          │    │
│  │  - Routes to correct verification screen           │    │
│  └────────────────────────────────────────────────────┘    │
│                    ↓                    ↓                    │
│     ┌──────────────────┐    ┌──────────────────┐          │
│     │ VerifyAgeScreen  │    │ OndatoVerification│          │
│     │ (Manual)         │    │ (Automated)       │          │
│     └──────────────────┘    └──────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Admin Panel - Verification Settings Component

**Location**: `admin-panel/src/VerificationSettings.tsx`

**Features**:
- Radio button group for verification method selection
- Real-time sync with Firestore
- Status indicator showing current active method
- Test verification button
- Last updated timestamp and admin name

**UI Layout**:
```
┌──────────────────────────────────────────────────┐
│ Verification Settings                             │
├──────────────────────────────────────────────────┤
│                                                   │
│ Choose Age Verification Method:                  │
│                                                   │
│ ○ Manual Verification                            │
│   Users take selfie → Admin reviews manually     │
│   ✓ Full control                                 │
│   ✓ No external costs                            │
│   ✗ Requires manual review                       │
│                                                   │
│ ● Ondato Automated Verification                  │
│   Users verify ID document → Instant approval    │
│   ✓ Automated & instant                          │
│   ✓ Document verification                        │
│   ✗ External service cost                        │
│                                                   │
│ Current Status: ● Ondato Active                  │
│ Last Updated: 2 hours ago by admin@striver.com   │
│                                                   │
│ [Save Changes]  [Test Verification]              │
└──────────────────────────────────────────────────┘
```

### 2. Verification Router Component

**Location**: `src/components/VerificationRouter.tsx`

**Responsibilities**:
- Fetch verification settings from Firestore
- Show loading state while fetching
- Route to appropriate verification screen
- Handle errors gracefully

**Flow**:
```javascript
VerificationRouter
  ↓
Fetch appSettings/verification
  ↓
if (ondatoEnabled) → Navigate to OndatoVerification
else → Navigate to VerifyAgeScreen
```

### 3. Updated OndatoVerification (No Webhook)

**Location**: `src/screens/auth/OndatoVerification.tsx`

**Changes**:
- Remove API session creation
- Use direct Ondato URL with external reference
- Implement polling mechanism
- Add timeout handling

**Polling Strategy**:
```javascript
// Poll every 5 seconds for max 2 minutes (24 attempts)
const MAX_POLL_ATTEMPTS = 24;
const POLL_INTERVAL = 5000; // 5 seconds

// Polling states:
// 1. User opens Ondato in browser
// 2. User returns to app
// 3. App starts polling Firestore for status
// 4. When status changes to 'completed' or 'failed', stop polling
// 5. If 2 minutes pass, show manual check option
```

### 4. Verification Service

**Location**: `src/services/verificationService.ts`

**Methods**:
```typescript
interface VerificationService {
  // Get current verification method from Firestore
  getVerificationMethod(): Promise<'ondato' | 'manual'>;
  
  // Create verification attempt
  createVerificationAttempt(userId: string, method: string): Promise<string>;
  
  // Poll verification status
  pollVerificationStatus(attemptId: string): Promise<VerificationStatus>;
  
  // Generate Ondato URL with external reference
  generateOndatoUrl(externalRef: string): string;
  
  // Update verification status
  updateVerificationStatus(attemptId: string, status: string): Promise<void>;
}
```

## Data Flow

### Ondato Verification Flow (Without Webhook)

```
1. User clicks "Start Verification"
   ↓
2. App creates verification attempt in Firestore
   externalReferenceId: "ondato_${userId}_${timestamp}"
   status: 'pending'
   ↓
3. App generates Ondato URL:
   https://idv.ondato.com/setups/fa1fb2cb-034f-4926-bd38-c8290510ade9?externalRef=ondato_user123_1234567890
   ↓
4. App opens URL in browser (Linking.openURL)
   ↓
5. User completes verification on Ondato
   ↓
6. User returns to app (via deep link or manually)
   ↓
7. App detects return (AppState change)
   ↓
8. App starts polling Firestore verification_attempts
   - Check status every 5 seconds
   - Max 24 attempts (2 minutes)
   ↓
9. Admin manually checks Ondato dashboard and updates Firestore
   OR
   Future webhook updates Firestore automatically
   ↓
10. App detects status change
    ↓
11. Show success/failure screen
```

### Manual Verification Flow

```
1. User clicks "Start Scan"
   ↓
2. App opens camera
   ↓
3. User takes selfie
   ↓
4. App uploads to Firebase Storage
   ↓
5. App creates verification request in Firestore
   ↓
6. Admin reviews in admin panel
   ↓
7. Admin approves/rejects
   ↓
8. User sees status in app
```

## Firestore Security Rules

```javascript
// appSettings/verification - Admin only
match /appSettings/verification {
  allow read: if true; // All users can read
  allow write: if request.auth.token.admin == true; // Only admins can write
}

// verification_attempts - User can read own, admin can read all
match /verification_attempts/{attemptId} {
  allow read: if request.auth.uid == resource.data.userId 
              || request.auth.token.admin == true;
  allow create: if request.auth.uid == request.resource.data.userId;
  allow update: if request.auth.token.admin == true;
}
```

## API Endpoints (Firebase Functions)

### Optional: Manual Status Check Function

```typescript
// functions/src/index.ts
export const checkOndatoStatus = onCall(async (data, context) => {
  // This is optional - for manual admin check
  // Admin can trigger this to fetch status from Ondato API
  // and update Firestore
  
  const { externalReferenceId } = data;
  
  // Call Ondato API to get status
  // Update Firestore with result
  // Return status to admin
});
```

## UI/UX Considerations

### Loading States
- Show spinner while fetching verification settings
- Show "Checking verification status..." while polling
- Show progress indicator (e.g., "Checking... 15s")

### Error Handling
- If settings fetch fails → Default to manual verification
- If Ondato URL fails to open → Show error, offer manual verification
- If polling times out → Show "Still processing" with manual check option

### Success/Failure Feedback
- Success: Green checkmark, "Verified!" message
- Failure: Red X, clear explanation, retry option
- Timeout: Orange warning, "Check back later" message

## Testing Strategy

### Unit Tests
- Verification router logic
- Polling mechanism
- URL generation
- Status updates

### Integration Tests
- Admin panel settings update
- App receives settings changes
- Verification flow end-to-end
- Polling timeout handling

### Manual Testing
1. Toggle settings in admin panel
2. Verify app routes correctly
3. Test Ondato flow without webhook
4. Test manual verification flow
5. Test switching between methods mid-flow

## Performance Considerations

- Cache verification settings locally (5 minute TTL)
- Limit polling to 2 minutes max
- Use Firestore real-time listeners for status updates (more efficient than polling)
- Debounce admin settings changes

## Security Considerations

- Validate external reference ID format
- Ensure user can only access own verification attempts
- Admin-only access to settings
- Rate limit verification attempts (max 3 per hour per user)

## Future Enhancements

1. **Webhook Support**: Add webhook handling when available
2. **Analytics**: Track verification success rates by method
3. **A/B Testing**: Test which method has better completion rates
4. **Multiple Providers**: Support additional verification providers
5. **Verification History**: Show users their verification history
