# Requirements Document

## Introduction

This document specifies the requirements for fixing the UNAUTHENTICATED error in Ondato verification status checks by implementing direct API calls from the React Native app to the Ondato API, bypassing Firebase Functions for client-initiated operations. This approach follows the successful pattern used for Cloudflare video uploads.

## Glossary

- **Ondato_Service**: A React Native service module that makes direct HTTP calls to the Ondato API
- **Verification_Hook**: The React Native hook (`useOndatoVerification`) that manages verification state and operations
- **Firebase_Functions**: Backend serverless functions that handle webhook callbacks and server-side operations
- **Session_ID**: A unique identifier for an Ondato verification session
- **Verification_Attempt**: A Firestore document tracking a user's verification session
- **Ondato_API**: The external Ondato identity verification service API
- **Authentication_Token**: Firebase authentication token that sometimes fails when calling Firebase Functions

## Requirements

### Requirement 1: Direct API Service

**User Story:** As a developer, I want to create a service that calls Ondato API directly from React Native, so that verification operations don't fail due to Firebase authentication issues.

#### Acceptance Criteria

1. THE Ondato_Service SHALL provide a function to create verification sessions by calling the Ondato API directly
2. THE Ondato_Service SHALL provide a function to check verification status by calling the Ondato API directly
3. THE Ondato_Service SHALL use HTTP fetch for all API calls
4. THE Ondato_Service SHALL include Ondato credentials (username, password, setup ID, API URL)
5. THE Ondato_Service SHALL format API requests with proper authentication headers using Basic Auth
6. THE Ondato_Service SHALL handle API responses and extract relevant data (session ID, verification URL, status)
7. WHEN an API call fails, THE Ondato_Service SHALL return error information with descriptive messages

### Requirement 2: Session Creation

**User Story:** As a user, I want to start age verification without authentication errors, so that I can complete the verification process smoothly.

#### Acceptance Criteria

1. WHEN a user starts verification with a date of birth, THE Ondato_Service SHALL generate a unique session ID
2. WHEN creating a session, THE Ondato_Service SHALL call the Ondato API endpoint `/v1/kyc/identifications` with POST method
3. WHEN creating a session, THE Ondato_Service SHALL include the external reference ID, setup ID, success URL, error URL, and language in the request body
4. WHEN the Ondato API returns success, THE Ondato_Service SHALL return the session ID and verification URL
5. WHEN the Ondato API returns an error, THE Ondato_Service SHALL return an error object with the failure reason

### Requirement 3: Status Checking

**User Story:** As a user, I want to check my verification status without authentication errors, so that I can know when my verification is complete.

#### Acceptance Criteria

1. WHEN checking status with a session ID, THE Ondato_Service SHALL call the Ondato API endpoint `/v1/kyc/identifications/{identificationId}` with GET method
2. WHEN the Ondato API returns a status, THE Ondato_Service SHALL map Ondato status values to application status values
3. THE Ondato_Service SHALL map "Approved" to "completed"
4. THE Ondato_Service SHALL map "Rejected" to "failed"
5. THE Ondato_Service SHALL map "Pending" to "pending"
6. WHEN the Ondato API returns an error, THE Ondato_Service SHALL return the current cached status from Firestore

### Requirement 4: Hook Integration

**User Story:** As a developer, I want to update the verification hook to use the direct API service, so that the app no longer depends on Firebase Functions for client operations.

#### Acceptance Criteria

1. THE Verification_Hook SHALL call Ondato_Service functions instead of Firebase Functions for session creation
2. THE Verification_Hook SHALL call Ondato_Service functions instead of Firebase Functions for status checking
3. THE Verification_Hook SHALL continue to use Firestore for tracking verification attempts
4. THE Verification_Hook SHALL continue to use Firestore for updating user profile status
5. WHEN starting verification, THE Verification_Hook SHALL save the verification attempt to Firestore
6. WHEN checking status, THE Verification_Hook SHALL update the verification attempt in Firestore with the latest status
7. THE Verification_Hook SHALL maintain the same interface and return types as the current implementation

### Requirement 5: Error Handling

**User Story:** As a user, I want clear error messages when verification operations fail, so that I understand what went wrong and what to do next.

#### Acceptance Criteria

1. WHEN the Ondato API is unreachable, THE Ondato_Service SHALL return an error indicating network connectivity issues
2. WHEN the Ondato API returns authentication errors, THE Ondato_Service SHALL return an error indicating credential problems
3. WHEN the Ondato API returns validation errors, THE Ondato_Service SHALL return an error with the validation failure details
4. WHEN Firestore operations fail, THE Verification_Hook SHALL log the error and continue with the API operation
5. THE Verification_Hook SHALL display user-friendly error messages in the UI

### Requirement 6: Firebase Functions Preservation

**User Story:** As a system administrator, I want Firebase Functions to continue handling webhooks and backend operations, so that verification results are properly processed and stored.

#### Acceptance Criteria

1. THE Firebase_Functions SHALL continue to handle Ondato webhook callbacks
2. THE Firebase_Functions SHALL continue to update user verification status when webhooks are received
3. THE Firebase_Functions SHALL continue to create notifications for verification status changes
4. THE Firebase_Functions SHALL continue to update profile completion percentages
5. THE Firebase_Functions SHALL NOT be called by the React Native app for session creation or status checking

### Requirement 7: Firestore Integration

**User Story:** As a developer, I want verification attempts tracked in Firestore, so that we have a complete audit trail and can recover from failures.

#### Acceptance Criteria

1. WHEN a verification session is created, THE Verification_Hook SHALL create a verification_attempts document in Firestore
2. THE verification_attempts document SHALL include userId, sessionId, method, status, verificationUrl, metadata, createdAt, and expiresAt fields
3. WHEN verification status is checked, THE Verification_Hook SHALL update the verification_attempts document with the latest status
4. WHEN a verification is completed, THE Verification_Hook SHALL update the user document with ageVerificationStatus set to "verified"
5. WHEN a verification fails, THE Verification_Hook SHALL update the user document with ageVerificationStatus set to "rejected"

### Requirement 8: Backward Compatibility

**User Story:** As a developer, I want the new implementation to maintain the same interface, so that existing screens and components continue to work without changes.

#### Acceptance Criteria

1. THE Verification_Hook SHALL export the same function names as the current implementation
2. THE Verification_Hook SHALL return the same data structures as the current implementation
3. THE Verification_Hook SHALL maintain the same state management patterns as the current implementation
4. WHEN the OndatoVerification screen calls the hook, THE screen SHALL work without any code changes
5. THE Verification_Hook SHALL continue to support deep link handling for verification success and failure callbacks
