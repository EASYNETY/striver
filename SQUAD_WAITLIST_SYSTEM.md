# Squad Creation Waitlist System

## Overview
This document describes the Squad Creation Waitlist system that has been implemented to manage and control who can create squads in the Striver application.

## Features Implemented

### 1. **Mobile App Integration** (`src/api/squadWaitlistService.ts`)
- **Submit Request**: Users can request squad creation access with a reason
- **Duplicate Prevention**: System checks for existing requests to prevent duplicates
- **Status Tracking**: Users can view their request status (pending/approved/rejected)
- **Permission Check**: Validates if a user has been approved to create squads

### 2. **Create Squad Screen Updates** (`src/screens/squads/CreateSquadScreen.tsx`)
- **Waitlist Check**: Before allowing squad creation, checks if user is approved
- **User Prompts**: 
  - If not approved: Prompts user to join waitlist
  - If pending: Informs user their request is being reviewed
  - If rejected: Directs user to contact support
- **Seamless Flow**: Integrates waitlist check into existing squad creation validation

### 3. **Admin Panel Management** (`admin-panel/src/App.tsx`)
- **New "Waitlist" Tab**: Dedicated section for managing squad creation requests
- **Real-time Sync**: Live updates of waitlist requests from Firestore
- **Full CRUD Operations**:
  - **Read**: View all requests with user details, status, and reason
  - **Approve**: Grant squad creation access to users
  - **Reject**: Deny requests with admin notes
  - **Delete**: Remove requests from the system
- **User Notifications**: Automatically notifies users when their request is processed
- **Admin Logging**: All actions are logged for audit trail
- **Status Badges**: Visual indicators for pending/approved/rejected requests
- **Statistics**: Shows count of pending and approved requests

### 4. **Firestore Security Rules** (`firestore.rules`)
- **User Access**: Users can only read their own requests and create new ones
- **Admin Access**: Only admins can update or delete requests
- **Data Integrity**: Prevents unauthorized modifications

## Database Schema

### Collection: `squad_creation_waitlist`

```typescript
{
  id: string;                    // Auto-generated document ID
  userId: string;                // User's Firebase UID
  username: string;              // User's display name
  email: string;                 // User's email
  requestedAt: Timestamp;        // When request was submitted
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;               // User's reason for requesting access
  adminNotes?: string;           // Admin's notes when processing
  processedAt?: Timestamp;       // When admin processed the request
  processedBy?: string;          // Admin UID who processed it
}
```

## User Flow

### For Regular Users:
1. User attempts to create a squad
2. System checks if user has squad creation approval
3. If not approved:
   - User is prompted to join waitlist
   - User provides reason for wanting to create squad
   - Request is submitted to admin queue
4. User receives notification when request is processed
5. If approved, user can create squads normally

### For Admins:
1. Navigate to "Waitlist" tab in admin panel
2. View all pending requests with user details
3. Review user's reason for requesting access
4. Take action:
   - **Approve**: User gains squad creation access
   - **Reject**: User is notified with reason
   - **Delete**: Remove request entirely
5. Add admin notes explaining decision
6. User is automatically notified of decision

## Key Benefits

1. **Quality Control**: Ensures only approved users can create squads
2. **Spam Prevention**: Prevents mass creation of low-quality squads
3. **User Tracking**: Complete audit trail of who requested and who approved
4. **No Duplicates**: Users can only have one active request
5. **Transparent Process**: Users know their request status at all times
6. **Admin Efficiency**: Centralized management interface with all necessary info

## Deployment Instructions

### 1. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 2. Deploy Admin Panel (if updated)
```bash
cd admin-panel
npm run build
firebase deploy --only hosting
```

### 3. Test the Feature
1. **Mobile App**:
   - Try creating a squad without approval
   - Submit a waitlist request
   - Check request status

2. **Admin Panel**:
   - Log in as admin
   - Navigate to Waitlist tab
   - Approve/reject a request
   - Verify user receives notification

## Future Enhancements

1. **Bulk Actions**: Approve/reject multiple requests at once
2. **Auto-Approval**: Automatically approve users meeting certain criteria
3. **Request Expiry**: Auto-reject requests older than X days
4. **Analytics**: Track approval rates and request trends
5. **Email Notifications**: Send email when request is processed
6. **Request History**: Show users their past requests

## Troubleshooting

### User can't submit request
- Check Firestore security rules are deployed
- Verify user is authenticated
- Check for existing requests in database

### Admin can't see requests
- Verify admin role in user document
- Check Firestore rules for admin permissions
- Ensure real-time listener is active

### Notifications not sending
- Check user's notifications subcollection permissions
- Verify notification document structure
- Check admin_logs for error messages

## Code Locations

- **Service**: `src/api/squadWaitlistService.ts`
- **Mobile UI**: `src/screens/squads/CreateSquadScreen.tsx`
- **Admin Panel**: `admin-panel/src/App.tsx` (lines 119, 212-220, 414-467, 461, 593, 813-883)
- **Security Rules**: `firestore.rules` (lines 208-218)

## Notes

- The waitlist system is independent of career tier requirements
- Users still need to meet other squad creation requirements (tier, age, etc.)
- Approved status persists - users don't need to request again
- Admins can revoke access by changing status back to 'rejected'
