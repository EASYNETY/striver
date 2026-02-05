# Ondato Integration - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Get Ondato Credentials (2 min)
1. Log in to https://os.ondato.com/admin-panel
2. Go to Settings → API Keys
3. Copy: `ONDATO_USERNAME`, `ONDATO_PASSWORD`, `ONDATO_SETUP_ID`

### 2. Deploy Edge Functions (2 min)
```bash
# Set environment variables
cd supabase/functions
cat > .env << EOF
ONDATO_USERNAME=your_username
ONDATO_PASSWORD=your_password
ONDATO_SETUP_ID=your_setup_id
ONDATO_API_URL=https://api.ondato.com
EOF

# Deploy functions
supabase functions deploy verify-age
supabase functions deploy ondato-webhook
```

### 3. Configure Webhook (1 min)
1. In Ondato Dashboard → Settings → Webhooks
2. Add: `https://[your-project].supabase.co/functions/v1/ondato-webhook`
3. Enable: `KycIdentification.Approved`, `KycIdentification.Rejected`
4. Auth: Basic (same credentials)

## 📱 How It Works

```
User Flow:
1. Select "Family Account" → Enter DOB (18+)
2. Tap "Start Verification" → Opens Ondato in browser
3. Upload ID + Complete liveness check
4. Ondato → Webhook → Database updated
5. User redirected back to app → Continue onboarding
```

## 🔧 Key Files

| File | Purpose |
|------|---------|
| `src/screens/auth/OndatoVerification.tsx` | Main verification screen |
| `src/hooks/useOndatoVerification.ts` | Verification logic hook |
| `supabase/functions/verify-age/index.ts` | Creates Ondato session |
| `supabase/functions/ondato-webhook/index.ts` | Handles verification results |

## 🧪 Testing

### Test in Sandbox
```bash
# Update .env
ONDATO_API_URL=https://api-sandbox.ondato.com
```

### Test Scenarios
1. **Success**: Use Ondato test documents
2. **Age Fail**: Use DOB < 18 years
3. **Timeout**: Don't complete within 30 min

## 🐛 Common Issues

| Error | Fix |
|-------|-----|
| "Unauthorized" | Check ONDATO_USERNAME/PASSWORD |
| "Setup ID not found" | Verify ONDATO_SETUP_ID |
| Deep link not working | Check URL scheme in Info.plist/AndroidManifest.xml |
| Webhook not received | Verify webhook URL and Basic Auth |

## 📊 Database Schema

```sql
-- Quick setup
CREATE TABLE verification_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT UNIQUE NOT NULL,
  method TEXT NOT NULL,
  status TEXT NOT NULL,
  verification_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE users 
  ADD COLUMN age_verification_status TEXT DEFAULT 'unverified',
  ADD COLUMN age_verification_date TIMESTAMP WITH TIME ZONE;
```

## 🔐 Security Checklist

- [ ] API credentials in environment variables (not code)
- [ ] Webhook validates Basic Auth
- [ ] Sessions expire after 30 minutes
- [ ] Deep links use custom scheme (striver://)
- [ ] HTTPS only for all API calls

## 📞 Support

- **Ondato Docs**: https://ondato.atlassian.net/wiki/spaces/PUB/pages/2268626955
- **Ondato Support**: support@ondato.com
- **Admin Panel**: https://os.ondato.com/admin-panel

## ✅ Verification Flow Diagram

```
┌─────────────┐
│   User      │
│ (Parent)    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ DateOfBirthScreen   │
│ (Age 18+ required)  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ OndatoVerification  │
│ Screen              │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Edge Function:      │
│ verify-age          │
│ - Creates session   │
│ - Returns URL       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Ondato IDV          │
│ (In-app browser)    │
│ - Upload ID         │
│ - Liveness check    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Ondato Webhook      │
│ → Edge Function     │
│ - Updates DB        │
│ - Sends notification│
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Deep Link Return    │
│ striver://          │
│ verification-success│
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Continue Onboarding │
│ (InterestsSelection)│
└─────────────────────┘
```

## 🎯 Next Steps

1. Complete setup checklist: `ONDATO_SETUP_CHECKLIST.md`
2. Read full guide: `ONDATO_INTEGRATION_GUIDE.md`
3. Test in sandbox environment
4. Deploy to production
5. Monitor metrics

## 💡 Pro Tips

- Use test phone numbers in development
- Monitor Ondato dashboard for verification attempts
- Set up Supabase logging for Edge Functions
- Keep webhook credentials secure
- Test deep links on both iOS and Android
- Document your specific setup for team reference

---

**Need help?** Check `ONDATO_SETUP_CHECKLIST.md` for detailed step-by-step instructions.
