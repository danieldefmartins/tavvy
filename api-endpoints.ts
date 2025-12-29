// MUVO API - REST Endpoints for Partner Integration
// Deploy this as Supabase Edge Functions or Next.js API routes

import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

// ============================================
// TYPES
// ============================================

interface APIKey {
  id: string;
  partner_id: string;
  rate_limit_per_hour: number;
  permissions: {
    read: boolean;
    write: boolean;
  };
}

interface Place {
  id?: string;
  name: string;
  category: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  description?: string;
  image_url?: string;
}

interface ReviewSubmission {
  place_id: string;
  user_id?: string; // Optional: partner can provide their own user ID
  user_email?: string; // For attribution
  signals: string[]; // Array of signal IDs
  source?: string; // Partner app name
}

interface SignalAggregation {
  signal_id: string;
  signal_name: string;
  emoji: string;
  category: string;
  count: number;
}

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

async function authenticateAPIKey(
  apiKey: string,
  supabase: any
): Promise<APIKey | null> {
  if (!apiKey || !apiKey.startsWith('muvo_')) {
    return null;
  }

  // Hash the provided key
  const keyHash = createHmac('sha256', process.env.API_KEY_SECRET!)
    .update(apiKey)
    .digest('hex');

  // Look up in database
  const { data, error } = await supabase
    .from('api_keys')
    .select(`
      id,
      partner_id,
      rate_limit_per_hour,
      permissions,
      is_active,
      expires_at,
      partner:api_partners(status)
    `)
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  // Check if key is expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }

  // Check if partner is active
  if (data.partner.status !== 'active') {
    return null;
  }

  return data;
}

// ============================================
// RATE LIMITING
// ============================================

async function checkRateLimit(
  apiKeyId: string,
  limit: number,
  supabase: any
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_api_key_id: apiKeyId,
    p_limit: limit,
  });

  if (error) {
    console.error('Rate limit check error:', error);
    return false;
  }

  return data;
}

// ============================================
// LOG API USAGE
// ============================================

