import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

function buildCorsHeaders(req: Request) {
  const allowed = Deno.env.get("MAPBOX_ALLOWED_ORIGINS") ?? "";
  const allowList = allowed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const origin = req.headers.get("origin");

  // Default behavior remains permissive to avoid breaking existing clients.
  // If MAPBOX_ALLOWED_ORIGINS is set, we restrict CORS to that allowlist.
  const allowOrigin =
    allowList.length > 0
      ? origin && allowList.includes(origin)
        ? origin
        : ""
      : "*";

  const base: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (allowOrigin) {
    return {
      ...base,
      "Access-Control-Allow-Origin": allowOrigin,
      Vary: "Origin",
    };
  }

  return base;
}

// NOTE: Mapbox public tokens are meant to be used client-side.
// This function exists to keep the token out of the repository and allow rotation.
// To reduce token scraping/abuse, we apply lightweight rate limiting.

type RateLimitEntry = {
  windowStart: number;
  count: number;
};

// In-memory per-instance limiter (best-effort; resets on cold start).
const rateLimitByIp = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120; // per IP per minute

function getClientIp(req: Request): string {
  // Best-effort: edge typically sets x-forwarded-for.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const existing = rateLimitByIp.get(ip);

  if (!existing || now - existing.windowStart >= WINDOW_MS) {
    rateLimitByIp.set(ip, { windowStart: now, count: 1 });
    return false;
  }

  existing.count += 1;
  rateLimitByIp.set(ip, existing);
  return existing.count > MAX_REQUESTS_PER_WINDOW;
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ip = getClientIp(req);

    if (isRateLimited(ip)) {
      console.warn(`get-mapbox-token: rate limited ip=${ip}`);
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mapbox public tokens are designed for client-side use and are safe to expose
    // when restricted by domain/referrer settings in the Mapbox dashboard.
    const mapboxToken = Deno.env.get("MAPBOX_PUBLIC_TOKEN");

    if (!mapboxToken) {
      console.error("get-mapbox-token: MAPBOX_PUBLIC_TOKEN not configured");
      return new Response(JSON.stringify({ error: "Mapbox token not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ token: mapboxToken }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        // Cache in browser/CDN to reduce repeated calls.
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in get-mapbox-token:", message);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
