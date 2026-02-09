# Implementation Plan: Critical Bug Fixes

## Overview

This plan addresses seven critical bugs through targeted fixes in React Native components, Firestore rules, and service logic. Each bug is fixed independently to enable isolated testing and minimize risk.

## Tasks

- [x] 1. Fix bottom tab bar overlap issue
  - [x] 1.1 Add safe area insets to screens with bottom content
    - Import and use `useSafeAreaInsets` from react-native-safe-area-context
    - Apply bottom padding to ScrollView/FlatList components: `paddingBottom: insets.bottom + TAB_BAR_HEIGHT`
    - Test on screens: HomeFeedScreen, ProfileScreen, SquadsScreen, RewardsScreen
    - _Requirements: 1.1, 1.2_
  
  - [x] 1.2 Verify tab bar visibility on all main screens
    - Check that all tab buttons are fully visible and tappable
    - Test scrolling to bottom of content on each screen
    - _Requirements: 1.4_

- [x] 2. Fix points display not updating
  - [x] 2.1 Add Firestore real-time listener for points
    - In ProfileScreen and RewardsScreen, add `onSnapshot` listener to user document
    - Update local state when points field changes
    - Clean up listener on component unmount
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 2.2 Test points update after earning actions
    - Trigger point-earning action (complete challenge, daily check-in)
    - Verify points display updates within 2 seconds
    - Test with multiple rapid point additions
    - _Requirements: 2.4_

- [x] 3. Fix videos not showing in feed
  - [x] 3.1 Debug and fix video feed query
    - Add error logging to video fetch in HomeFeedScreen
    - Check Firestore query filters and ordering
    - Verify query returns data: log `videos.length` and first video
    - Fix any query issues (missing indexes, incorrect filters)
    - _Requirements: 3.1, 3.2_
  
  - [x] 3.2 Fix video rendering logic
    - Ensure video data is passed correctly to video components
    - Check conditional rendering logic (empty states, loading states)
    - Verify video thumbnails and metadata display correctly
    - _Requirements: 3.3_
  
  - [x] 3.3 Add empty state and error handling
    - Display "No videos yet" message when feed is empty
    - Show error message with retry button on fetch failure
    - _Requirements: 3.4, 3.5_

- [x] 4. Fix video upload Firestore permission errors
  - [x] 4.1 Update Firestore rules for video uploads
    - Add rule: `allow create: if request.auth != null && request.resource.data.userId == request.auth.uid`
    - Add rule: `allow read: if request.auth != null`
    - Add rule: `allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid`
    - Deploy rules: run `firebase deploy --only firestore:rules`
    - _Requirements: 4.1, 4.2_
  
  - [x] 4.2 Improve upload error handling
    - Catch Firestore permission errors in UploadScreen
    - Display specific error message: "Upload failed: [error.code]"
    - Log full error for debugging
    - _Requirements: 4.3, 4.4_
  
  - [x] 4.3 Test video upload end-to-end
    - Record and upload a test video
    - Verify video document created in Firestore
    - Check video appears in feed after upload
    - _Requirements: 4.3_

- [x] 5. Fix squad join failures
  - [x] 5.1 Update Firestore rules for squad operations
    - Add squad update rule: `allow update: if request.auth != null && (request.resource.data.members.hasAll(resource.data.members) || resource.data.adminId == request.auth.uid)`
    - Add user squad rule: `allow write: if request.auth != null && request.auth.uid == userId`
    - Deploy rules: run `firebase deploy --only firestore:rules`
    - _Requirements: 5.2_
  
  - [x] 5.2 Fix squad join logic to update both documents
    - Update squad document: add user to `members` array
    - Update user document: add squad to user's `squads` array
    - Use batch write or transaction for atomicity
    - _Requirements: 5.1, 5.3_
  
  - [x] 5.3 Add duplicate join prevention
    - Check if user already in squad before joining
    - Return early or show "Already a member" message
    - _Requirements: 5.5_
  
  - [x] 5.4 Improve error handling for squad joins
    - Catch specific errors (permission denied, squad not found)
    - Display descriptive error messages
    - _Requirements: 5.4_
  
  - [x] 5.5 Test squad join flow
    - Join a squad and verify membership in both documents
    - Try joining same squad twice (should prevent duplicate)
    - Test with different error scenarios
    - _Requirements: 5.1, 5.3, 5.5_

- [x] 6. Fix daily perks not working
  - [x] 6.1 Fix perk button event handlers
    - Ensure onPress handlers are properly bound
    - Add loading state during claim operation
    - Disable button while loading
    - _Requirements: 6.1_
  
  - [x] 6.2 Implement perk claim logic
    - Update user document: set `dailyPerks.{perkId}.claimed = true`
    - Set `dailyPerks.{perkId}.claimedAt` to server timestamp
    - Update local state to reflect claimed status
    - _Requirements: 6.2, 6.3_
  
  - [x] 6.3 Add claimed state UI
    - Show claimed perks as disabled or with "Claimed" badge
    - Update button styling for claimed state
    - _Requirements: 6.4_
  
  - [x] 6.4 Add error handling for perk claims
    - Catch claim failures and show error alert
    - Provide retry option
    - _Requirements: 6.5_
  
  - [x] 6.5 Test daily perks flow
    - Claim a perk and verify Firestore update
    - Verify UI shows claimed state
    - Test error handling with network disabled
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 7. Fix respond to video functionality
  - [x] 7.1 Fix video loading in response interface
    - Load original video data when response interface opens
    - Display original video in response modal/screen
    - Add error handling if video not found
    - _Requirements: 7.1, 7.4_
  
  - [x] 7.2 Ensure response recording interface works
    - Verify camera/recording UI is accessible
    - Test video recording and preview
    - _Requirements: 7.2_
  
  - [x] 7.3 Implement response video creation
    - Create response video document with `responseToVideoId` field
    - Increment original video's `responseCount` field
    - Use transaction or batch write for atomicity
    - _Requirements: 7.3, 7.5_
  
  - [x] 7.4 Test video response flow end-to-end
    - Open response interface from a video
    - Record and submit a response video
    - Verify response video created with correct parent ID
    - Verify original video's response count incremented
    - _Requirements: 7.1, 7.3, 7.5_

- [x] 8. Final verification and regression testing
  - [x] 8.1 Test each bug fix individually
    - Go through reproduction steps for each original bug
    - Verify bug no longer occurs
    - Document test results
    - _Requirements: 8.1_
  
  - [x] 8.2 Run regression tests on related features
    - Test navigation between all screens
    - Test video playback and interactions
    - Test user profile and points display
    - Test squad browsing and management
    - _Requirements: 8.2, 8.4_
  
  - [x] 8.3 Test on both iOS and Android
    - Run all bug fix tests on iOS device/simulator
    - Run all bug fix tests on Android device/emulator
    - Note any platform-specific issues
    - _Requirements: 8.4_
  
  - [x] 8.4 Document verification results
    - Create summary of all fixes and test results
    - Note any remaining issues or follow-up work
    - Update bug tracking system
    - _Requirements: 8.5_

## Notes

- Each bug fix is independent and can be tested in isolation
- Firestore rules changes require deployment before testing
- Test with real devices for accurate UI layout verification
- Use Firebase emulator for testing Firestore rules before deploying
- All fixes should maintain existing functionality in unaffected areas