async function logAPIUsage(
  apiKeyId: string,
  partnerId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  ipAddress: string,
  userAgent: string,
  supabase: any
): Promise<void> {
  await supabase.from('api_usage').insert({
    api_key_id: apiKeyId,
    partner_id: partnerId,
    endpoint,
    method,
    status_code: statusCode,
    response_time_ms: responseTimeMs,
    ip_address: ipAddress,
    user_agent: userAgent,
  });
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * GET /api/v1/places
 * Search and list places
 * 
 * Query params:
 * - q: search query
 * - category: filter by category
 * - lat, lng, radius: nearby search
 * - limit, offset: pagination
 */
export async function getPlaces(req: Request): Promise<Response> {
  const startTime = Date.now();
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Authenticate
  const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing API key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authData = await authenticateAPIKey(apiKey, supabase);
  if (!authData) {
    return new Response(JSON.stringify({ error: 'Invalid API key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check permissions
  if (!authData.permissions.read) {
    return new Response(JSON.stringify({ error: 'Read permission required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check rate limit
  const withinLimit = await checkRateLimit(
    authData.id,
    authData.rate_limit_per_hour,
    supabase
  );
  if (!withinLimit) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse query params
  const url = new URL(req.url);
  const query = url.searchParams.get('q');
  const category = url.searchParams.get('category');
  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');
  const radius = url.searchParams.get('radius') || '10'; // km
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  // Build query
  let dbQuery = supabase
    .from('places')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1);

  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,city.ilike.%${query}%`);
  }

  if (category) {
    dbQuery = dbQuery.eq('category', category);
  }

  // Nearby search (requires PostGIS)
  if (lat && lng) {
    dbQuery = dbQuery.rpc('places_nearby', {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius_km: parseFloat(radius),
    });
  }

  const { data, error, count } = await dbQuery;

  // Log usage
  await logAPIUsage(
    authData.id,
    authData.partner_id,
    '/api/v1/places',
    'GET',
    error ? 500 : 200,
    Date.now() - startTime,
    req.headers.get('x-forwarded-for') || '',
    req.headers.get('user-agent') || '',
    supabase
  );

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      data,
      pagination: {
        total: count,
        limit,
        offset,
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * GET /api/v1/places/:id
 * Get single place with aggregated signals
 */
export async function getPlace(req: Request, placeId: string): Promise<Response> {
  const startTime = Date.now();
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Authenticate
  const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
  const authData = await authenticateAPIKey(apiKey!, supabase);
  if (!authData) {
    return new Response(JSON.stringify({ error: 'Invalid API key' }), {
      status: 401,
    });
  }

  // Check rate limit
  const withinLimit = await checkRateLimit(
    authData.id,
    authData.rate_limit_per_hour,
    supabase
  );
  if (!withinLimit) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
    });
  }

  // Get place
  const { data: place, error: placeError } = await supabase
    .from('places')
    .select('*')
    .eq('id', placeId)
    .single();

  if (placeError || !place) {
    return new Response(JSON.stringify({ error: 'Place not found' }), {
      status: 404,
    });
  }

  // Get aggregated signals
  const { data: signals } = await supabase
    .from('aggregated_signals')
    .select('*')
    .eq('place_id', placeId)
    .order('count', { ascending: false });

  // Get review stats
  const { count: reviewCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('place_id', placeId);

  // Log usage
  await logAPIUsage(
    authData.id,
    authData.partner_id,
    `/api/v1/places/${placeId}`,
    'GET',
    200,
    Date.now() - startTime,
    req.headers.get('x-forwarded-for') || '',
    req.headers.get('user-agent') || '',
    supabase
  );

  return new Response(
    JSON.stringify({
      place,
      signals,
      review_count: reviewCount,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * POST /api/v1/reviews
 * Submit a review from partner app
 */
export async function createReview(req: Request): Promise<Response> {
  const startTime = Date.now();
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Authenticate
  const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
  const authData = await authenticateAPIKey(apiKey!, supabase);
  if (!authData) {
    return new Response(JSON.stringify({ error: 'Invalid API key' }), {
      status: 401,
    });
  }

  // Check write permission
  if (!authData.permissions.write) {
    return new Response(JSON.stringify({ error: 'Write permission required' }), {
      status: 403,
    });
  }

  // Check rate limit
  const withinLimit = await checkRateLimit(
    authData.id,
    authData.rate_limit_per_hour,
    supabase
  );
  if (!withinLimit) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
    });
  }

  // Parse body
  const body: ReviewSubmission = await req.json();

  // Validate
  if (!body.place_id || !body.signals || body.signals.length === 0) {
    return new Response(
      JSON.stringify({ error: 'place_id and signals are required' }),
      { status: 400 }
    );
  }

  // Check if place exists
  const { data: place } = await supabase
    .from('places')
    .select('id')
    .eq('id', body.place_id)
    .single();

  if (!place) {
    return new Response(JSON.stringify({ error: 'Place not found' }), {
      status: 404,
    });
  }

  // Create review
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .insert({
      place_id: body.place_id,
      user_id: body.user_id || null,
      partner_id: authData.partner_id,
      source: 'api',
    })
    .select()
    .single();

  if (reviewError) {
    return new Response(JSON.stringify({ error: reviewError.message }), {
      status: 500,
    });
  }

  // Add signals
  const signalInserts = body.signals.map((signalId) => ({
    review_id: review.id,
    signal_id: signalId,
  }));

  const { error: signalsError } = await supabase
    .from('review_signals')
    .insert(signalInserts);

  if (signalsError) {
    // Rollback review
    await supabase.from('reviews').delete().eq('id', review.id);
    return new Response(JSON.stringify({ error: signalsError.message }), {
      status: 500,
    });
  }

  // Refresh aggregated signals
  await supabase.rpc('refresh_aggregated_signals');

  // Trigger webhooks (if any)
  await triggerWebhooks(authData.partner_id, 'review.created', review, supabase);

  // Log usage
  await logAPIUsage(
    authData.id,
    authData.partner_id,
    '/api/v1/reviews',
    'POST',
    201,
    Date.now() - startTime,
    req.headers.get('x-forwarded-for') || '',
    req.headers.get('user-agent') || '',
    supabase
  );

  return new Response(JSON.stringify({ review }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * GET /api/v1/signals
 * Get all available signals
 */
export async function getSignals(req: Request): Promise<Response> {
  const startTime = Date.now();
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Authenticate
  const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
  const authData = await authenticateAPIKey(apiKey!, supabase);
  if (!authData) {
    return new Response(JSON.stringify({ error: 'Invalid API key' }), {
      status: 401,
    });
  }

  // Get signals
  const { data, error } = await supabase
    .from('signals')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('name');

  // Log usage
  await logAPIUsage(
    authData.id,
    authData.partner_id,
    '/api/v1/signals',
    'GET',
    error ? 500 : 200,
    Date.now() - startTime,
    req.headers.get('x-forwarded-for') || '',
    req.headers.get('user-agent') || '',
    supabase
  );

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ signals: data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ============================================
// WEBHOOK SYSTEM
// ============================================

async function triggerWebhooks(
  partnerId: string,
  eventType: string,
  payload: any,
  supabase: any
): Promise<void> {
  // Get webhooks for this partner and event
  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('*')
    .eq('partner_id', partnerId)
    .eq('is_active', true)
    .contains('events', [eventType]);

  if (!webhooks || webhooks.length === 0) {
    return;
  }

  // Send to each webhook
  for (const webhook of webhooks) {
    try {
      // Create signature
      const signature = createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      // Send request
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MUVO-Signature': signature,
          'X-MUVO-Event': eventType,
        },
        body: JSON.stringify(payload),
      });

      // Log delivery
      await supabase.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        event_type: eventType,
        payload,
        response_status: response.status,
        response_body: await response.text(),
        delivered_at: response.ok ? new Date().toISOString() : null,
        failed_at: response.ok ? null : new Date().toISOString(),
      });
    } catch (error) {
      // Log failed delivery
      await supabase.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        event_type: eventType,
        payload,
        failed_at: new Date().toISOString(),
        retry_count: 0,
      });
    }
  }
}

// ============================================
// EXPORT HANDLERS
// ============================================

export const handlers = {
  getPlaces,
  getPlace,
  createReview,
  getSignals,
};
