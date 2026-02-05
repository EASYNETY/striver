# Ondato Integration Setup Checklist

## ✅ Pre-requisites

- [ ] Ondato account created at https://os.ondato.com
- [ ] Access to Ondato Admin Panel
- [ ] Supabase project set up
- [ ] React Native app with deep linking configured

## 📋 Step-by-Step Setup

### 1. Ondato Dashboard Configuration

#### A. Get API Credentials
- [ ] Log in to [Ondato Admin Panel](https://os.ondato.com/admin-panel)
- [ ] Navigate to **Settings** → **API Keys**
- [ ] Copy and save:
  - `ONDATO_USERNAME`
  - `ONDATO_PASSWORD`
- [ ] Store these securely (you'll need them for environment variables)

#### B. Create IDV Configuration
- [ ] Go to [IDV Configuration](https://os.ondato.com/admin-panel/idv-configuration)
- [ ] Click **"Create New Setup"** or edit existing
- [ ] Configure the following:
  - **Setup Name**: "Striver Parent Age Verification"
  - **Verification Type**: Identity Verification
  - **Required Documents**: Government ID (Passport, Driver's License, National ID)
  - **Liveness Check**: ✅ Enabled
  - **Age Verification**: ✅ Enabled (Minimum age: 18)
  - **Face Match**: ✅ Enabled
  - **Document Verification**: ✅ Enabled
- [ ] Save configuration
- [ ] Copy the **Setup ID** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

#### C. Configure Webhooks
- [ ] In Ondato Dashboard → **Settings** → **Webhooks**
- [ ] Click **"Add Webhook"**
- [ ] Enter webhook URL: `https://[your-project-id].supabase.co/functions/v1/ondato-webhook`
- [ ] Select events to receive:
  - ✅ `KycIdentification.Approved`
  - ✅ `KycIdentification.Rejected`
  - ✅ `IdentityVerification.StatusChanged`
- [ ] Authentication Method: **Basic Auth**
  - Username: Same as `ONDATO_USERNAME`
  - Password: Same as `ONDATO_PASSWORD`
- [ ] Save webhook configuration

### 2. Supabase Configuration

#### A. Database Setup
- [ ] Open Supabase SQL Editor
- [ ] Run the following SQL:

```sql
-- Create verification_attempts table
CREATE TABLE IF NOT EXISTS verification_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  method TEXT NOT NULL,
  status TEXT NOT NULL,
  verification_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_verification_attempts_user_id ON verification_attempts(user_id);
CREATE INDEX idx_verification_attempts_session_id ON verification_attempts(session_id);
CREATE INDEX idx_verification_attempts_status ON verification_attempts(status);

-- Update users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS age_verification_status TEXT DEFAULT 'unverified';
ALTER TABLE users ADD COLUMN IF NOT EXISTS age_verification_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_status JSONB DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completion INTEGER DEFAULT 0;

-- Create notifications table (if not exists)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
```

#### B. Edge Functions Setup
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Initialize Supabase in your project: `supabase init`
- [ ] Copy the Edge Functions to `supabase/functions/`:
  - `verify-age/index.ts`
  - `ondato-webhook/index.ts`

#### C. Environment Variables
- [ ] Create `.env` file in `supabase/functions/`:

```env
ONDATO_USERNAME=your_username_here
ONDATO_PASSWORD=your_password_here
ONDATO_SETUP_ID=your_setup_id_here
ONDATO_API_URL=https://api.ondato.com
ONDATO_IDV_URL=https://idv.ondato.com
```

- [ ] Deploy Edge Functions:
```bash
supabase functions deploy verify-age
supabase functions deploy ondato-webhook
```

- [ ] Set environment variables in Supabase Dashboard:
  - Go to **Project Settings** → **Edge Functions**
  - Add each environment variable

### 3. React Native App Configuration

#### A. Install Dependencies
- [ ] Install required packages:
```bash
npm install expo-web-browser
# or
yarn add expo-web-browser
```

#### B. Configure Deep Links

**iOS (ios/StriverApp/Info.plist):**
- [ ] Add URL scheme:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>striver</string>
    </array>
  </dict>
</array>
```

**Android (android/app/src/main/AndroidManifest.xml):**
- [ ] Add intent filter to MainActivity:
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="striver" />
</intent-filter>
```

#### C. Environment Variables
- [ ] Add to `.env` or `app.config.js`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

#### D. Add Files to Project
- [ ] Copy `src/screens/auth/OndatoVerification.tsx`
- [ ] Copy `src/hooks/useOndatoVerification.ts`
- [ ] Update `src/navigation/AuthNavigator.tsx` to include OndatoVerification screen
- [ ] Update `src/screens/auth/DateOfBirthScreen.tsx` to navigate to Ondato for family accounts

### 4. Testing

#### A. Test in Sandbox Environment
- [ ] Update environment variables to use sandbox:
```env
ONDATO_API_URL=https://api-sandbox.ondato.com
ONDATO_IDV_URL=https://idv-sandbox.ondato.com
```

#### B. Test Scenarios
- [ ] **Successful Verification**:
  - Use test documents provided by Ondato
  - Complete liveness check
  - Verify webhook is received
  - Check database updates
  - Verify user receives notification

- [ ] **Age Rejection**:
  - Use document with DOB showing age < 18
  - Verify rejection is handled correctly
  - Check error messages

- [ ] **Session Expiry**:
  - Start verification but don't complete within 30 minutes
  - Verify session expires correctly

- [ ] **Deep Link Handling**:
  - Test success deep link: `striver://verification-success`
  - Test failure deep link: `striver://verification-failed`

#### C. Verify Database
- [ ] Check `verification_attempts` table for records
- [ ] Verify `users` table is updated with verification status
- [ ] Check `notifications` table for user notifications

### 5. Production Deployment

#### A. Switch to Production Environment
- [ ] Update environment variables to production:
```env
ONDATO_API_URL=https://api.ondato.com
ONDATO_IDV_URL=https://idv.ondato.com
```

#### B. Final Checks
- [ ] Webhook URL is correct and accessible
- [ ] All environment variables are set in Supabase
- [ ] Deep links are configured correctly
- [ ] Edge Functions are deployed
- [ ] Database tables are created

#### C. Monitoring Setup
- [ ] Set up logging for Edge Functions
- [ ] Monitor webhook delivery in Ondato Dashboard
- [ ] Track verification success/failure rates
- [ ] Set up alerts for errors

### 6. Documentation

- [ ] Document the verification flow for your team
- [ ] Create user-facing help documentation
- [ ] Document error handling procedures
- [ ] Create runbook for common issues

## 🔍 Verification Checklist

Test the complete flow:

1. [ ] User selects "Family Account"
2. [ ] User enters date of birth (18+)
3. [ ] User is navigated to Ondato verification screen
4. [ ] User taps "Start Verification"
5. [ ] Ondato verification page opens in browser
6. [ ] User completes document upload
7. [ ] User completes liveness check
8. [ ] Ondato redirects to success/failure URL
9. [ ] App receives deep link
10. [ ] Webhook is received by Edge Function
11. [ ] Database is updated
12. [ ] User receives notification
13. [ ] User is navigated to next screen

## 📊 Monitoring Metrics

Track these metrics:

- [ ] Verification start rate
- [ ] Verification completion rate
- [ ] Verification success rate
- [ ] Average completion time
- [ ] Abandonment rate
- [ ] Error rate by type
- [ ] Webhook delivery success rate

## 🆘 Troubleshooting

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| Webhook not received | Check webhook URL, verify Basic Auth credentials |
| Deep link not working | Verify URL scheme configuration in iOS/Android |
| Session expired | Check 30-minute timeout, implement retry logic |
| Age verification failed | Check Ondato setup configuration, verify age requirement |
| API authentication error | Verify ONDATO_USERNAME and ONDATO_PASSWORD |

## 📚 Resources

- [Ondato API Documentation](https://ondato.atlassian.net/wiki/spaces/PUB/pages/2268626955/Ondato+APIs)
- [Ondato Admin Panel](https://os.ondato.com/admin-panel)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [React Native Deep Linking](https://reactnative.dev/docs/linking)

## ✅ Final Sign-off

- [ ] All setup steps completed
- [ ] Testing completed successfully
- [ ] Production deployment verified
- [ ] Monitoring in place
- [ ] Documentation complete
- [ ] Team trained on the flow

**Setup completed by:** _______________  
**Date:** _______________  
**Verified by:** _______________  
**Date:** _______________
