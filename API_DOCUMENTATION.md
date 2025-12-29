# MUVO API Documentation

Welcome to the MUVO API! This documentation will help you integrate MUVO's review system into your application.

---

## 🚀 Quick Start

### 1. Get Your API Key

1. Sign up at [muvo.app/partners](https://muvo.app/partners)
2. Navigate to **API Keys** in your dashboard
3. Click **Create API Key**
4. Copy your key (you'll only see it once!)

### 2. Make Your First Request

```bash
curl https://api.muvo.app/v1/places \
  -H "Authorization: Bearer muvo_live_your_key_here"
```

### 3. Submit Your First Review

```bash
curl -X POST https://api.muvo.app/v1/reviews \
  -H "Authorization: Bearer muvo_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "place_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_email": "user@example.com",
    "signals": ["signal-id-1", "signal-id-2"],
    "source": "MyApp"
  }'
```

---

## 🔑 Authentication

All API requests require authentication using an API key in the `Authorization` header:

```
Authorization: Bearer muvo_live_abc123...
```

### API Key Types

- **Test keys**: `muvo_test_...` - For development and testing
- **Live keys**: `muvo_live_...` - For production use

### Security Best Practices

✅ **DO:**
- Store API keys securely (environment variables, secrets manager)
- Use different keys for test and production
- Rotate keys periodically
- Delete unused keys

❌ **DON'T:**
- Commit keys to version control
- Share keys publicly
- Use production keys in client-side code
- Hardcode keys in your application

---

## 📊 Rate Limits

Rate limits vary by tier:

| Tier | Requests/Hour | Requests/Day |
|------|---------------|--------------|
| Free | 100 | 1,000 |
| Starter | 1,000 | 10,000 |
| Pro | 10,000 | 100,000 |
| Enterprise | 100,000 | 1,000,000 |

### Rate Limit Headers

Every response includes rate limit information:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

### Handling Rate Limits

When you exceed your rate limit, you'll receive a `429 Too Many Requests` response:

```json
{
  "error": "Rate limit exceeded",
  "retry_after": 3600
}
```

**Best practices:**
- Implement exponential backoff
- Cache responses when possible
- Batch requests when applicable
- Monitor your usage in the dashboard

---

## 📍 Endpoints

### Base URL

```
https://api.muvo.app/v1
```

---

## Places

### GET /places

Search and list places.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (name or city) |
| `category` | string | Filter by category |
| `lat` | number | Latitude for nearby search |
| `lng` | number | Longitude for nearby search |
| `radius` | number | Search radius in km (default: 10) |
| `limit` | number | Results per page (default: 20, max: 100) |
| `offset` | number | Pagination offset (default: 0) |

**Example Request:**

```bash
curl "https://api.muvo.app/v1/places?category=Restaurant&q=pizza&limit=10" \
  -H "Authorization: Bearer muvo_live_..."
```

**Example Response:**

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Mountain View Pizza",
      "category": "Restaurant",
      "address": "123 Main St",
      "city": "Boulder",
      "state": "CO",
      "country": "USA",
      "latitude": 40.0150,
      "longitude": -105.2705,
      "phone": "(555) 123-4567",
      "website": "https://example.com",
      "description": "Best pizza in town",
      "image_url": "https://example.com/image.jpg",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 10,
    "offset": 0
  }
}
```

---

### GET /places/:id

Get a single place with aggregated signals.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Place ID |

**Example Request:**

```bash
curl "https://api.muvo.app/v1/places/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer muvo_live_..."
```

**Example Response:**

```json
{
  "place": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Mountain View Pizza",
    "category": "Restaurant",
    "address": "123 Main St",
    "city": "Boulder",
    "state": "CO",
    "latitude": 40.0150,
    "longitude": -105.2705
  },
  "signals": [
    {
      "signal_id": "signal-1",
      "signal_name": "Delicious Food",
      "emoji": "👍",
      "category": "what_stood_out",
      "count": 89
    },
    {
      "signal_id": "signal-2",
      "signal_name": "Slow Service",
      "emoji": "⚠️",
      "category": "what_didnt_work",
      "count": 12
    }
  ],
  "review_count": 127
}
```

---

## Reviews

### POST /reviews

Submit a review from your application.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `place_id` | UUID | Yes | ID of the place being reviewed |
| `user_id` | string | No | Your app's user ID (for attribution) |
| `user_email` | string | No | User's email (for attribution) |
| `signals` | string[] | Yes | Array of signal IDs (1-10 signals) |
| `source` | string | No | Your app name (e.g., "MyApp") |

**Example Request:**

```bash
curl -X POST "https://api.muvo.app/v1/reviews" \
  -H "Authorization: Bearer muvo_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "place_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_email": "user@example.com",
    "signals": [
      "signal-id-1",
      "signal-id-2",
      "signal-id-3"
    ],
    "source": "MyApp"
  }'
