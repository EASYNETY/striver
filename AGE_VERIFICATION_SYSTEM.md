# Age Verification System

## Overview
Striver implements a **manual review age verification system** to ensure users under 18 cannot bypass age restrictions. This system replaces the previous auto-approval simulation with a secure, admin-moderated process.

## How It Works

### 1. User Flow
1. **Age Check**: When a user enters their date of birth, the system calculates their age
2. **Restriction Enforcement**: 
   - Users **under 18** are **blocked** from starting verification
   - Only users **18+** can submit verification photos
3. **Photo Submission**: Eligible users take a selfie using the front camera
4. **Upload & Queue**: The photo is uploaded to Firebase Storage and added to the moderation queue
5. **Pending Status**: User account is marked as `verificationStatus: 'pending'`
6. **Notification**: User is informed verification takes 24-48 hours

### 2. Admin Review Process
Admins can review verification requests through the Firebase Console or a custom admin dashboard:

#### Firestore Collection: `verificationRequests`
```javascript
{
  userId: "user123",
  photoUrl: "https://storage.googleapis.com/...",
  userAge: 19,
  accountType: "individual",
  status: "pending", // pending | approved | rejected
  createdAt: Timestamp,
  reviewedAt: Timestamp | null,
  reviewedBy: "admin_uid" | null
}
```

#### Review Actions
1. **Approve**: 
   - Update request status to `approved`
   - Update user profile: `verificationStatus: 'verified'`
   - Send push notification to user
   
2. **Reject**:
   - Update request status to `rejected`
   - Update user profile: `verificationStatus: 'rejected'`
   - Send notification with reason

### 3. Security Features
- ✅ **Age-Based Blocking**: Users under 18 cannot submit photos
- ✅ **Manual Review**: No AI auto-approval that could be fooled
- ✅ **Audit Trail**: All verification attempts are logged with timestamps
- ✅ **Photo Storage**: Verification photos stored separately from avatars
- ✅ **Status Tracking**: User profiles track verification state

## Firebase Storage Structure
```
verification_photos/
  ├── user123_1234567890.jpg
  ├── user456_1234567891.jpg
  └── ...
```

## User Profile Fields
```typescript
{
  verificationStatus?: 'pending' | 'verified' | 'rejected',
  verificationPhotoUrl?: string,
  // ... other fields
}
```

## Building an Admin Dashboard
To create an admin review interface:

1. **Query Pending Requests**:
```javascript
const pendingRequests = await db
  .collection('verificationRequests')
  .where('status', '==', 'pending')
  .orderBy('createdAt', 'asc')
  .get();
```

2. **Approve Request**:
```javascript
// Update verification request
await db.collection('verificationRequests').doc(requestId).update({
  status: 'approved',
  reviewedAt: new Date(),
  reviewedBy: adminUid
});

// Update user profile
await db.collection('users').doc(userId).update({
  verificationStatus: 'verified'
});
```

3. **Reject Request**:
```javascript
await db.collection('verificationRequests').doc(requestId).update({
  status: 'rejected',
  reviewedAt: new Date(),
  reviewedBy: adminUid,
  rejectionReason: 'Photo unclear / Age mismatch / etc.'
});

await db.collection('users').doc(userId).update({
  verificationStatus: 'rejected'
});
```

## Future Enhancements
- [ ] AI-assisted pre-screening (flag suspicious submissions)
- [ ] Integration with third-party age verification APIs (Yoti, Jumio)
- [ ] Automated notifications via Firebase Cloud Messaging
- [ ] Admin dashboard web app for streamlined review
- [ ] Re-verification requests for rejected users

## Compliance Notes
- This system helps comply with COPPA (Children's Online Privacy Protection Act)
- Verification photos should be handled according to GDPR/privacy laws
- Consider data retention policies for verification photos
- Ensure proper consent is obtained before photo capture

## Testing
To test the verification flow:
1. Create a test user with DOB showing age 18+
2. Navigate to Age Verification screen
3. Take a selfie
4. Check Firestore for the verification request
5. Manually approve/reject via Firebase Console
6. Verify user profile updates correctly
