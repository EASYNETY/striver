# Age Verification System Toggle - Tasks

## Phase 1: Firestore Setup & Admin Panel

### Task 1: Create Firestore Settings Structure
- [ ] 1.1 Create `appSettings` collection in Firestore
- [ ] 1.2 Add `verification` document with default settings
- [ ] 1.3 Update Firestore security rules for appSettings
- [ ] 1.4 Test read/write permissions

### Task 2: Build Admin Panel Settings Component
- [ ] 2.1 Create `admin-panel/src/components/VerificationSettings.tsx`
- [ ] 2.2 Add radio button group for method selection
- [ ] 2.3 Implement Firestore read/write for settings
- [ ] 2.4 Add real-time status indicator
- [ ] 2.5 Add last updated timestamp display
- [ ] 2.6 Style component to match admin panel theme

### Task 3: Integrate Settings into Admin Panel
- [ ] 3.1 Add "Verification Settings" to admin panel navigation
- [ ] 3.2 Create route for settings page
- [ ] 3.3 Add admin-only access control
- [ ] 3.4 Test settings persistence

## Phase 2: App-Side Verification Router

### Task 4: Create Verification Service
- [ ] 4.1 Create `src/services/verificationService.ts`
- [ ] 4.2 Implement `getVerificationMethod()` function
- [ ] 4.3 Implement `createVerificationAttempt()` function
- [ ] 4.4 Implement `generateOndatoUrl()` function
- [ ] 4.5 Add error handling and fallbacks

### Task 5: Build Verification Router Component
- [ ] 5.1 Create `src/components/VerificationRouter.tsx`
- [ ] 5.2 Fetch verification settings from Firestore
- [ ] 5.3 Implement loading state
- [ ] 5.4 Route to OndatoVerification or VerifyAgeScreen based on settings
- [ ] 5.5 Handle errors gracefully (fallback to manual)
- [ ] 5.6 Add unit tests

### Task 6: Update Navigation Flow
- [ ] 6.1 Replace direct navigation to verification screens with VerificationRouter
- [ ] 6.2 Update AccountTypeScreen navigation
- [ ] 6.3 Update DateOfBirthScreen navigation
- [ ] 6.4 Test navigation flow for both methods

## Phase 3: Ondato Without Webhook

### Task 7: Update OndatoVerification Screen
- [ ] 7.1 Remove API session creation logic
- [ ] 7.2 Implement direct URL generation with external reference
- [ ] 7.3 Add verification attempt creation in Firestore
- [ ] 7.4 Update URL opening logic
- [ ] 7.5 Test URL generation and opening

### Task 8: Implement Polling Mechanism
- [ ] 8.1 Add AppState listener for user return detection
- [ ] 8.2 Implement polling logic (5s interval, 2min max)
- [ ] 8.3 Add Firestore listener for verification status
- [ ] 8.4 Implement timeout handling
- [ ] 8.5 Add loading UI with progress indicator
- [ ] 8.6 Test polling with different scenarios

### Task 9: Handle Verification Results
- [ ] 9.1 Update success screen for Ondato completion
- [ ] 9.2 Update failure screen with retry option
- [ ] 9.3 Add timeout screen with manual check option
- [ ] 9.4 Update user profile on verification success
- [ ] 9.5 Navigate to next screen on completion

## Phase 4: Testing & Polish

### Task 10: End-to-End Testing
- [ ] 10.1 Test admin panel settings toggle
- [ ] 10.2 Test app routing with Ondato enabled
- [ ] 10.3 Test app routing with manual verification enabled
- [ ] 10.4 Test Ondato flow without webhook
- [ ] 10.5 Test manual verification flow
- [ ] 10.6 Test switching methods mid-flow

### Task 11: Error Handling & Edge Cases
- [ ] 11.1 Test with no internet connection
- [ ] 11.2 Test with Firestore unavailable
- [ ] 11.3 Test with Ondato URL failing to open
- [ ] 11.4 Test polling timeout scenario
- [ ] 11.5 Add user-friendly error messages

### Task 12: Documentation & Cleanup
- [ ] 12.1 Update ONDATO_SETUP_COMPLETE.md with new flow
- [ ] 12.2 Add admin panel user guide
- [ ] 12.3 Add developer documentation
- [ ] 12.4 Remove unused webhook code (optional)
- [ ] 12.5 Update environment variables documentation

## Phase 5: Optional Enhancements

### Task 13: Admin Manual Status Check (Optional)
- [ ] 13.1 Add "Check Ondato Status" button in admin panel
- [ ] 13.2 Create Firebase function to query Ondato API
- [ ] 13.3 Update Firestore with fetched status
- [ ] 13.4 Show result to admin

### Task 14: Analytics & Monitoring (Optional)
- [ ] 14.1 Add analytics events for verification method used
- [ ] 14.2 Track verification success/failure rates
- [ ] 14.3 Monitor polling timeout frequency
- [ ] 14.4 Create admin dashboard for verification metrics

## Estimated Timeline

- **Phase 1**: 4-6 hours
- **Phase 2**: 3-4 hours
- **Phase 3**: 5-7 hours
- **Phase 4**: 3-4 hours
- **Phase 5**: 4-6 hours (optional)

**Total**: 15-21 hours (core features)

## Dependencies

- Firebase Admin SDK
- Firestore security rules access
- Admin panel access
- React Native app access

## Risks & Mitigation

**Risk**: Ondato URL format changes
**Mitigation**: Make URL generation configurable in admin settings

**Risk**: Polling drains battery
**Mitigation**: Strict 2-minute timeout, efficient Firestore listeners

**Risk**: Users don't return to app after Ondato
**Mitigation**: Clear instructions, deep link handling, manual check option

**Risk**: Settings don't sync in real-time
**Mitigation**: Use Firestore real-time listeners, add manual refresh option