```

**Example Response:**

```json
{
  "review": {
    "id": "review-123",
    "place_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": null,
    "partner_id": "partner-456",
    "source": "api",
    "created_at": "2024-12-28T10:30:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Missing required fields or invalid data
- `404 Not Found` - Place doesn't exist
- `429 Too Many Requests` - Rate limit exceeded

---

## Signals

### GET /signals

Get all available signals.

**Example Request:**

```bash
curl "https://api.muvo.app/v1/signals" \
  -H "Authorization: Bearer muvo_live_..."
```

**Example Response:**

```json
{
  "signals": [
    {
      "id": "signal-1",
      "name": "Delicious Food",
      "emoji": "👍",
      "category": "what_stood_out",
      "is_active": true
    },
    {
      "id": "signal-2",
      "name": "Slow Service",
      "emoji": "⚠️",
      "category": "what_didnt_work",
      "is_active": true
    }
  ]
}
```

### Signal Categories

| Category | Description | Color |
|----------|-------------|-------|
| `what_stood_out` | Positive highlights | Blue |
| `whats_it_like` | Neutral vibes/atmosphere | Gray |
| `what_didnt_work` | Areas for improvement | Orange |

---

## 🔔 Webhooks

Receive real-time notifications when events occur in MUVO.

### Supported Events

- `review.created` - New review submitted
- `review.updated` - Review modified
- `place.created` - New place added
- `place.updated` - Place information updated

### Setting Up Webhooks

1. Go to your partner dashboard
2. Navigate to **Webhooks**
3. Click **Add Webhook**
4. Enter your endpoint URL
5. Select events to subscribe to
6. Save and copy your webhook secret

### Webhook Payload

```json
{
  "event": "review.created",
  "timestamp": "2024-12-28T10:30:00Z",
  "data": {
    "review": {
      "id": "review-123",
      "place_id": "place-456",
      "signals": ["signal-1", "signal-2"],
      "created_at": "2024-12-28T10:30:00Z"
    }
  }
}
```

### Verifying Webhooks

Verify webhook signatures to ensure requests are from MUVO:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === expectedSignature;
}

// Express.js example
app.post('/webhooks/muvo', (req, res) => {
  const signature = req.headers['x-muvo-signature'];
  const isValid = verifyWebhook(req.body, signature, process.env.WEBHOOK_SECRET);
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook
  console.log('Received event:', req.body.event);
  res.status(200).send('OK');
});
```

---

## 📦 SDKs

### JavaScript/TypeScript

```bash
npm install @muvo/sdk
```

```javascript
import { MuvoClient } from '@muvo/sdk';

const muvo = new MuvoClient({
  apiKey: 'muvo_live_...',
});

// Get places
const places = await muvo.getPlaces({ category: 'Restaurant' });

// Submit review
const review = await muvo.createReview({
  place_id: 'place-123',
  user_email: 'user@example.com',
  signals: ['signal-1', 'signal-2'],
});
```

### React Hooks

```javascript
import { useMuvo, usePlaces } from '@muvo/sdk';

function PlaceList() {
  const muvo = useMuvo({ apiKey: 'muvo_live_...' });
  const { places, loading, error } = usePlaces(muvo, { category: 'Restaurant' });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {places.map(place => (
        <div key={place.id}>{place.name}</div>
      ))}
    </div>
  );
}
```

---

## 🔍 Use Cases

### 1. RV Travel App

**Scenario:** Your app helps RVers find campgrounds.

**Integration:**
1. Display MUVO signals on campground pages
2. Let users submit reviews via your app
3. All reviews go into shared MUVO database
4. Everyone benefits from more data!

```javascript
// Get campgrounds near user
const campgrounds = await muvo.searchNearby(
  userLat,
  userLng,
  50, // 50km radius
  'RV Park'
);

