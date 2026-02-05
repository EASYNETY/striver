# Age Verification System Toggle - Requirements

## Overview
Add admin panel configuration to switch between Ondato automated verification and manual selfie verification. Also implement Ondato without webhook dependency using polling mechanism.

## User Stories

### 1. Admin Configuration
**As an** admin  
**I want to** toggle between Ondato and manual verification methods  
**So that** I can choose the verification approach that best fits our needs

### 2. Ondato Without Webhook
**As a** user  
**I want to** complete Ondato verification without webhook dependency  
**So that** verification works even without webhook configuration

### 3. Dynamic Verification Routing
**As a** user  
**I want to** be automatically routed to the correct verification method  
**So that** I don't need to know which system is active

## Acceptance Criteria

### 1. Admin Panel Settings
- [ ] 1.1 Admin panel has "Verification Settings" section
- [ ] 1.2 Toggle switch to enable/disable Ondato
- [ ] 1.3 When Ondato is disabled, app uses manual verification (VerifyAgeScreen)
- [ ] 1.4 When Ondato is enabled, app uses OndatoVerification screen
- [ ] 1.5 Settings are stored in Firestore `appSettings/verification` document
- [ ] 1.6 Settings update in real-time across all app instances

### 2. Ondato Polling Implementation
- [ ] 2.1 Remove webhook dependency from Ondato flow
- [ ] 2.2 Implement status polling when user returns to app
- [ ] 2.3 Poll Ondato API every 5 seconds for max 2 minutes
- [ ] 2.4 Show loading state while polling
- [ ] 2.5 Handle timeout gracefully (show manual check option)
- [ ] 2.6 Update user verification status in Firestore when complete

### 3. Verification Router
- [ ] 3.1 Create verification router that checks admin settings
- [ ] 3.2 Route to OndatoVerification if Ondato is enabled
- [ ] 3.3 Route to VerifyAgeScreen if Ondato is disabled
- [ ] 3.4 Handle loading state while fetching settings
- [ ] 3.5 Fallback to manual verification if settings fetch fails

### 4. Direct Link Ondato (No API)
- [ ] 4.1 Use direct Ondato URL instead of API session creation
- [ ] 4.2 Generate unique external reference ID for each verification
- [ ] 4.3 Open Ondato URL with external reference in browser
- [ ] 4.4 Poll for verification status using external reference ID
- [ ] 4.5 Store verification attempt in Firestore with external reference

## Technical Requirements

### Firestore Structure
```javascript
// appSettings/verification
{
  method: 'ondato' | 'manual',
  ondatoEnabled: boolean,
  ondatoSetupId: 'fa1fb2cb-034f-4926-bd38-c8290510ade9',
  updatedAt: timestamp,
  updatedBy: string
}

// verification_attempts/{attemptId}
{
  userId: string,
  externalReferenceId: string,
  method: 'ondato' | 'manual',
  status: 'pending' | 'completed' | 'failed' | 'expired',
  verificationUrl: string,
  createdAt: timestamp,
  lastCheckedAt: timestamp,
  completedAt: timestamp | null
}
```

### Admin Panel Components
- Settings page with verification method toggle
- Real-time status indicator
- Test verification button

### App Components
- Verification router component
- Updated OndatoVerification with polling
- Shared verification status hook

## Non-Functional Requirements
- Settings changes take effect immediately
- Polling doesn't drain battery (max 2 minutes)
- Graceful degradation if Ondato is unavailable
- Clear error messages for users
- Admin audit log for settings changes

## Out of Scope
- Webhook implementation (future enhancement)
- Multiple verification providers
- A/B testing between methods
- Verification analytics dashboard
