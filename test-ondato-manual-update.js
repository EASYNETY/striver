/**
 * Manual Ondato Verification Status Update Script
 * 
 * Use this script to manually update verification status in Firestore
 * Run in Firebase Console or Node.js with Firebase Admin SDK
 */

// ============================================
// OPTION 1: Run in Firebase Console
// ============================================
// 1. Go to Firebase Console
// 2. Open Firestore Database
// 3. Click "Start Collection" if needed
// 4. Use the queries below

// Find pending verifications
db.collection('verification_attempts')
  .where('status', '==', 'pending')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get()
  .then(snapshot => {
    console.log(`Found ${snapshot.size} pending verifications:`);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log({
        id: doc.id,
        userId: data.userId,
        externalRef: data.externalReferenceId,
        createdAt: data.createdAt.toDate(),
        url: data.verificationUrl
      });
    });
  });

// ============================================
// OPTION 2: Update specific verification
// ============================================

/**
 * Update verification to COMPLETED
 * Replace 'EXTERNAL_REF_HERE' with actual external reference ID
 */
async function approveVerification(externalRef) {
  const snapshot = await db.collection('verification_attempts')
    .where('externalReferenceId', '==', externalRef)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.error('Verification not found:', externalRef);
    return;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();
  const userId = data.userId;

  // Update verification attempt
  await doc.ref.update({
    status: 'completed',
    completedAt: new Date(),
    lastCheckedAt: new Date()
  });

  // Update user profile
  await db.collection('users').doc(userId).update({
    ageVerificationStatus: 'verified',
    ageVerificationMethod: 'ondato',
    ageVerificationDate: new Date()
  });

  console.log('✅ Verification approved successfully!');
  console.log('User ID:', userId);
  console.log('External Ref:', externalRef);
}

/**
 * Update verification to FAILED
 * Replace 'EXTERNAL_REF_HERE' with actual external reference ID
 */
async function rejectVerification(externalRef, reason = 'Verification failed') {
  const snapshot = await db.collection('verification_attempts')
    .where('externalReferenceId', '==', externalRef)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.error('Verification not found:', externalRef);
    return;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();
  const userId = data.userId;

  // Update verification attempt
  await doc.ref.update({
    status: 'failed',
    completedAt: new Date(),
    lastCheckedAt: new Date(),
    rejectionReason: reason
  });

  // Update user profile
  await db.collection('users').doc(userId).update({
    ageVerificationStatus: 'rejected',
    ageVerificationMethod: 'ondato',
    ageVerificationDate: new Date()
  });

  console.log('❌ Verification rejected');
  console.log('User ID:', userId);
  console.log('External Ref:', externalRef);
  console.log('Reason:', reason);
}

// ============================================
// USAGE EXAMPLES
// ============================================

// Example 1: Approve verification
// approveVerification('ondato_user123_1234567890');

// Example 2: Reject verification
// rejectVerification('ondato_user123_1234567890', 'Age requirement not met');

// Example 3: Find and approve latest pending verification
async function approveLatestPending() {
  const snapshot = await db.collection('verification_attempts')
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.log('No pending verifications found');
    return;
  }

  const doc = snapshot.docs[0];
  const externalRef = doc.data().externalReferenceId;
  
  console.log('Approving latest pending verification:', externalRef);
  await approveVerification(externalRef);
}

// ============================================
// QUICK COMMANDS (Copy-paste ready)
// ============================================

/*

// List all pending verifications
db.collection('verification_attempts').where('status', '==', 'pending').get().then(s => s.forEach(d => console.log(d.id, d.data().externalReferenceId)))

// Approve by external ref
db.collection('verification_attempts').where('externalReferenceId', '==', 'PASTE_REF_HERE').get().then(s => s.docs[0].ref.update({status: 'completed', completedAt: new Date()}))

// Reject by external ref
db.collection('verification_attempts').where('externalReferenceId', '==', 'PASTE_REF_HERE').get().then(s => s.docs[0].ref.update({status: 'failed', completedAt: new Date()}))

// Get user ID from external ref
db.collection('verification_attempts').where('externalReferenceId', '==', 'PASTE_REF_HERE').get().then(s => console.log('User ID:', s.docs[0].data().userId))

*/

// ============================================
// EXPORT FOR NODE.JS
// ============================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    approveVerification,
    rejectVerification,
    approveLatestPending
  };
}