// Show signals on detail page
const details = await muvo.getPlace(campgroundId);
// Display details.signals to user

// Submit review when user taps signals
await muvo.createReview({
  place_id: campgroundId,
  user_id: userId,
  signals: selectedSignalIds,
  source: 'RVTravelApp',
});
```

### 2. Restaurant Discovery App

**Scenario:** Your app helps people find restaurants.

**Integration:**
1. Show MUVO signals instead of star ratings
2. Users tap signals to review
3. Contribute to shared database
4. Network effect grows data quality

```javascript
// Search restaurants
const restaurants = await muvo.getPlaces({
  category: 'Restaurant',
  q: searchQuery,
  lat: userLat,
  lng: userLng,
  radius: 10,
});

// Get signals for restaurant
const restaurant = await muvo.getPlace(restaurantId);

// Display top signals
restaurant.signals
  .filter(s => s.category === 'what_stood_out')
  .slice(0, 3)
  .forEach(signal => {
    console.log(`${signal.emoji} ${signal.signal_name} (${signal.count})`);
  });
```

---

## ❌ Error Handling

### Error Response Format

```json
{
  "error": "Error message",
  "code": "error_code",
  "details": {}
}
```

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | `invalid_request` | Missing or invalid parameters |
| 401 | `invalid_api_key` | API key is invalid or missing |
| 403 | `permission_denied` | API key lacks required permissions |
| 404 | `not_found` | Resource doesn't exist |
| 429 | `rate_limit_exceeded` | Too many requests |
| 500 | `internal_error` | Server error |

### Error Handling Example

```javascript
try {
  const review = await muvo.createReview(reviewData);
} catch (error) {
  if (error.isRateLimitError()) {
    // Wait and retry
    await sleep(error.details.retry_after * 1000);
    return retry();
  }
  
  if (error.isAuthError()) {
    // Invalid API key
    console.error('Authentication failed');
  }
  
  if (error.statusCode === 404) {
    // Place doesn't exist
    console.error('Place not found');
  }
}
```

---

## 📈 Best Practices

### 1. Cache Responses

Cache place data and signals to reduce API calls:

```javascript
// Cache signals (they rarely change)
const signals = await muvo.getSignals();
localStorage.setItem('muvo_signals', JSON.stringify(signals));

// Cache place details for 1 hour
const cacheKey = `place_${placeId}`;
const cached = cache.get(cacheKey);
if (cached && Date.now() - cached.timestamp < 3600000) {
  return cached.data;
}
```

### 2. Batch Operations

Submit multiple reviews in one batch:

```javascript
const reviews = await muvo.createReviews([
  { place_id: 'place-1', signals: ['signal-1'] },
  { place_id: 'place-2', signals: ['signal-2'] },
]);
```

### 3. Handle Errors Gracefully

Don't let API errors break your app:

```javascript
try {
  const places = await muvo.getPlaces();
} catch (error) {
  // Show cached data or friendly error message
  return fallbackData;
}
```

### 4. Monitor Usage

Check your dashboard regularly:
- Track API usage
- Monitor error rates
- Review rate limit consumption
- Optimize based on patterns

---

## 🆘 Support

### Documentation
- API Reference: [api.muvo.app/docs](https://api.muvo.app/docs)
- SDK Documentation: [github.com/muvo/sdk](https://github.com/muvo/sdk)

### Contact
- Email: partners@muvo.app
- Discord: [discord.gg/muvo](https://discord.gg/muvo)
- Status Page: [status.muvo.app](https://status.muvo.app)

### Report Issues
- GitHub: [github.com/muvo/sdk/issues](https://github.com/muvo/sdk/issues)
- Email: support@muvo.app

---

## 📝 Changelog

### v1.0.0 (2024-12-28)
- Initial API release
- Places, Reviews, and Signals endpoints
- Webhook support
- JavaScript SDK

---

**Ready to integrate? [Get your API key →](https://muvo.app/partners)**
