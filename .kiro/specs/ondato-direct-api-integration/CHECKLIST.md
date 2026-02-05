# Implementation Checklist

Use this checklist to track your progress implementing the Ondato Direct API Integration.

## Pre-Implementation

- [ ] Read QUICK_START.md
- [ ] Read IMPLEMENTATION_GUIDE.md
- [ ] Understand the problem (UNAUTHENTICATED error)
- [ ] Understand the solution (Cloudflare Worker proxy)
- [ ] Have Ondato credentials ready
- [ ] Have Cloudflare account ready
- [ ] Have 4-6 hours available for implementation

## Phase 1: Cloudflare Worker Setup (30 min)

### Install Tools
- [ ] Install Node.js (if not already installed)
- [ ] Install Wrangler CLI: `npm install -g wrangler`
- [ ] Verify installation: `wrangler --version`

### Cloudflare Account
- [ ] Login to Cloudflare: `wrangler login`
- [ ] Verify login: `wrangler whoami`
- [ ] Note your account ID from dashboard

### Worker Configuration
- [ ] Open `functions/cloudflare-workers/ondato-proxy-worker.js`
- [ ] Replace `ONDATO_USERNAME` with actual username
- [ ] Replace `ONDATO_PASSWORD` with actual password
- [ ] Verify `ONDATO_SETUP_ID` is correct
- [ ] Open `functions/cloudflare-workers/wrangler.toml`
- [ ] Replace `account_id` with your Cloudflare account ID

### Deploy Worker
- [ ] Navigate to `functions/cloudflare-workers`
- [ ] Run `wrangler publish` (or `deploy-ondato-worker.bat` on Windows)
- [ ] Note the worker URL from deployment output
- [ ] Worker URL: `_______________________________________`

### Test Worker
- [ ] Test health endpoint: `curl https://your-worker-url/health`
- [ ] Health check passes ✅
- [ ] Run test script: `node test-worker.js https://your-worker-url`
- [ ] All tests pass ✅
- [ ] View worker logs: `wrangler tail`

## Phase 2: React Native Service (15 min)

### Service Module
- [ ] File `src/services/ondatoService.ts` already created ✅
- [ ] Open `src/services/ondatoService.ts`
- [ ] Update `CLOUDFLARE_WORKER_URL` with your worker URL
- [ ] Save file
- [ ] Verify no TypeScript errors

### Test Service (Optional)
- [ ] Import service in a test file
- [ ] Call `ondatoService.healthCheck()`
- [ ] Verify it returns `{ ok: true }`

## Phase 3: Update Verification Hook (30 min)

### Backup Current Code
- [ ] Copy `src/hooks/useOndatoVerification.ts` to `useOndatoVerification.ts.backup`

### Update Imports
- [ ] Add: `import { ondatoService } from '../services/ondatoService';`
- [ ] Add: `import { db, firebaseAuth } from '../api/firebase';`
- [ ] Add Firestore imports: `addDoc, collection, serverTimestamp, updateDoc, doc, query, where, getDocs`
- [ ] Remove: `import { getFunctions, httpsCallable } from '@react-native-firebase/functions';`

### Update startVerification Function
- [ ] Remove Firebase Functions call
- [ ] Add session ID generation
- [ ] Add `ondatoService.createSession()` call
- [ ] Add Firestore save for verification_attempts
- [ ] Add Firestore update for user profile
- [ ] Add error handling
- [ ] Test compilation

### Update checkStatus Function
- [ ] Remove Firebase Functions call
- [ ] Add `ondatoService.checkStatus()` call
- [ ] Add Firestore query for verification attempt
- [ ] Add Firestore update for verification attempt
- [ ] Add Firestore update for user profile if completed
- [ ] Add error handling
- [ ] Test compilation

### Verify Interface
- [ ] Verify function signatures match original
- [ ] Verify return types match original
- [ ] Verify state management unchanged
- [ ] No TypeScript errors

## Phase 4: Update Verification Screen (30 min)

