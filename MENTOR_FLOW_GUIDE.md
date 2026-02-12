# Mentor Flow - Complete Guide

## Overview
The mentor system allows admins to designate certain users as mentors/coaches, who then appear in the mobile app for users to connect with.

## How It Works

### 1. Admin Panel (Web)
**Location:** Admin Panel → Mentors Tab

**What Admins Can Do:**
- View all users in the system
- Toggle mentor status for any user (ON/OFF switch)
- Search for users by name, email, or username
- See which users are currently mentors

**How to Mark Someone as a Mentor:**
1. Open the admin panel at `http://localhost:5173` (or your deployed URL)
2. Click "Mentors" in the sidebar (graduation cap icon)
3. Search for the user you want to make a mentor
4. Toggle the "Mentor" switch to ON
5. The user is now a mentor!

### 2. Mobile App (User Side)
**Location:** Fan Club Screen → "Connect to Mentors" button

**What Users See:**
- List of all active mentors
- Mentor profile info (name, avatar, bio, specialties)
- "Connect" button to view their profile or message them

**User Flow:**
1. User opens the app
2. Goes to Fan Club screen
3. Taps "Connect to Mentors"
4. Sees list of all mentors
5. Taps on a mentor to view their profile
6. Can follow or message the mentor

## Database Structure

### User Document
```javascript
{
  uid: "user123",
  username: "john_doe",
  displayName: "John Doe",
  email: "john@example.com",
  avatar: "https://...",
  bio: "Professional soccer coach",
  specialties: ["Dribbling", "Tactics", "Fitness"],
  isMentor: true,  // ← This field controls mentor status
  verified: true
}
```

## Files Involved

### Mobile App
- `src/screens/main/MentorsScreen.tsx` - Lists all mentors
- `src/screens/main/FanClubScreen.tsx` - Entry point (Connect button)
- `src/navigation/MainNavigator.tsx` - Navigation setup

### Admin Panel
- `admin-panel/src/MentorsManagement.tsx` - Mentor management UI
- `admin-panel/src/App.tsx` - Navigation (Mentors tab added)

## Testing the Flow

### Step 1: Mark a User as Mentor (Admin Panel)
```bash
# Start the admin panel
cd admin-panel
npm run dev
```
1. Login to admin panel
2. Go to Mentors tab
3. Toggle mentor status for a test user

### Step 2: View Mentors (Mobile App)
```bash
# Start the mobile app
npm start
```
1. Open app on device/emulator
2. Navigate to Fan Club
3. Tap "Connect to Mentors"
4. You should see the user you marked as a mentor

## Firestore Query
The mobile app queries Firestore for mentors:
```javascript
db.collection('users')
  .where('isMentor', '==', true)
  .get()
```

## Security Rules
Make sure your Firestore rules allow reading mentor status:
```javascript
match /users/{userId} {
  allow read: if true; // Anyone can read user profiles
  allow write: if request.auth.uid == userId; // Users can update their own profile
}
```

## Customization Ideas

### Add Mentor Categories
Update the user document:
```javascript
{
  isMentor: true,
  mentorCategory: "coach", // or "trainer", "nutritionist", etc.
  mentorLevel: "professional", // or "amateur", "expert"
}
```

### Add Booking System
- Add a "Book Session" button
- Create a `bookings` collection
- Send notifications when booked

### Add Ratings
- Add `mentorRating` field
- Let users rate mentors after sessions
- Display ratings in the mentor list

## Troubleshooting

### Mentors Not Showing Up
1. Check if `isMentor` field is set to `true` in Firestore
2. Verify Firestore security rules allow reading users
3. Check console for errors in MentorsScreen

### Admin Panel Not Loading
1. Make sure Firebase config is correct in `admin-panel/src/firebase.ts`
2. Check if user has admin permissions
3. Verify Firestore rules allow admin access

### Toggle Not Working
1. Check browser console for errors
2. Verify admin has write permissions
3. Check if Firestore rules allow updating `isMentor` field

## Next Steps

1. **Deploy Admin Panel** - Host on Firebase Hosting or Vercel
2. **Add Mentor Profiles** - Create detailed mentor profile pages
3. **Add Messaging** - Integrate chat system for mentor-user communication
4. **Add Analytics** - Track mentor engagement and user connections
5. **Add Notifications** - Notify mentors when users connect with them

## Support
If you need help:
1. Check the console logs for errors
2. Verify Firebase configuration
3. Test with a simple user first
4. Check Firestore security rules
