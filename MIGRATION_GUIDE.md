# User Migration Guide

## Prerequisites

Before running the migration script, you need:

1. **Firebase Admin SDK Service Account Key**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `serviceAccountKey.json` in the project root
   - **IMPORTANT**: Add this file to `.gitignore` - never commit it!

2. **Install Dependencies**
   ```bash
   npm install firebase-admin csv-parser
   ```

3. **CSV File**
   - Ensure `users_rows.csv` is in the project root directory

## Running the Migration

### Step 1: Dry Run (Recommended)
First, test with a small subset of users to ensure everything works:

1. Create a backup of your CSV:
   ```bash
   cp users_rows.csv users_rows_backup.csv
   ```

2. Create a test CSV with just 5-10 users:
   ```bash
   head -n 11 users_rows.csv > users_test.csv
   ```

3. Modify the script to use `users_test.csv` instead

4. Run the migration:
   ```bash
   node migrate-users.js
   ```

### Step 2: Full Migration
Once you've verified the test run works:

1. Restore the full CSV (or modify script back to `users_rows.csv`)
2. Run the full migration:
   ```bash
   node migrate-users.js
   ```

## What the Script Does

1. ✅ Reads all users from the CSV file
2. ✅ Maps old user fields to new schema
3. ✅ Creates Firebase Authentication accounts (if they don't exist)
4. ✅ Creates Firestore user documents
5. ✅ Handles errors gracefully
6. ✅ Provides progress updates
7. ✅ Generates error report if needed

## Field Mapping

| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `id` | `uid` | User ID preserved |
| `username` | `username` | Username preserved |
| `email` | `email` | Email preserved |
| `bio` | `bio` | Bio preserved |
| `avatar_url` | `avatar` | Avatar URL |
| `date_of_birth` | `dob` | Date of birth |
| `age_verification_status` | `ageVerificationStatus` | Mapped to new status |
| `followers_count` | `followers` | Follower count |
| `following_count` | `following` | Following count |
| `created_at` | `createdAt` | Timestamp converted |
| `updated_at` | `updatedAt` | Timestamp converted |

## New Fields (Set to Defaults)

- `accountType`: 'individual'
- `ageTier`: Calculated from age
- `career_earnings`: 0
- `career_tier_id`: 'future_star'
- `badge_status`: 'bronze'
- `coins`: 0
- `replies`: 0
- `onboardingComplete`: Based on profile completion %

## Post-Migration Steps

After successful migration:

1. **Verify Data**
   - Check Firebase Console → Firestore
   - Verify a few random users have correct data

2. **Test Authentication**
   - Users will need to reset their passwords (send password reset emails)
   - Or implement a "first login" flow

3. **Clean Up**
   - Delete `serviceAccountKey.json` (or keep it secure)
   - Archive the CSV file
   - Review `migration-errors.json` if any errors occurred

## Troubleshooting

### "User already exists" errors
- This is normal if you run the script multiple times
- The script skips existing users automatically

### "No email" errors
- Some users in the old app don't have emails
- These users are skipped (can't create auth accounts without email)

### Rate limiting errors
- The script pauses every 50 users
- If you still hit limits, increase the pause duration

### Permission errors
- Ensure your service account has the correct permissions
- Check Firebase Console → IAM & Admin

## Important Notes

⚠️ **SECURITY**: Never commit `serviceAccountKey.json` to version control!

⚠️ **PASSWORDS**: Migrated users won't have passwords. You'll need to:
- Send password reset emails to all users
- Or implement a "set password on first login" flow

⚠️ **TESTING**: Always test with a small subset first!

⚠️ **BACKUP**: Make sure you have backups of your Firebase project before running!

## Support

If you encounter issues:
1. Check the console output for specific errors
2. Review `migration-errors.json` for failed users
3. Check Firebase Console for quota/permission issues
