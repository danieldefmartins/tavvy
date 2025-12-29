import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReverseGeocodeResult {
  county: string | null;
  county_normalized: string | null;
  county_confidence: string;
  county_notes: string | null;
}

async function reverseGeocode(lat: number, lng: number, mapboxToken: string): Promise<ReverseGeocodeResult> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=district&access_token=${mapboxToken}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        county: null,
        county_normalized: null,
        county_confidence: "low",
        county_notes: `Mapbox API error: ${response.status}`,
      };
    }

    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      return {
        county: null,
        county_normalized: null,
        county_confidence: "low",
        county_notes: "No district/county found in reverse geocode response",
      };
    }

    // Get the first (most relevant) district result
    const feature = data.features[0];
    let countyName = feature.text || feature.place_name?.split(",")[0];
    
    if (!countyName) {
      return {
        county: null,
        county_normalized: null,
        county_confidence: "low",
        county_notes: "Could not extract county name from response",
      };
    }

    // In the US, ensure "County" is appended if not present
    const isUS = feature.context?.some((c: any) => 
      c.id?.startsWith("country") && (c.short_code === "us" || c.text === "United States")
    );
    
    if (isUS && !countyName.toLowerCase().includes("county") && !countyName.toLowerCase().includes("parish")) {
      countyName = `${countyName} County`;
    }

    const confidence = feature.relevance >= 0.9 ? "high" : feature.relevance >= 0.7 ? "medium" : "low";

    return {
      county: countyName,
      county_normalized: countyName.toLowerCase(),
      county_confidence: confidence,
      county_notes: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      county: null,
      county_normalized: null,
      county_confidence: "low",
      county_notes: `Reverse geocode error: ${message}`,
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mapboxToken = Deno.env.get("MAPBOX_PUBLIC_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!mapboxToken || !supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error("Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's auth to verify identity and check admin role
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      console.error("Authentication failed:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify admin role using the has_role RPC function
    const { data: isAdmin, error: roleError } = await supabaseAuth.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.error("Admin access denied for user:", user.id);
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin access verified for user:", user.id);

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, placeId, batchSize = 50, staleThresholdDays = 180 } = await req.json();

    if (action === "enrich_single" && placeId) {
      // Enrich a single place
      const { data: place, error: fetchError } = await supabase
        .from("places")
        .select("id, latitude, longitude, county, county_source")
        .eq("id", placeId)
        .single();

      if (fetchError || !place) {
        return new Response(
          JSON.stringify({ error: "Place not found", details: fetchError?.message }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!place.latitude || !place.longitude) {
        return new Response(
          JSON.stringify({ error: "Place has no coordinates" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await reverseGeocode(place.latitude, place.longitude, mapboxToken);
      
      const { error: updateError } = await supabase
        .from("places")
        .update({
          county: result.county,
          county_normalized: result.county_normalized,
          county_source: "mapbox_reverse_geocode",
          county_confidence: result.county_confidence,
          county_notes: result.county_notes,
          county_last_enriched_at: new Date().toISOString(),
        })
        .eq("id", placeId);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to update place", details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, result }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "backfill_missing") {
      // Find places missing county data
      const { data: places, error: fetchError } = await supabase
        .from("places")
        .select("id, latitude, longitude")
        .is("county", null)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(batchSize);

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch places", details: fetchError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const results = { processed: 0, succeeded: 0, failed: 0, failedIds: [] as string[] };

      for (const place of places || []) {
        results.processed++;
        const result = await reverseGeocode(place.latitude, place.longitude, mapboxToken);
        
        const { error: updateError } = await supabase
          .from("places")
          .update({
            county: result.county,
            county_normalized: result.county_normalized,
            county_source: "mapbox_reverse_geocode",
            county_confidence: result.county_confidence,
            county_notes: result.county_notes,
            county_last_enriched_at: new Date().toISOString(),
          })
          .eq("id", place.id);

        if (updateError || !result.county) {
          results.failed++;
          results.failedIds.push(place.id);
        } else {
          results.succeeded++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Get total count of places still needing enrichment
      const { count: remaining } = await supabase
        .from("places")
        .select("id", { count: "exact", head: true })
        .is("county", null)
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      return new Response(
        JSON.stringify({ success: true, ...results, remaining: remaining || 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "re_enrich_stale") {
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - staleThresholdDays);

      const { data: places, error: fetchError } = await supabase
        .from("places")
        .select("id, latitude, longitude")
        .lt("county_last_enriched_at", staleDate.toISOString())
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(batchSize);

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch stale places", details: fetchError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const results = { processed: 0, succeeded: 0, failed: 0, failedIds: [] as string[] };

      for (const place of places || []) {
        results.processed++;
        const result = await reverseGeocode(place.latitude, place.longitude, mapboxToken);
        
        const { error: updateError } = await supabase
          .from("places")
          .update({
            county: result.county,
            county_normalized: result.county_normalized,
            county_source: "mapbox_reverse_geocode",
            county_confidence: result.county_confidence,
            county_notes: result.county_notes,
            county_last_enriched_at: new Date().toISOString(),
          })
          .eq("id", place.id);

        if (updateError || !result.county) {
          results.failed++;
          results.failedIds.push(place.id);
        } else {
          results.succeeded++;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const { count: remaining } = await supabase
        .from("places")
        .select("id", { count: "exact", head: true })
        .lt("county_last_enriched_at", staleDate.toISOString())
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      return new Response(
        JSON.stringify({ success: true, ...results, remaining: remaining || 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_stats") {
      const [missingResult, staleResult, totalResult] = await Promise.all([
        supabase
          .from("places")
          .select("id", { count: "exact", head: true })
          .is("county", null)
          .not("latitude", "is", null)
          .not("longitude", "is", null),
        supabase
          .from("places")
          .select("id", { count: "exact", head: true })
          .lt("county_last_enriched_at", new Date(Date.now() - staleThresholdDays * 24 * 60 * 60 * 1000).toISOString())
          .not("latitude", "is", null)
          .not("longitude", "is", null),
        supabase
          .from("places")
          .select("id", { count: "exact", head: true }),
      ]);

      return new Response(
        JSON.stringify({
          missingCount: missingResult.count || 0,
          staleCount: staleResult.count || 0,
          totalPlaces: totalResult.count || 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: enrich_single, backfill_missing, re_enrich_stale, or get_stats" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in enrich-county:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});