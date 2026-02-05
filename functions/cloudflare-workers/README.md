# Cloudflare Workers - Ondato Proxy

This directory contains the Cloudflare Worker that acts as a proxy between the React Native app and Ondato API.

## Purpose

The worker eliminates Firebase authentication issues by:
- Handling Ondato API authentication with Basic Auth
- Providing a simple HTTP API for the React Native app
- Bypassing Firebase Functions for client-initiated operations

## Files

- `ondato-proxy-worker.js` - Main worker code
- `wrangler.toml` - Wrangler configuration
- `deploy-ondato-worker.bat` - Deployment script for Windows
- `README.md` - This file

## Setup

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Update Credentials

Edit `ondato-proxy-worker.js` and replace:
- `ONDATO_USERNAME` with your Ondato username
- `ONDATO_PASSWORD` with your Ondato password
- Verify `ONDATO_SETUP_ID` is correct

**Security Note:** For production, use Cloudflare Worker secrets instead of hardcoding:

```bash
wrangler secret put ONDATO_USERNAME
wrangler secret put ONDATO_PASSWORD
```

Then update the worker code to use `env.ONDATO_USERNAME` and `env.ONDATO_PASSWORD`.

### 4. Update Account ID

Edit `wrangler.toml` and replace `account_id` with your Cloudflare account ID.

You can find your account ID in the Cloudflare dashboard URL:
`https://dash.cloudflare.com/<ACCOUNT_ID>/workers`

### 5. Deploy Worker

**Windows:**
```bash
deploy-ondato-worker.bat
```

**Mac/Linux:**
```bash
wrangler publish
```

### 6. Update React Native App

After deployment, update the worker URL in `src/services/ondatoService.ts`:

```typescript
const CLOUDFLARE_WORKER_URL = 'https://ondato-proxy.YOUR_SUBDOMAIN.workers.dev';
```

## Testing

### Test Health Endpoint

```bash
curl https://ondato-proxy.YOUR_SUBDOMAIN.workers.dev/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Ondato proxy worker is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test Create Session

```bash
curl -X POST https://ondato-proxy.YOUR_SUBDOMAIN.workers.dev/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "externalReferenceId": "test_123",
    "language": "en"
  }'
```

Expected response:
```json
{
  "success": true,
  "identificationId": "abc123...",
  "sessionId": "test_123",
  "verificationUrl": "https://idv.ondato.com/setups/..."
}
```

### Test Check Status

```bash
curl https://ondato-proxy.YOUR_SUBDOMAIN.workers.dev/check-status/YOUR_IDENTIFICATION_ID
```

Expected response:
```json
{
  "success": true,
  "status": "pending",
  "ondatoStatus": "Pending",
  "identificationId": "abc123...",
  "verificationData": {},
  "rejectionReasons": []
}
```

## Monitoring

### View Worker Logs

```bash
wrangler tail
```

This will stream real-time logs from your worker.

### View Metrics

Visit the Cloudflare dashboard:
1. Go to Workers & Pages
2. Click on your worker
3. View the Metrics tab

## Troubleshooting

### Worker not found
- Verify deployment was successful
- Check the worker URL is correct
- Ensure worker is published (not just saved as draft)

### CORS errors
- Verify CORS headers are present in worker responses
- Check browser console for specific CORS errors
- Ensure OPTIONS requests are handled

### Authentication errors
- Verify Ondato credentials are correct
- Check worker logs for authentication failures
- Test Ondato API directly with curl

### Network errors
- Check worker is deployed and running
- Verify worker URL is accessible
- Check React Native network permissions

## Security Best Practices

1. **Use Worker Secrets** for sensitive credentials
2. **Enable rate limiting** to prevent abuse
3. **Add request validation** to prevent malicious input
4. **Monitor logs** for suspicious activity
5. **Use custom domain** for production (optional)

## Custom Domain (Optional)

To use a custom domain like `ondato-api.striver-app.com`:

1. Add a route in `wrangler.toml`:
```toml
routes = [
  { pattern = "ondato-api.striver-app.com/*", zone_name = "striver-app.com" }
]
```

2. Add DNS record in Cloudflare:
- Type: CNAME
- Name: ondato-api
- Target: ondato-proxy.YOUR_SUBDOMAIN.workers.dev

3. Deploy worker:
```bash
wrangler publish
```

## Support

For issues:
1. Check worker logs: `wrangler tail`
2. Test endpoints with curl
3. Review Cloudflare Workers documentation
4. Check Ondato API documentation
