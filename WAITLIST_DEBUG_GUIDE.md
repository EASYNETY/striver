# Squad Waitlist Debugging Guide

## Issue: Waitlist requests not appearing in admin dashboard

### Step 1: Verify Mobile App is Writing Data

1. **Submit a waitlist request** from the mobile app
2. **Check the console logs** for these messages:
   - `[SquadWaitlist] Fetching user profile for: [userId]`
   - `[SquadWaitlist] User data: { username: ..., email: ... }`
   - `[SquadWaitlist] Creating request with data: {...}`
   - `[SquadWaitlist] Request created successfully with ID: [docId]`

3. **If you see errors**, check:
   - Firestore permissions (user should be able to write to `squad_creation_waitlist`)
   - User authentication status
   - Network connectivity

### Step 2: Verify Data in Firestore Console

1. Go to Firebase Console: https://console.firebase.google.com/project/striver-app-48562/firestore
2. Look for the `squad_creation_waitlist` collection
3. Check if documents exist with the expected structure:
   ```
   {
     userId: string
     username: string
     email: string
     requestedAt: timestamp
     status: "pending"
     reason: string
     adminNotes: ""
   }
   ```

### Step 3: Verify Admin Panel is Listening

1. Open admin panel: https://striver-app-48562.web.app
2. Open browser console (F12)
3. Look for any errors related to:
   - Firebase connection
   - Firestore listeners
   - Authentication

4. Check the Network tab for:
   - Firestore websocket connection
   - Any failed requests

### Step 4: Check Firestore Rules

The rules should allow:
- **Users**: Can create documents in `squad_creation_waitlist` where `userId == auth.uid`
- **Admins**: Can read all documents in `squad_creation_waitlist`

Current rules (from firestore.rules):
```
match /squad_creation_waitlist/{requestId} {
  allow read: if isSignedIn() && (resource.data.userId == request.auth.uid || isAdmin());
  allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
  allow update: if isAdmin();
  allow delete: if isAdmin();
}
```

### Step 5: Manual Test via Firebase Console

1. Go to Firestore Console
2. Manually create a document in `squad_creation_waitlist`:
   ```json
   {
     "userId": "test-user-123",
     "username": "Test User",
     "email": "test@example.com",
     "requestedAt": [current timestamp],
     "status": "pending",
     "reason": "Manual test",
     "adminNotes": ""
   }
   ```
3. Check if this document appears in the admin panel
4. If it appears, the issue is with mobile app writing
5. If it doesn't appear, the issue is with admin panel reading

### Common Issues and Solutions

#### Issue 1: Firestore Rules Blocking Writes
**Symptom**: Error in mobile app logs about permission denied
**Solution**: 
- Deploy the updated Firestore rules: `firebase deploy --only firestore:rules`
- Verify rules in Firebase Console

#### Issue 2: Admin Panel Not Authenticated
**Symptom**: Admin panel shows no data or errors about authentication
**Solution**:
- Log out and log back in to admin panel
- Verify admin user has `role: 'admin'` or `role: 'super_admin'` in Firestore

#### Issue 3: Real-time Listener Not Attached
**Symptom**: Manual documents appear after refresh but not in real-time
**Solution**:
- Check browser console for listener errors
- Verify admin panel code has the listener in useEffect
- Check if `squadWaitlist` state is being updated

#### Issue 4: Collection Name Mismatch
**Symptom**: Data written to different collection than admin panel is reading
**Solution**:
- Verify mobile app uses: `'squad_creation_waitlist'`
- Verify admin panel uses: `collection(db, 'squad_creation_waitlist')`
- Check for typos in collection name

### Quick Fix Commands

```bash
# Redeploy Firestore rules
firebase deploy --only firestore:rules

# Redeploy admin panel
cd admin-panel
npm run build
cd ..
firebase deploy --only hosting:admin

# Check Firebase project
firebase projects:list
firebase use striver-app-48562
```

### Debug Checklist

- [ ] Mobile app logs show successful document creation
- [ ] Document exists in Firestore Console
- [ ] Admin panel is authenticated
- [ ] Admin panel console shows no errors
- [ ] Firestore rules allow the operations
- [ ] Collection name is correct in both places
- [ ] Admin user has admin role in Firestore
- [ ] Real-time listener is attached in admin panel

### Next Steps

If all checks pass but issue persists:
1. Share mobile app console logs
2. Share admin panel console logs
3. Share screenshot of Firestore Console showing the collection
4. Verify the exact error message or behavior
