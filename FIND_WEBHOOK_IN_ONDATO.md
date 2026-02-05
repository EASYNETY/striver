# 🔍 How to Find Webhook Settings in Ondato Dashboard

## You're Currently In: Products Section ❌

The screenshot shows you're in the **Products** section, which lists Ondato's services. Webhook configuration is in a different location.

---

## ✅ Where to Find Webhook Settings

### Option 1: Settings Menu (Most Common)
1. Look for a **⚙️ Settings** icon or menu (usually in the left sidebar or top-right corner)
2. Click on **Settings**
3. Look for one of these sub-sections:
   - **Webhooks**
   - **Integrations**
   - **API Settings**
   - **Notifications**
   - **Developer Settings**

### Option 2: Developer/API Section
1. Look for **Developer** or **API** in the main menu
2. Click on it
3. Look for **Webhooks** or **Webhook Configuration**

### Option 3: Integration Section
1. Look for **Integrations** in the main menu
2. Click on it
3. Look for **Webhooks** or **Callback URLs**

### Option 4: Account/Profile Settings
1. Click on your **profile icon** or **account name** (usually top-right)
2. Select **Account Settings** or **Profile Settings**
3. Look for **Webhooks** or **API Configuration**

---

## 🎯 What to Look For

The webhook configuration page typically has:
- A button like **"Add Webhook"** or **"Configure Webhook"**
- A list of existing webhooks (if any)
- Fields for:
  - Webhook URL
  - Authentication method
  - Event selection

---

## 📸 Visual Clues

Look for these icons or labels in the menu:
- 🔗 **Webhooks**
- ⚙️ **Settings**
- 🔌 **Integrations**
- 👨‍💻 **Developer**
- 🔑 **API**
- 📡 **Notifications**

---

## 🆘 If You Still Can't Find It

### Check Your Ondato Plan
Some Ondato plans may not include webhook functionality. Check if:
- You have a **Developer** or **Enterprise** plan
- Webhooks are enabled for your account
- You have the necessary permissions

### Contact Ondato Support
If you can't locate the webhook settings:

**Method 1: Live Chat**
- Look for a chat icon (💬) in the bottom-right corner of the dashboard
- Click it and ask: "Where can I configure webhooks?"

**Method 2: Email Support**
Send an email to: **support@ondato.com**

Subject: "Need Help Configuring Webhooks"

Message:
```
Hi Ondato Support,

I need to configure a webhook for my integration but cannot find 
the webhook settings in my dashboard.

Could you please guide me to the correct location or enable 
webhook configuration for my account?

My account: [Your email or account ID]

Thank you!
```

**Method 3: Check Documentation**
- Look for a **Help** or **Documentation** link in the dashboard
- Search for "webhook" in the documentation

---

## 🔄 Alternative: Use Ondato API Directly

If webhooks are not available in your dashboard, you might be able to configure them via API:

### Check API Documentation
1. Look for **API Documentation** in the Ondato dashboard
2. Search for "webhook" endpoints
3. Look for endpoints like:
   - `POST /webhooks` - Create webhook
   - `GET /webhooks` - List webhooks
   - `PUT /webhooks/{id}` - Update webhook

### Example API Call (if available)
```bash
curl -X POST https://api.ondato.com/v1/webhooks \
  -H "Authorization: Basic YOUR_BASE64_CREDENTIALS" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://ondatowebhook-hphu25tfqq-uc.a.run.app",
    "events": ["KycIdentification.Approved", "KycIdentification.Rejected"],
    "auth": {
      "type": "basic",
      "username": "striver_webhook",
      "password": "striver_secure_webhook_2024"
    }
  }'
```

---

## 📋 Quick Checklist

Before contacting support, check:
- [ ] Looked in Settings menu
- [ ] Looked in Developer/API section
- [ ] Looked in Integrations section
- [ ] Checked account/profile settings
- [ ] Searched for "webhook" in dashboard search bar (if available)
- [ ] Checked if your plan includes webhooks
- [ ] Reviewed Ondato documentation

---

## 🎯 What to Tell Support

If you contact Ondato support, provide:

1. **Your Account Details:**
   - Email: [your email]
   - Company: Striver Technologies Limited
   - Setup ID: 896724ce-42f4-47d3-96b3-db599d07bfe3

2. **What You Need:**
   - Configure webhook for KYC identification events
   - Webhook URL: `https://ondatowebhook-hphu25tfqq-uc.a.run.app`
   - Events: Approved and Rejected notifications

3. **What You've Tried:**
   - Searched in Settings, Developer, and Integrations sections
   - Cannot locate webhook configuration option

---

## 💡 Temporary Workaround

While waiting for webhook access, you can use **polling** to check verification status:

### Option 1: Manual Status Check
Use the Cloudflare Worker to check status periodically:
```javascript
// In your app, poll every 5 seconds
const checkStatus = async (sessionId) => {
  const response = await fetch(
    `https://ondato-proxy.striverapp.workers.dev/check-status?sessionId=${sessionId}`
  );
  return response.json();
};
```

### Option 2: Use Ondato Dashboard
- Check verification status manually in Ondato dashboard
- Update Firestore manually when verification completes

---

## 📞 Ondato Contact Information

**Support Email:** support@ondato.com
**Website:** https://ondato.com
**Documentation:** https://documentation.ondato.com
**Dashboard:** https://admin.ondato.com

---

## ✅ Once You Find Webhooks

When you locate the webhook settings, use these details:

```
Webhook URL: https://ondatowebhook-hphu25tfqq-uc.a.run.app
Auth Type: Basic Auth
Username: striver_webhook
Password: striver_secure_webhook_2024
Events: KycIdentification.Approved, KycIdentification.Rejected
```

Then test with:
```bash
node test-webhook-simple.js
```

---

## 🎯 Summary

1. **You're in the wrong section** - Products is for viewing available services
2. **Look for Settings/Developer/Integrations** in the main menu
3. **If not found** - Contact Ondato support
4. **Temporary solution** - Use polling to check status
5. **Once found** - Use the configuration details above

Good luck! Let me know if you need help with anything else.