### Backup Current Code
- [ ] Copy `src/screens/auth/OndatoVerification.tsx` to `OndatoVerification.tsx.backup`

### Update Imports
- [ ] Verify `useOndatoVerification` import exists
- [ ] Remove: `import { httpsCallable } from '@react-native-firebase/functions';`
- [ ] Remove: `import { cloudFunctions } from '../../api/firebase';` (if not used elsewhere)

### Update checkStatus Function
- [ ] Replace Firebase Functions call with hook's checkStatus
- [ ] Update to pass both sessionId and identificationId
- [ ] Keep Firestore listener logic
- [ ] Add error handling
- [ ] Test compilation

### Update startVerification Function
- [ ] Verify it uses hook's startVerification
- [ ] Remove direct Firebase Functions calls
- [ ] Keep fallback logic if needed
- [ ] Test compilation

### Verify Functionality
- [ ] Deep link handling unchanged
- [ ] App state change handling unchanged
- [ ] UI rendering unchanged
- [ ] No TypeScript errors

## Phase 5: Firestore Updates (15 min)

### Verification Attempts Collection
- [ ] Check collection exists in Firestore console
- [ ] Verify `identificationId` field exists
- [ ] Verify `ondatoStatus` field exists
- [ ] Verify `metadata.ondatoIdentificationId` exists

### Users Collection
- [ ] Check collection exists in Firestore console
- [ ] Verify `ageVerificationStatus` field exists
- [ ] Verify `profileStatus.ageVerification` exists

### Security Rules (Optional)
- [ ] Review Firestore security rules
- [ ] Add rules for verification_attempts if needed
- [ ] Test rules with Firestore emulator (optional)

### Indexes (Optional)
- [ ] Check if indexes are needed for queries
- [ ] Create indexes if needed
- [ ] Wait for indexes to build

## Phase 6: Testing (1-2 hours)

### Unit Testing (Optional)
- [ ] Test ondatoService.createSession()
- [ ] Test ondatoService.checkStatus()
- [ ] Test ondatoService.healthCheck()

### Integration Testing
- [ ] Start React Native app: `npm start`
- [ ] Navigate to age verification screen
- [ ] Click "Start Verification"
- [ ] Verify Ondato page opens
- [ ] Check console logs for success messages
- [ ] No UNAUTHENTICATED errors ✅

### Status Check Testing
- [ ] Complete verification in Ondato
- [ ] Return to app
- [ ] Click "Refresh Status Now"
- [ ] Verify status updates correctly
- [ ] Check console logs for status updates
- [ ] No UNAUTHENTICATED errors ✅

### Deep Link Testing
- [ ] Complete verification in Ondato
- [ ] Verify deep link redirects to app
- [ ] Verify success screen shows
- [ ] Check Firestore for updated data

### App State Testing
- [ ] Start verification
- [ ] Switch to another app (background)
- [ ] Return to Striver app (foreground)
- [ ] Verify status check triggers automatically
- [ ] Check console logs

### Error Handling Testing
- [ ] Turn off WiFi
- [ ] Try to start verification
- [ ] Verify error message shows
- [ ] Turn on WiFi
- [ ] Retry verification
- [ ] Verify it works

### Firestore Testing
- [ ] Check verification_attempts collection
- [ ] Verify document created with correct fields
- [ ] Verify identificationId is saved
- [ ] Verify status updates correctly
- [ ] Check users collection
- [ ] Verify ageVerificationStatus updates

## Phase 7: Documentation (30 min)

### Update Guides
- [ ] Update ONDATO_INTEGRATION_GUIDE.md with new flow
- [ ] Update ONDATO_QUICK_START.md if needed
- [ ] Update ONDATO_SETUP_COMPLETE.md if needed

### Add Comments
- [ ] Add comments to ondatoService.ts
- [ ] Add comments to updated hook functions
- [ ] Add comments to updated screen functions

### Document Worker
- [ ] Document worker URL in team docs
- [ ] Document deployment process
- [ ] Document monitoring process

