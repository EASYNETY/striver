# Firebase API Fix - App Crash Resolved

## Problem
The app was crashing on startup with the error:
```
FirebaseError: Expected first argument to collection() to be a CollectionReference, 
a DocumentReference or FirebaseFirestore
ERROR Invariant Violation: "StriverApp" has not been registered
```

## Root Cause
The `src/api/firebase.ts` file was using the **modular API** from React Native Firebase (v9+ style), but the rest of the codebase was using the **compat API** (v8 style with `.collection()` methods).

React Native Firebase requires using the compat API, not the modular API like the web SDK.

## Files Fixed

### 1. `src/api/firebase.ts`
**Before:**
```typescript
import { getFirestore } from '@react-native-firebase/firestore';
export const db = getFirestore(app); // Modular API - WRONG
```

**After:**
```typescript
import firestore from '@react-native-firebase/firestore';
export const db = firestore(); // Compat API - CORRECT
```

### 2. `src/services/notificationsHelper.ts`
- Fixed timestamp to use `firestore.FieldValue.serverTimestamp()`
- Added proper firestore import

### 3. `src/hooks/useAgeVerification.ts`
- Removed modular API imports (`collection`, `addDoc`, `serverTimestamp`)
- Changed to compat API: `db.collection().add()`
- Fixed functions call to use `functions().httpsCallable()`

## Key Changes
1. All Firebase imports now use **default imports** (compat API)
2. Database operations use `.collection()` and `.doc()` methods
3. Timestamps use `firestore.FieldValue.serverTimestamp()`
4. Functions use `functions().httpsCallable('functionName')`

## Testing
Run the app - it should now start without crashing. The AlertsScreen will load notifications from Firestore correctly.

## Next Steps
1. Test the notifications system
2. Integrate notification helpers into existing features (likes, comments, follows)
3. Add Mentors tab to admin panel navigation
