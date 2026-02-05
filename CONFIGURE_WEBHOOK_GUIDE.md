# 🔧 Ondato Webhook Configuration Guide

## Why Manual Configuration is Required

Ondato does not provide a public API or CLI tool to configure webhooks programmatically. The webhook must be configured through their web dashboard at https://admin.ondato.com.

---

## 🚀 Quick Start (Automated Helper)

### Option 1: PowerShell Script (Recommended - Copies to Clipboard)
```powershell
.\configure-ondato-webhook.ps1
```

This script will:
- ✅ Copy all configuration details to your clipboard
- ✅ Open Ondato dashboard in your browser
- ✅ Display step-by-step instructions

### Option 2: Batch Script
```bash
.\configure-ondato-webhook.bat
```

This script will:
- ✅ Open Ondato dashboard in your browser
- ✅ Display all configuration details
- ✅ Show step-by-step instructions

---

## 📋 Configuration Details

Copy these details to configure the webhook:

### Webhook URL
```
https://ondatowebhook-hphu25tfqq-uc.a.run.app
```

### Authentication
- **Type:** Basic Auth
- **Username:** `striver_webhook`
- **Password:** `striver_secure_webhook_2024`

### Events to Subscribe
- ✅ `KycIdentification.Approved`
- ✅ `KycIdentification.Rejected`

---

## 🎯 Step-by-Step Manual Configuration

### Step 1: Access Ondato Dashboard
1. Open your browser
2. Navigate to: https://admin.ondato.com
3. Log in with your Ondato credentials

### Step 2: Navigate to Webhooks
1. Click on **Settings** in the left sidebar
2. Click on **Webhooks** or **Integrations**
3. Look for "Webhook Configuration" or "Add Webhook"

### Step 3: Add New Webhook
1. Click **"Add Webhook"** or **"Configure Webhook"** button
2. You'll see a form with the following fields:

### Step 4: Fill in Webhook Details

**Webhook URL:**
```
https://ondatowebhook-hphu25tfqq-uc.a.run.app
```
- Paste this URL in the "Webhook URL" or "Endpoint URL" field

**Authentication Method:**
- Select **"Basic Auth"** from the dropdown
- If you see "None", "Bearer Token", or "API Key", choose "Basic Auth"

**Username:**
```
striver_webhook
```

**Password:**
```
striver_secure_webhook_2024
```

### Step 5: Select Events
Check the following events:
- ✅ **KycIdentification.Approved** - When verification is approved
- ✅ **KycIdentification.Rejected** - When verification is rejected

Optional events (recommended):
- ✅ **KycIdentification.Updated** - When verification status changes
- ✅ **KycIdentification.Pending** - When verification is in progress

### Step 6: Save Configuration
1. Review all the details
2. Click **"Save"**, **"Create"**, or **"Add Webhook"** button
3. You should see a success message

### Step 7: Test the Webhook (Optional)
Some Ondato dashboards have a "Test Webhook" button:
1. Click **"Test Webhook"** if available
2. Select a test event (e.g., "Approved")
3. Click **"Send Test"**
4. Check if you receive a 200 OK response

---

## ✅ Verify Configuration

After configuring in Ondato dashboard, verify it's working:

### Method 1: Use Test Script
```bash
node test-webhook-simple.js
```

Expected output:
```
✅ SUCCESS! Webhook is working correctly.
```

### Method 2: Use Batch File
```bash
.\test-webhook.bat
```

### Method 3: Check Firebase Logs
```bash
firebase functions:log --only ondatoWebhook
```

Or view in Firebase Console:
https://console.firebase.google.com/project/striver-app-48562/functions/logs

---

## 🔍 Troubleshooting

### Can't Find Webhooks Section
- Try looking under: **Settings** → **Integrations** → **Webhooks**
- Or: **Developer** → **Webhooks**
- Or: **API** → **Webhooks**
- Contact Ondato support if you can't locate it

### Authentication Options Not Available
- If you don't see "Basic Auth" option, contact Ondato support
- They may need to enable webhook authentication for your account

### Webhook URL Validation Fails
- Ensure the URL is exactly: `https://ondatowebhook-hphu25tfqq-uc.a.run.app`
- No trailing slash
- Must start with `https://`
- Check for any extra spaces

### Events Not Listed
- Different Ondato plans may have different events available
- At minimum, you need: `KycIdentification.Approved` and `KycIdentification.Rejected`
- Contact Ondato support if events are missing

### Test Webhook Fails
- Check Firebase Function logs for errors
- Verify Basic Auth credentials are correct
- Ensure webhook is deployed: `firebase deploy --only functions:ondatoWebhook`

---

## 📞 Need Help?

### Ondato Support
- **Email:** support@ondato.com
- **Dashboard:** https://admin.ondato.com (look for support chat)
- **Documentation:** https://documentation.ondato.com

### What to Ask Ondato Support
If you can't find the webhook configuration:

> "Hi, I need to configure a webhook for my integration. Where can I find the webhook configuration settings in the dashboard? I need to add a webhook URL with Basic Auth to receive KycIdentification events."

---

## 🎯 Quick Reference Card

Print or save this for easy reference:

```
┌─────────────────────────────────────────────────────┐
│         ONDATO WEBHOOK CONFIGURATION                │
├─────────────────────────────────────────────────────┤
│ URL:                                                │
│ https://ondatowebhook-hphu25tfqq-uc.a.run.app      │
│                                                     │
│ Auth Type: Basic Auth                              │
│ Username:  striver_webhook                         │
│ Password:  striver_secure_webhook_2024             │
│                                                     │
│ Events:                                            │
│ ✓ KycIdentification.Approved                       │
│ ✓ KycIdentification.Rejected                       │
└─────────────────────────────────────────────────────┘
```

---

## 📚 Related Documentation

- **WEBHOOK_DEPLOYED_SUCCESS.md** - Webhook deployment details
- **ONDATO_COMPLETE_FINAL.md** - Complete integration overview
- **test-webhook-simple.js** - Test script to verify webhook

---

## ✨ After Configuration

Once configured, your webhook will:
1. ✅ Receive callbacks from Ondato when verification completes
2. ✅ Automatically update Firestore collections
3. ✅ Update user profile with verification status
4. ✅ Create notifications for users
5. ✅ Calculate profile completion percentage

**No additional code needed - everything is automatic!** 🎉
