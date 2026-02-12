# Deployment Checklist - Mentor System

## Pre-Deployment Checks

### 1. Firebase CLI Setup
- [ ] Firebase CLI installed: `npm install -g firebase-tools`
- [ ] Logged in: `firebase login`
- [ ] Correct project: `firebase use striver-app-48562`

### 2. Admin Panel Build Test
```bash
cd admin-panel
npm install
npm run build
```
- [ ] Build completes without errors
- [ ] `admin-panel/dist` folder created
- [ ] No TypeScript errors

### 3. Mobile App Build Test
```bash
npm install
npm run android  # or npm run ios
```
- [ ] App builds successfully
- [ ] No Firebase API errors in console
- [ ] App doesn't crash on startup

### 4. Firebase Configuration
- [ ] `.firebaserc` has correct project ID
- [ ] `firebase.json` has admin hosting target
- [ ] Firestore rules allow reading users collection
- [ ] Admin users have proper permissions

## Deployment Steps

### Step 1: Deploy Admin Panel
```bash
./deploy-admin-panel.bat
```
**Expected Result:**
- Build completes successfully
- Deployment to Firebase Hosting succeeds
- URL: https://striver-app-48562.web.app

**Verify:**
- [ ] Admin panel loads at the URL
- [ ] Can login with admin credentials
- [ ] Mentors tab is visible in sidebar
- [ ] Can see list of users
- [ ] Toggle switches work

### Step 2: Test Admin Panel
1. **Login**
   - [ ] Login page loads
   - [ ] Can authenticate with Firebase
   - [ ] Redirects to dashboard after login

2. **Navigate to Mentors**
   - [ ] Click "Mentors" in sidebar
   - [ ] User list loads
   - [ ] Search functionality works
   - [ ] Can see user details

3. **Toggle Mentor Status**
   - [ ] Click toggle switch for a user
   - [ ] Switch changes state
   - [ ] No errors in console
   - [ ] Check Firestore: `isMentor` field updated

### Step 3: Rebuild Mobile App
```bash
# For Android
npm run android

# For iOS
npm run ios
```

**Verify Build:**
- [ ] No compilation errors
- [ ] App installs on device/emulator
- [ ] App launches without crashing
- [ ] No Firebase errors in logs

### Step 4: Test Mobile App
1. **App Startup**
   - [ ] App doesn't crash on launch
   - [ ] No Firebase API errors
   - [ ] Can navigate to main screens

2. **Navigate to Mentors**
   - [ ] Open Fan Club screen
   - [ ] "Connect to Mentors" button visible
   - [ ] Tap button to open MentorsScreen

3. **View Mentors**
   - [ ] Mentors list loads
   - [ ] Shows users marked as mentors in admin panel
   - [ ] Can see mentor details (name, avatar, bio)
   - [ ] "Connect" button works

4. **Connect with Mentor**
   - [ ] Tap "Connect" on a mentor
   - [ ] Navigates to mentor's profile
   - [ ] Can view full profile
   - [ ] Can follow/message mentor

## Post-Deployment Verification

### Admin Panel
- [ ] Accessible at production URL
- [ ] All tabs work correctly
- [ ] Mentor management functional
- [ ] No console errors
- [ ] Performance is acceptable

### Mobile App
- [ ] App stable (no crashes)
- [ ] Firebase connection working
- [ ] Mentors list populates correctly
- [ ] Navigation works smoothly
- [ ] Notifications system working

### Database
- [ ] Check Firestore console
- [ ] Verify `isMentor` field updates
- [ ] Check user documents structure
- [ ] Verify security rules are correct

## Rollback Plan

If deployment fails:

### Admin Panel Rollback
```bash
# Redeploy previous version
firebase hosting:clone striver-app-48562:admin PREVIOUS_VERSION
```

### Mobile App Rollback
```bash
# Revert code changes
git revert HEAD
git push

# Rebuild app
npm run android  # or npm run ios
```

## Common Issues & Solutions

### Issue: Admin Panel Build Fails
**Solution:**
```bash
cd admin-panel
rm -rf node_modules dist
npm install
npm run build
```

### Issue: Firebase Deployment Fails
**Solution:**
```bash
# Check login status
firebase login --reauth

# Check project
firebase use striver-app-48562

# Try again
firebase deploy --only hosting:admin
```

### Issue: Mobile App Crashes
**Solution:**
1. Check console logs for Firebase errors
2. Verify `src/api/firebase.ts` is using compat API
3. Clear Metro cache: `npm start -- --reset-cache`
4. Rebuild: `npm run android` (or ios)

### Issue: Mentors Not Showing
**Solution:**
1. Check Firestore: User has `isMentor: true`
2. Check security rules: Allow reading users
3. Check console: Look for query errors
4. Verify Firebase connection in app

## Success Criteria

✅ **Admin Panel:**
- Deployed to Firebase Hosting
- Accessible at production URL
- Mentor management works
- No errors in console

✅ **Mobile App:**
- Builds without errors
- No crashes on startup
- Mentors screen loads
- Can view and connect with mentors

✅ **Integration:**
- Admin panel changes reflect in mobile app
- Marking user as mentor shows them in app
- Real-time updates work
- No data sync issues

## Support Contacts

- Firebase Console: https://console.firebase.google.com/project/striver-app-48562
- Admin Panel: https://striver-app-48562.web.app
- Documentation: See MENTOR_FLOW_GUIDE.md

## Notes

- Admin panel deployment takes ~2-3 minutes
- Mobile app rebuild takes ~5-10 minutes
- Changes are immediate after deployment
- No database migrations needed
- Backward compatible with existing data
