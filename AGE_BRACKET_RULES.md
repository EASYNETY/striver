# Age Bracket Rules & Safety Guidelines

## 📊 Age Brackets Overview

Striver implements strict age-based safety rules to comply with COPPA and protect all users.

### Age Tiers

| Age Bracket | Tier Name | Account Type | Verification Required |
|-------------|-----------|--------------|----------------------|
| Under 13 | Junior Baller | Family (Child Profile) | Parent verification required |
| 13-17 | Academy Prospect | Individual or Family | Age verification required |
| 18+ | First Teamer | Individual or Family | Age verification required (for parents) |

## 🔒 Age-Specific Rules

### 1. Under 13 Years Old (Junior Baller)

**Account Requirements**:
- ❌ Cannot create individual account
- ✅ Must be added as child profile by verified parent
- ✅ Parent must be 18+ and verified via Ondato

**Safety Defaults (Automatic)**:
- 🔒 Account is 100% Private
- 🔒 Direct Messages Disabled
- 🔒 Comments Disabled on all posts
- 🔒 Restricted Social Discovery
- 🔒 Screen Time Limit: 60 minutes/day
- 🔒 Bedtime Mode: Enabled
- 🔒 Daily Spending Limit: $0.50 (50 coins)

**Content Restrictions**:
- All video uploads require parent approval
- Cannot join squads without parent approval
- Cannot follow users without parent approval
- Cannot be followed by users over 18
- Cannot participate in challenges without parent approval

**Parent Controls**:
- ✅ View all activity
- ✅ Approve/reject all content
- ✅ Manage screen time
- ✅ Control spending
- ✅ Manage privacy settings
- ✅ View all messages (redirected to parent)

### 2. Ages 13-17 (Academy Prospect)

**Account Requirements**:
- ✅ Can create individual account
- ✅ Age verification required (photo ID or parent consent)
- ⚠️ Enhanced safety features enabled by default

**Safety Defaults (Configurable)**:
- 🔓 Account is Private by default (can be changed)
- 🔓 Direct Messages: Restricted (only from followers)
- 🔓 Comments: Enabled with moderation
- 🔓 Social Discovery: Limited
- 🔓 Screen Time Limit: 90 minutes/day (recommended)
- 🔓 Daily Spending Limit: $5.00 (500 coins)

**Content Restrictions**:
- Video uploads: Automatic moderation
- Can join squads: Yes (with age-appropriate matching)
- Can follow users: Yes (with restrictions)
- Can be followed: Yes (by verified users only)
- Challenge participation: Yes (age-appropriate only)

**Parent Controls (Optional)**:
- ⚠️ Can link to family account for monitoring
- ⚠️ Parent can view activity summary
- ⚠️ Parent can set spending limits
- ⚠️ Parent can enable stricter controls

### 3. Ages 18+ (First Teamer)

**Account Requirements**:
- ✅ Can create individual or family account
- ✅ Age verification required for family accounts (Ondato)
- ✅ Full platform access

**Safety Features (Optional)**:
- 🔓 All privacy settings configurable
- 🔓 No content restrictions
- 🔓 Full social features
- 🔓 No spending limits
- 🔓 Can be parent/guardian for family accounts

**Family Account Features**:
- ✅ Can add up to 5 child profiles (under 13)
- ✅ Full parental controls
- ✅ Approval queue for child content
- ✅ Activity monitoring
- ✅ Screen time management
- ✅ Spending controls

## 🛡️ Safety Implementation

### Verification Flow

```
User Signs Up
    ↓
Enter Date of Birth
    ↓
┌─────────────────────────────────────┐
│ Age < 13?                           │
├─────────────────────────────────────┤
│ YES → Must use Family Account       │
│       Parent creates child profile  │
│       Parent verifies via Ondato    │
│                                     │
│ NO → Age 13-17?                     │
│      → Individual account           │
│      → Age verification required    │
│                                     │
│ NO → Age 18+?                       │
│      → Individual or Family         │
│      → Ondato verification for      │
│         family accounts             │
└─────────────────────────────────────┘
```

### Content Moderation

| Age Bracket | Moderation Level | Approval Required |
|-------------|------------------|-------------------|
| Under 13 | Strict | Parent approval for all content |
| 13-17 | Enhanced | Automatic AI + manual review |
| 18+ | Standard | AI moderation only |

### Social Interactions

