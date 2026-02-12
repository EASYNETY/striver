/**
 * User Migration Script
 * 
 * This script migrates users from the old app (CSV export) to the new Firebase setup.
 * 
 * IMPORTANT: Run this script ONCE in a controlled environment.
 * 
 * Usage:
 *   node migrate-users.js
 * 
 * Prerequisites:
 *   - Firebase Admin SDK credentials (service account JSON)
 *   - users_rows.csv file in the same directory
 */

const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');

// Initialize Firebase Admin using Application Default Credentials
// This allows running the script using your 'gcloud auth login' session
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'striver-app-48562' // Explicitly set the project ID
});

const db = admin.firestore();
const auth = admin.auth();

// CSV to Firestore field mapping
function mapOldUserToNewUser(oldUser) {
  // Parse profile_status JSON if it exists
  let profileStatus = {};
  try {
    if (oldUser.profile_status) {
      profileStatus = JSON.parse(oldUser.profile_status.replace(/\"\"/g, '"'));
    }
  } catch (e) {
    console.warn(`Failed to parse profile_status for user ${oldUser.id}:`, e.message);
  }

  // Determine age tier based on date_of_birth
  let ageTier = 'academy_prospect'; // default
  if (oldUser.date_of_birth) {
    const age = calculateAge(oldUser.date_of_birth);
    if (age < 13) {
      ageTier = 'junior_baller';
    } else if (age >= 13 && age < 18) {
      ageTier = 'academy_prospect';
    } else {
      ageTier = 'first_teamer';
    }
  }

  // Map age verification status
  let ageVerificationStatus = 'unverified';
  if (oldUser.age_verification_status === 'verified') {
    ageVerificationStatus = 'verified';
  } else if (oldUser.age_verification_status === 'verifying' || oldUser.age_verification_status === 'pending_parent') {
    ageVerificationStatus = 'unverified'; // Treat as unverified, they'll need to re-verify
  }

  return {
    // Core fields
    uid: oldUser.id,
    username: oldUser.username || `user_${oldUser.id.substring(0, 8)}`,
    email: oldUser.email || '',
    displayName: oldUser.username || '',
    bio: oldUser.bio || '',
    avatar: oldUser.avatar_url || '',
    dob: oldUser.date_of_birth || '',

    // Account type
    accountType: 'individual', // All migrated users start as individual
    ageTier: ageTier,

    // Striver specifics
    career_earnings: 0,
    career_tier_id: 'future_star',
    badge_status: 'bronze',
    coins: 0,
    followers: parseInt(oldUser.followers_count) || 0,
    following: parseInt(oldUser.following_count) || 0,
    replies: 0,

    // Verification
    ageVerificationStatus: ageVerificationStatus,
    ageVerificationDate: oldUser.age_verification_status === 'verified'
      ? admin.firestore.Timestamp.fromDate(new Date(profileStatus.age_verification?.verified_at || oldUser.updated_at))
      : null,
    profileStatus: {
      ageVerification: oldUser.age_verification_status,
      verificationMethod: profileStatus.age_verification?.method || null,
      verificationCompletedAt: profileStatus.age_verification?.verified_at
        ? admin.firestore.Timestamp.fromDate(new Date(profileStatus.age_verification.verified_at))
        : null,
    },
    profileCompletion: parseInt(profileStatus.completion_percentage) || 0,

    // Onboarding
    onboardingComplete: profileStatus.completion_percentage === 100,

    // Timestamps
    createdAt: admin.firestore.Timestamp.fromDate(new Date(oldUser.created_at)),
    updatedAt: admin.firestore.Timestamp.fromDate(new Date(oldUser.updated_at)),

    // Migration metadata
    migratedFrom: 'old_app',
    migrationDate: admin.firestore.Timestamp.now(),
  };
}

function calculateAge(dobString) {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

async function migrateUsers() {
  const users = [];

  console.log('📖 Reading CSV file...');

  // Read CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream('users_test.csv') // Using the test file
      .pipe(csv())
      .on('data', (row) => {
        users.push(row);
      })
      .on('end', () => {
        console.log(`✅ Read ${users.length} users from CSV`);
        resolve();
      })
      .on('error', reject);
  });

  console.log('\n🚀 Starting migration...\n');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < users.length; i++) {
    const oldUser = users[i];
    const progress = `[${i + 1}/${users.length}]`;

    try {
      // Skip users without email (can't create auth account)
      if (!oldUser.email || oldUser.email.trim() === '') {
        console.log(`${progress} ⏭️  Skipping user ${oldUser.id} (no email)`);
        skipCount++;
        continue;
      }

      // Map user data
      const newUserData = mapOldUserToNewUser(oldUser);

      // Check if user already exists in Firestore
      const userDocRef = db.collection('users').doc(oldUser.id);
      const userDoc = await userDocRef.get();

      if (userDoc.exists) {
        console.log(`${progress} ⏭️  User ${oldUser.username} already exists, skipping`);
        skipCount++;
        continue;
      }

      // Try to get or create Firebase Auth user
      let authUser;
      try {
        authUser = await auth.getUser(oldUser.id);
        console.log(`${progress} 🔑 Auth user ${oldUser.username} already exists`);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // Create auth user
          authUser = await auth.createUser({
            uid: oldUser.id,
            email: oldUser.email,
            displayName: oldUser.username,
            photoURL: oldUser.avatar_url || null,
            emailVerified: oldUser.age_verification_status === 'verified',
          });
          console.log(`${progress} ✨ Created auth user for ${oldUser.username}`);
        } else {
          throw error;
        }
      }

      // Create Firestore document
      await userDocRef.set(newUserData);
      console.log(`${progress} ✅ Migrated ${oldUser.username} (${oldUser.email})`);

      successCount++;

      // Rate limiting - pause every 50 users to avoid overwhelming Firebase
      if ((i + 1) % 50 === 0) {
        console.log(`\n⏸️  Pausing for 2 seconds...\n`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.error(`${progress} ❌ Error migrating user ${oldUser.id}:`, error.message);
      errors.push({ user: oldUser.id, email: oldUser.email, error: error.message });
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully migrated: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total processed: ${users.length}`);
  console.log('='.repeat(60));

  if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    errors.forEach(err => {
      console.log(`  - ${err.user} (${err.email}): ${err.error}`);
    });

    // Save errors to file
    fs.writeFileSync('migration-errors.json', JSON.stringify(errors, null, 2));
    console.log('\n💾 Errors saved to migration-errors.json');
  }

  console.log('\n✨ Migration complete!\n');
}

// Run migration
migrateUsers()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
