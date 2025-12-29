# MUVO API Platform - Deployment Guide

This guide will help you deploy the complete MUVO B2B API platform so partner businesses can integrate and contribute to your shared review database.

---

## 📦 What's Included

1. **Database Schema** (`api-schema-additions.sql`) - API keys, partners, webhooks, usage tracking
2. **API Endpoints** (`api-endpoints.ts`) - REST API for places, reviews, signals
3. **JavaScript SDK** (`muvo-sdk.ts`) - Client library for easy integration
4. **API Documentation** (`API_DOCUMENTATION.md`) - Complete partner docs
5. **Partner Dashboard** (`APIKeyManagement.tsx`) - UI for managing API keys

---

## ⏱️ Deployment Timeline

**Total: ~4-6 hours**

- Database setup: 30 min
- API deployment: 2 hours
- SDK publishing: 1 hour
- Documentation site: 1 hour
- Testing: 1 hour

---

## 🗄️ Phase 1: Database Setup (30 min)

### Step 1: Run Additional Schema

After running the main `supabase-schema.sql`, run the API additions:

```bash
# In Supabase SQL Editor
```

Paste the contents of `api-schema-additions.sql` and execute.

This creates:
- `api_partners` table
- `api_keys` table
- `api_usage` tracking
- `webhooks` table
- `webhook_deliveries` log
- Rate limiting tables
- API tier configuration

### Step 2: Verify Tables

Check that all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'api_%' OR table_name LIKE 'webhook%';
```

You should see:
- api_partners
- api_keys
- api_usage
- api_tiers
- webhooks
- webhook_deliveries
- rate_limits

### Step 3: Seed API Tiers

The schema automatically seeds the tier data, but verify:

```sql
SELECT * FROM api_tiers;
```

Should show: free, starter, pro, enterprise tiers.

---

## 🚀 Phase 2: Deploy API Endpoints (2 hours)

You have two deployment options:

### Option A: Supabase Edge Functions (Recommended)

**Pros:**
- Integrated with Supabase
- Automatic scaling
- Built-in auth
- Free tier available

**Steps:**

1. **Install Supabase CLI**
```bash
npm install -g supabase
supabase login
```

2. **Initialize Functions**
```bash
cd your-project
supabase functions new muvo-api
```

3. **Copy API Code**

Copy the contents of `api-endpoints.ts` into:
```
supabase/functions/muvo-api/index.ts
```

4. **Add Environment Variables**
```bash
supabase secrets set API_KEY_SECRET=your-secret-here
```

5. **Deploy**
```bash
supabase functions deploy muvo-api
```

6. **Get Your API URL**
```
https://[project-id].supabase.co/functions/v1/muvo-api
```

### Option B: Next.js API Routes

**Pros:**
- More control
- Easier local development
- Can customize extensively

**Steps:**

1. **Create API Routes**

In your Next.js project:
```
pages/api/v1/places/index.ts
pages/api/v1/places/[id].ts
pages/api/v1/reviews/index.ts
pages/api/v1/signals/index.ts
```

2. **Copy Handler Code**

Copy the functions from `api-endpoints.ts` into each route file.

3. **Add Middleware**

Create `pages/api/_middleware.ts`:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Add CORS headers
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  return response;
}
```

4. **Deploy to Vercel**
```bash
vercel --prod
```

---

## 📚 Phase 3: Publish SDK (1 hour)

### Step 1: Create NPM Package

1. **Create package directory**
```bash
mkdir muvo-sdk
cd muvo-sdk
npm init -y
```

2. **Copy SDK file**
```bash
cp ../muvo-sdk.ts ./index.ts
```

3. **Update package.json**
```json
{
  "name": "@muvo/sdk",
  "version": "1.0.0",
  "description": "Official MUVO API client",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "prepublish": "npm run build"
  },
  "keywords": ["muvo", "reviews", "api"],
  "author": "MUVO",
  "license": "MIT",
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

4. **Create tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["index.ts"]
}
```

5. **Build and Publish**
```bash
npm run build
npm publish --access public
```

### Step 2: Test SDK

```bash
npm install @muvo/sdk
```

```javascript
const { MuvoClient } = require('@muvo/sdk');
const muvo = new MuvoClient({ apiKey: 'muvo_test_...' });
const places = await muvo.getPlaces();
console.log(places);
```

---

## 📖 Phase 4: Documentation Site (1 hour)

### Option A: Host on Your Site

1. **Convert Markdown to HTML**

Use a static site generator like Docusaurus or VitePress:

```bash
npm create vite@latest muvo-docs -- --template vanilla
cd muvo-docs
npm install
```

2. **Add Documentation**

Copy `API_DOCUMENTATION.md` content into your docs site.

3. **Deploy**
```bash
npm run build
# Deploy dist/ to your hosting
```

### Option B: Use GitHub Pages

1. **Create docs repo**
```bash
git init muvo-api-docs
cd muvo-api-docs
```

2. **Add documentation**
```bash
cp ../API_DOCUMENTATION.md ./README.md
git add .
git commit -m "Initial docs"
```

3. **Push to GitHub**
```bash
git remote add origin https://github.com/yourusername/muvo-api-docs
git push -u origin main
```

4. **Enable GitHub Pages**
- Go to repo settings
- Enable Pages
- Select main branch
- Docs available at: `https://yourusername.github.io/muvo-api-docs`

---

## 🎨 Phase 5: Partner Dashboard (1 hour)