### Update Environment Docs
- [ ] Document Cloudflare Worker requirement
- [ ] Document Ondato credentials requirement
- [ ] Update setup instructions for new developers

## Phase 8: Deployment (30 min)

### Pre-Deployment Checks
- [ ] All tests pass ✅
- [ ] No TypeScript errors ✅
- [ ] No console errors ✅
- [ ] Worker is deployed and responding ✅
- [ ] Code is committed to git

### Deploy to Staging (if applicable)
- [ ] Deploy React Native app to staging
- [ ] Test verification flow in staging
- [ ] Monitor logs for errors
- [ ] Verify no UNAUTHENTICATED errors

### Deploy to Production
- [ ] Deploy React Native app to production
- [ ] Monitor logs for errors
- [ ] Test verification flow in production
- [ ] Verify no UNAUTHENTICATED errors
- [ ] Monitor user feedback

### Post-Deployment Monitoring
- [ ] Monitor Cloudflare Worker logs: `wrangler tail`
- [ ] Monitor React Native logs
- [ ] Monitor Firestore for verification attempts
- [ ] Monitor user support tickets
- [ ] Track UNAUTHENTICATED error rate (should be 0%)

## Phase 9: Cleanup (Optional)

### Code Cleanup
- [ ] Remove backup files if everything works
- [ ] Remove unused imports
- [ ] Remove commented-out code
- [ ] Format code

### Firebase Functions Cleanup (Optional)
- [ ] Keep webhook handler (DO NOT DELETE)
- [ ] Consider removing client-facing functions (optional)
- [ ] Update Firebase Functions documentation

### Documentation Cleanup
- [ ] Archive old documentation
- [ ] Update README files
- [ ] Update team wiki

## Success Metrics

Track these after deployment:

- [ ] UNAUTHENTICATED error rate: 0% ✅
- [ ] Verification completion rate: Increased ✅
- [ ] Status check success rate: 99%+ ✅
- [ ] User satisfaction: Improved ✅
- [ ] Support tickets: Decreased ✅
- [ ] Average verification time: Decreased ✅

## Rollback Plan (If Needed)

If something goes wrong:

- [ ] Revert `src/hooks/useOndatoVerification.ts` from backup
- [ ] Revert `src/screens/auth/OndatoVerification.tsx` from backup
- [ ] Deploy reverted code
- [ ] Debug worker issues
- [ ] Fix issues
- [ ] Redeploy

## Final Verification

- [ ] No UNAUTHENTICATED errors in logs ✅
- [ ] Session creation works 100% of time ✅
- [ ] Status checking works 100% of time ✅
- [ ] Deep links work correctly ✅
- [ ] App state changes work correctly ✅
- [ ] Firestore data saves correctly ✅
- [ ] User profile updates correctly ✅
- [ ] Error messages are clear ✅
- [ ] Performance is improved ✅
- [ ] User experience is better ✅

## Completion

- [ ] All checklist items completed ✅
- [ ] All tests pass ✅
- [ ] Deployed to production ✅
- [ ] Monitoring in place ✅
- [ ] Documentation updated ✅
- [ ] Team notified ✅

**Congratulations! You've successfully implemented the Ondato Direct API Integration! 🎉**

---

## Notes

Use this space to track issues, questions, or observations during implementation:

```
Date: ___________
Issue: 
Resolution:

Date: ___________
Issue:
Resolution:

Date: ___________
Issue:
Resolution:
```

## Time Tracking

Track your time spent on each phase:

- Phase 1 (Worker Setup): _____ minutes
- Phase 2 (Service): _____ minutes
- Phase 3 (Hook): _____ minutes
- Phase 4 (Screen): _____ minutes
- Phase 5 (Firestore): _____ minutes
- Phase 6 (Testing): _____ minutes
- Phase 7 (Documentation): _____ minutes
- Phase 8 (Deployment): _____ minutes
- Phase 9 (Cleanup): _____ minutes

**Total Time:** _____ hours

**Estimated:** 4-6 hours
**Actual:** _____ hours
