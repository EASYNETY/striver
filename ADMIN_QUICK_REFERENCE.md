# Admin Quick Reference - Ondato Verification

## 🚨 Quick Actions

### Check Pending Verifications
```javascript
// Firebase Console → Firestore
db.collection('verification_attempts')
  .where('status', '==', 'pending')
  .orderBy('createdAt', 'desc')
  .get()
```

### Approve Verification (Copy-Paste)
```javascript
// Replace EXTERNAL_REF with actual value
db.collection('verification_attempts')
  .where('externalReferenceId', '==', 'EXTERNAL_REF')
  .get()
  .then(s => s.docs[0].ref.update({
    status: 'completed',
    completedAt: new Date()
  }))
```

### Reject Verification (Copy-Paste)
```javascript
// Replace EXTERNAL_REF with actual value
db.collection('verification_attempts')
  .where('externalReferenceId', '==', 'EXTERNAL_REF')
  .get()
  .then(s => s.docs[0].ref.update({
    status: 'failed',
    completedAt: new Date(),
    rejectionReason: 'Age requirement not met'
  }))
```

## 📋 Daily Workflow

### Step 1: Check for Pending Verifications
1. Open Firebase Console
2. Go to Firestore Database
3. Open `verification_attempts` collection
4. Filter by `status == 'pending'`

### Step 2: Check Ondato Dashboard
1. Go to https://dashboard.ondato.com
2. Login with admin credentials
3. Check recent verifications
4. Note the external reference ID

### Step 3: Update Firestore
1. Find verification in Firestore by external reference
2. Update `status` field:
   - `completed` for approved
   - `failed` for rejected
3. Add `completedAt` timestamp
4. Optional: Add `rejectionReason` if rejected

### Step 4: Verify in App
- User should see result within 5 seconds
- Check user profile updated correctly

## 🔍 Finding Verifications

### By External Reference
```javascript
db.collection('verification_attempts')
  .where('externalReferenceId', '==', 'ondato_user123_1234567890')
  .get()
```

### By User ID
```javascript
db.collection('verification_attempts')
  .where('userId', '==', 'user123')
  .orderBy('createdAt', 'desc')
  .get()
```

### Latest Pending
```javascript
db.collection('verification_attempts')
  .where('status', '==', 'pending')
  .orderBy('createdAt', 'desc')
  .limit(1)
  .get()
```

### By Date Range
```javascript
const startDate = new Date('2026-02-01');
const endDate = new Date('2026-02-28');

db.collection('verification_attempts')
  .where('createdAt', '>=', startDate)
  .where('createdAt', '<=', endDate)
  .orderBy('createdAt', 'desc')
  .get()
```

## 📊 Common Queries

### Count Pending Verifications
```javascript
db.collection('verification_attempts')
  .where('status', '==', 'pending')
  .get()
  .then(s => console.log('Pending:', s.size))
```

### Count Completed Today
```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);

db.collection('verification_attempts')
  .where('status', '==', 'completed')
  .where('completedAt', '>=', today)
  .get()
  .then(s => console.log('Completed today:', s.size))
```

### List All Verifications for User
```javascript
db.collection('verification_attempts')
  .where('userId', '==', 'user123')
  .orderBy('createdAt', 'desc')
  .get()
  .then(s => s.forEach(d => console.log(d.data())))
```

## 🛠️ Troubleshooting

### User Says "Stuck on Checking Status"
1. Find their verification in Firestore
2. Check `status` field
3. If still `pending`, update to `completed` or `failed`
4. User should see result within 5 seconds

### Verification Not Found
1. Check `externalReferenceId` is correct
2. Check user completed verification on Ondato
3. Check Firestore for any errors
4. Ask user to retry verification

### Status Updated But User Doesn't See It
1. Check user has internet connection
2. Check Firestore listener is working
3. Ask user to restart app
4. Check app logs for errors

## 📝 Status Values

| Status | Meaning | Action |
|--------|---------|--------|
| `pending` | Waiting for admin review | Update to completed/failed |
| `completed` | Approved | User can continue |
| `failed` | Rejected | User can retry |
| `expired` | Timed out | User can retry |

## 🎯 Best Practices

### ✅ Do
- Check Ondato dashboard before updating Firestore
- Add rejection reason when rejecting
- Update status within 24 hours
- Keep external reference ID for records

### ❌ Don't
- Don't approve without checking Ondato
- Don't delete verification attempts
- Don't change userId or externalReferenceId
- Don't approve users under 18

## 📞 Support Contacts

- **Ondato Support**: support@ondato.com
- **Firebase Console**: https://console.firebase.google.com
- **Ondato Dashboard**: https://dashboard.ondato.com

## 🔗 Quick Links

- Firebase Console: https://console.firebase.google.com/project/striver-app-48562/firestore
- Ondato Dashboard: https://dashboard.ondato.com
- Setup ID: `fa1fb2cb-034f-4926-bd38-c8290510ade9`

## 📚 Documentation

- Full Guide: `ONDATO_NO_WEBHOOK_GUIDE.md`
- Implementation: `ONDATO_IMPLEMENTATION_SUMMARY.md`
- Update Script: `test-ondato-manual-update.js`
- Security Rules: `firestore-verification-rules.txt`

---

**Print this page and keep it handy for quick reference!**