### Step 1: Add API Key Management to Your App

1. **Copy Component**

Copy `APIKeyManagement.tsx` to your app:
```
src/components/APIKeyManagement.tsx
```

2. **Add Route**

In your router (e.g., React Router):
```typescript
import { APIKeyManagement } from '@/components/APIKeyManagement';

<Route path="/dashboard/api-keys" element={<APIKeyManagement />} />
```

3. **Add Navigation Link**

In your dashboard navigation:
```tsx
<Link to="/dashboard/api-keys">API Keys</Link>
```

### Step 2: Create Partner Portal

Create a dedicated section for API partners:

```
/partners - Landing page for partners
/partners/signup - Partner registration
/partners/dashboard - Partner dashboard
/partners/dashboard/api-keys - API key management
/partners/dashboard/usage - Usage analytics
/partners/dashboard/webhooks - Webhook management
```

---

## 🧪 Phase 6: Testing (1 hour)

### Test 1: API Key Generation

1. Sign up as a partner
2. Generate an API key
3. Verify key appears in database
4. Copy key (shown only once)

### Test 2: API Endpoints

```bash
# Test authentication
curl https://api.muvo.app/v1/places \
  -H "Authorization: Bearer muvo_test_..."

# Should return places

# Test without auth
curl https://api.muvo.app/v1/places

# Should return 401 Unauthorized
```

### Test 3: Submit Review

```bash
curl -X POST https://api.muvo.app/v1/reviews \
  -H "Authorization: Bearer muvo_test_..." \
  -H "Content-Type: application/json" \
  -d '{
    "place_id": "your-place-id",
    "signals": ["signal-id-1", "signal-id-2"]
  }'

# Should return 201 Created
```

### Test 4: Rate Limiting

Make 101 requests in one hour (if on free tier):

```bash
for i in {1..101}; do
  curl https://api.muvo.app/v1/places \
    -H "Authorization: Bearer muvo_test_..."
done

# Request 101 should return 429 Too Many Requests
```

### Test 5: SDK

```javascript
const { MuvoClient } = require('@muvo/sdk');

const muvo = new MuvoClient({
  apiKey: 'muvo_test_...',
});

// Test getting places
const places = await muvo.getPlaces();
console.log('Places:', places.data.length);

// Test submitting review
const review = await muvo.createReview({
  place_id: 'place-id',
  signals: ['signal-1', 'signal-2'],
});
console.log('Review created:', review.review.id);
```

---

## 🔐 Security Checklist

Before going live:

- [ ] API keys are hashed (SHA-256) in database
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] Environment variables are secure
- [ ] Webhook signatures are verified
- [ ] SQL injection protection (use parameterized queries)
- [ ] Input validation on all endpoints
- [ ] HTTPS only (no HTTP)
- [ ] API keys expire after 1 year (optional)
- [ ] Audit logging is enabled

---

## 📊 Monitoring

### Set Up Analytics

Track key metrics:
- API requests per hour/day
- Error rates
- Response times
- Top partners by usage
- Reviews contributed by partner

### Create Dashboards

In your partner dashboard, show:
- Total API calls (last 24h, 7d, 30d)
- Rate limit usage
- Error rate
- Reviews contributed
- Top endpoints used

### Alerts

Set up alerts for:
- Error rate > 5%
- Response time > 2s
- Rate limit exceeded frequently
- Webhook delivery failures

---

## 🚀 Launch Checklist

Before announcing to partners:

- [ ] Database schema deployed
- [ ] API endpoints live and tested
- [ ] SDK published to NPM
- [ ] Documentation site live
- [ ] Partner dashboard functional
- [ ] Rate limiting working
- [ ] Webhooks tested
- [ ] Security audit passed
- [ ] Monitoring set up
- [ ] Support email configured
- [ ] Terms of Service ready
- [ ] Pricing page live
- [ ] Example integrations documented

---

## 📣 Marketing to Partners

### 1. Create Partner Landing Page

**URL:** `muvo.app/partners`

**Content:**
- Hero: "Build with MUVO's Review Platform"
- Benefits: Network effect, no star ratings, easy integration
- Use cases: RV apps, restaurant apps, travel apps
- CTA: "Get API Access"

### 2. Reach Out to Potential Partners

**Target:**
- RV travel apps
- Restaurant discovery apps
- Travel planning apps
- Local business directories

**Pitch:**
- "Integrate MUVO's signal-based reviews"
- "Your users contribute, everyone benefits"
- "Free tier available"
- "5-minute integration"

### 3. Create Integration Examples

Build example apps:
- "RV Park Finder" - Shows MUVO integration
- "Restaurant Roulette" - Uses MUVO API
- "Local Explorer" - Demonstrates SDK

Open source them on GitHub.

---

## 🆘 Support

### For Partners

- Email: partners@muvo.app
- Discord: Create #api-partners channel
- Documentation: api.muvo.app/docs
- Status page: status.muvo.app

### For You

If you need help deploying:
- Check Supabase docs: supabase.com/docs
- Check Next.js docs: nextjs.org/docs
- Email me: [your email]

---

## 🎉 You're Ready!

You now have a complete B2B API platform that allows partner businesses to integrate MUVO and contribute to your shared review database.

**Next steps:**
1. Deploy the API
2. Publish the SDK
3. Launch partner program
4. Onboard first partners
5. Watch the network effect grow! 🚀

**Questions?** partners@muvo.app
