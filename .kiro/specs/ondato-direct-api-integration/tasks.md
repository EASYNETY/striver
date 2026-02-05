# Implementation Tasks: Ondato Direct API Integration

## Task List

- [ ] 1. Create Cloudflare Worker for Ondato API Proxy
  - [ ] 1.1 Create worker file `ondato-proxy-worker.js`
  - [ ] 1.2 Implement `/create-session` endpoint
  - [ ] 1.3 Implement `/check-status/:identificationId` endpoint
  - [ ] 1.4 Add CORS headers for React Native requests
  - [ ] 1.5 Deploy worker to Cloudflare
  - [ ] 1.6 Test worker endpoints with Postman or curl

- [ ] 2. Create Ondato Service Module
  - [ ] 2.1 Create `src/services/ondatoService.ts`
  - [ ] 2.2 Implement `createSession()` function
  - [ ] 2.3 Implement `checkStatus()` function
  - [ ] 2.4 Add error handling and logging
  - [ ] 2.5 Add TypeScript interfaces for request/response types

- [ ] 3. Update Verification Hook
  - [ ] 3.1 Update `startVerification()` to use ondatoService
  - [ ] 3.2 Update `checkStatus()` to use ondatoService
  - [ ] 3.3 Add Firestore integration for tracking attempts
  - [ ] 3.4 Add Firestore integration for updating user profile
  - [ ] 3.5 Remove Firebase Functions calls
  - [ ] 3.6 Maintain backward compatibility with existing interface

- [ ] 4. Update OndatoVerification Screen
  - [ ] 4.1 Update imports to use new ondatoService
  - [ ] 4.2 Update `startVerification()` to use new flow
  - [ ] 4.3 Update `checkStatus()` to use new flow
  - [ ] 4.4 Remove Firebase Functions httpsCallable references
  - [ ] 4.5 Test deep link handling
  - [ ] 4.6 Test app state change handling

- [ ] 5. Update Firestore Data Models
  - [ ] 5.1 Ensure verification_attempts collection has identificationId field
  - [ ] 5.2 Ensure verification_attempts collection has ondatoStatus field
  - [ ] 5.3 Update Firestore security rules if needed
  - [ ] 5.4 Add indexes for query performance if needed

- [ ] 6. Testing and Validation
  - [ ] 6.1 Test session creation flow
  - [ ] 6.2 Test status checking flow
  - [ ] 6.3 Test deep link success callback
  - [ ] 6.4 Test deep link failure callback
  - [ ] 6.5 Test app state change (background to foreground)
  - [ ] 6.6 Test error handling for network failures
  - [ ] 6.7 Test error handling for Ondato API errors
  - [ ] 6.8 Verify Firestore data is saved correctly

- [ ] 7. Documentation and Cleanup
  - [ ] 7.1 Update ONDATO_INTEGRATION_GUIDE.md with new flow
  - [ ] 7.2 Document Cloudflare Worker deployment steps
  - [ ] 7.3 Remove deprecated Firebase Functions code (optional)
  - [ ] 7.4 Add comments to new code
  - [ ] 7.5 Update environment variable documentation

## Task Details

### Task 1: Create Cloudflare Worker for Ondato API Proxy

Create a Cloudflare Worker that acts as a proxy between the React Native app and the Ondato API. This eliminates Firebase authentication issues.

**Files to create:**
- `functions/cloudflare-workers/ondato-proxy-worker.js`

**Implementation notes:**
- Use Cloudflare Worker secrets for Ondato credentials
- Implement proper CORS headers for React Native
- Add error handling for Ondato API failures
- Map Ondato status values to app status values

**Deployment:**
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create worker
wrangler init ondato-proxy

# Deploy worker
wrangler publish
```

### Task 2: Create Ondato Service Module

Create a new service module that encapsulates all Ondato API interactions via the Cloudflare Worker.

**Files to create:**
- `src/services/ondatoService.ts`

**Implementation notes:**
- Use fetch API for HTTP requests
- Add comprehensive error handling
- Add detailed logging for debugging
- Follow the same pattern as cloudflareVideoService.ts

### Task 3: Update Verification Hook

Update the existing verification hook to use the new ondatoService instead of Firebase Functions.

**Files to modify:**
- `src/hooks/useOndatoVerification.ts`

**Implementation notes:**
- Replace httpsCallable with ondatoService calls
- Maintain the same interface for backward compatibility
- Add Firestore operations for data persistence
- Keep state management unchanged

### Task 4: Update OndatoVerification Screen

Update the verification screen to use the new flow.

**Files to modify:**
- `src/screens/auth/OndatoVerification.tsx`

**Implementation notes:**
- Remove Firebase Functions imports
- Update startVerification() function
- Update checkStatus() function
- Ensure deep links still work
- Ensure app state changes still trigger status checks

### Task 5: Update Firestore Data Models

Ensure Firestore collections have the necessary fields for the new flow.

**Collections to update:**
- `verification_attempts`
- `users`

**Implementation notes:**
- Add identificationId field to verification_attempts
- Add ondatoStatus field to verification_attempts
- Ensure indexes exist for queries
- Update security rules if needed

### Task 6: Testing and Validation

Thoroughly test the new implementation.

**Test scenarios:**
- Happy path: User completes verification successfully
- Failure path: User fails verification
- Network error: Cloudflare Worker is unreachable
- API error: Ondato API returns error
- Deep link: Success and failure callbacks work
- App state: Status check triggers when app returns to foreground

### Task 7: Documentation and Cleanup

Update documentation and clean up deprecated code.

**Files to update:**
- `ONDATO_INTEGRATION_GUIDE.md`
- `ONDATO_QUICK_START.md`
- `ONDATO_SETUP_COMPLETE.md`

**Implementation notes:**
- Document the new Cloudflare Worker approach
- Add deployment instructions for the worker
- Update troubleshooting guides
- Remove references to Firebase Functions for client operations

## Success Criteria

- [ ] No more UNAUTHENTICATED errors when checking verification status
- [ ] Session creation works without Firebase authentication
- [ ] Status checking works without Firebase authentication
- [ ] Deep links continue to work as expected
- [ ] App state changes trigger status checks
- [ ] Firestore data is saved correctly
- [ ] User profile is updated when verification completes
- [ ] Error messages are clear and actionable
- [ ] All existing functionality is preserved