| Feature | Under 13 | 13-17 | 18+ |
|---------|----------|-------|-----|
| Follow Users | ❌ (Parent approval) | ✅ (Restricted) | ✅ |
| Be Followed | ❌ (Parent approval) | ✅ (Verified only) | ✅ |
| Direct Messages | ❌ (Redirected to parent) | ⚠️ (Followers only) | ✅ |
| Comments | ❌ | ⚠️ (Moderated) | ✅ |
| Squad Creation | ❌ | ⚠️ (Age-appropriate) | ✅ |
| Squad Joining | ❌ (Parent approval) | ✅ (Age-appropriate) | ✅ |
| Challenges | ❌ (Parent approval) | ✅ (Age-appropriate) | ✅ |
| Live Streaming | ❌ | ❌ | ✅ |
| Marketplace | ❌ | ⚠️ (Limited) | ✅ |

## 🔐 Firestore Security Rules

### Children Subcollection

```javascript
match /users/{userId}/children/{childId} {
  // Parents can manage their children's profiles
  allow read: if isSignedIn() && (isOwner(userId) || isAdmin());
  allow create: if isSignedIn() && isOwner(userId);
  allow update: if isSignedIn() && (isOwner(userId) || isAdmin());
  allow delete: if isSignedIn() && (isOwner(userId) || isAdmin());
}
```

### Approvals Subcollection

```javascript
match /users/{userId}/approvals/{approvalId} {
  // Parents can view and manage approval requests
  allow read: if isSignedIn() && (isOwner(userId) || isAdmin());
  allow create: if isSignedIn(); // Children can create requests
  allow update: if isSignedIn() && (isOwner(userId) || isAdmin());
  allow delete: if isSignedIn() && (isOwner(userId) || isAdmin());
}
```

### Posts Collection

```javascript
match /posts/{postId} {
  allow read: if isSignedIn();
  allow create: if isSignedIn() && (
    // Under 13: Must have parent approval
    getUserData().ageTier != 'junior_baller' ||
    // Or is creating with pending status
    request.resource.data.status == 'pending'
  );
  allow update: if isSignedIn() && (
    isOwner(resource.data.userId) || 
    isParentOf(resource.data.userId) ||
    isAdmin()
  );
  allow delete: if isAdmin();
}
```

## 📱 Implementation Checklist

### For Under 13 (Junior Baller)

- [x] Require family account
- [x] Parent verification via Ondato
- [x] Automatic safety defaults
- [x] Parent approval queue
- [x] Screen time limits
- [x] Spending limits
- [x] DM redirection to parent
- [x] Comment restrictions
- [x] Private account enforcement

### For 13-17 (Academy Prospect)

- [x] Age verification required
- [x] Enhanced moderation
- [x] Restricted social features
- [x] Age-appropriate content filtering
- [x] Optional parent monitoring
- [x] Spending limits
- [x] Privacy defaults

### For 18+ (First Teamer)

- [x] Full platform access
- [x] Ondato verification for family accounts
- [x] Parental controls for children
- [x] Approval queue management
- [x] Activity monitoring
- [x] No restrictions

## 🚨 Compliance

### COPPA Compliance

- ✅ No data collection from under 13 without parent consent
- ✅ Parent verification required
- ✅ Parent can view/delete child data
- ✅ No targeted advertising to under 13
- ✅ No third-party data sharing for under 13

### GDPR Compliance

- ✅ Data minimization
- ✅ Right to access
- ✅ Right to deletion
- ✅ Parental consent for minors
- ✅ Data portability

## 🔄 Age Verification Methods

### For Under 13
- Parent creates account
- Parent verifies via Ondato (18+ ID check)
- Child profile created by parent

### For 13-17
- Self-signup allowed
- Age verification via:
  - Photo ID upload (manual review)
  - Parent consent form
  - School email verification (optional)

### For 18+
- Self-signup allowed
- Ondato verification for family accounts
- ID verification for enhanced features

## 📊 Monitoring & Reporting

### Parent Dashboard

Parents can view:
- ✅ All child activity
- ✅ Screen time usage
- ✅ Content uploads (pending approval)
- ✅ Squad memberships
- ✅ Follower/following lists
- ✅ Spending history
- ✅ Messages (redirected)

### Admin Dashboard

Admins can:
- ✅ Review flagged content
- ✅ Verify age documentation
- ✅ Manage user reports
- ✅ Enforce safety policies
- ✅ Generate compliance reports

## 🆘 Support

For age verification issues:
- Email: support@striver.app
- In-app: Settings → Help & Support
- Parent portal: https://parents.striver.app

## 📝 Updates

This document is updated as regulations and best practices evolve. Last updated: January 2026.
