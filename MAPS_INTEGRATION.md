# Maps Integration Guide for MUVO

## Overview

MUVO needs maps functionality to help users find places (restaurants, RV parks, hotels, etc.) near their location. This document outlines the recommended approach for integrating maps into your Lovable deployment.

---

## Recommended Solution: Google Maps JavaScript API

### Why Google Maps?
- **Comprehensive** - Places API, Geocoding, Directions all in one
- **Reliable** - Industry standard with 99.9% uptime
- **Mobile-optimized** - Works great on mobile (99.9% of MUVO users)
- **Free tier** - $200/month credit covers ~28,000 map loads

---

## Setup Steps

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials → API Key
5. Restrict the API key:
   - **Application restrictions**: HTTP referrers
   - **API restrictions**: Select only the 3 APIs above
   - **Website restrictions**: Add your Lovable domain

### 2. Add to Lovable Environment Variables

In your Lovable project settings, add:
```
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

---

## Implementation

### Basic Map Component

```tsx
import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface MapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  places?: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
  }>;
}

export function Map({ center = { lat: 39.8283, lng: -98.5795 }, zoom = 4, places = [] }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      version: 'weekly',
    });

    loader.load().then(() => {
      if (mapRef.current) {
        const googleMap = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          styles: [
            // Optional: Custom map styling
          ],
        });
        setMap(googleMap);
      }
    });
  }, []);

  // Add markers when places change
  useEffect(() => {
    if (!map || places.length === 0) return;

    const markers = places.map(place => {
      const marker = new google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map,
        title: place.name,
      });

      marker.addListener('click', () => {
        // Navigate to place detail
        window.location.href = `/place/${place.id}`;
      });

      return marker;
    });

    return () => {
      markers.forEach(marker => marker.setMap(null));
    };
  }, [map, places]);

  return <div ref={mapRef} className="w-full h-full" />;
}
```

---

## Key Features to Implement

### 1. Find Places Near Me

```tsx
// Get user's current location
navigator.geolocation.getCurrentPosition(
  (position) => {
    const userLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
    
    // Query Supabase for nearby places
    // Use PostGIS distance calculation or simple lat/lng filtering
  },
  (error) => {
    console.error('Location access denied');
  }
);
```

### 2. Search by Address/City

```tsx
// Use Google Geocoding API
const geocoder = new google.maps.Geocoder();

geocoder.geocode({ address: searchQuery }, (results, status) => {
  if (status === 'OK' && results[0]) {
    const location = results[0].geometry.location;
    map.setCenter(location);
    // Query nearby places from Supabase
  }
});
```

### 3. Place Autocomplete

```tsx
import { Autocomplete } from '@react-google-maps/api';

<Autocomplete
  onLoad={(autocomplete) => setAutocomplete(autocomplete)}
  onPlaceChanged={() => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      // Use place.geometry.location for lat/lng
    }
  }}
>
  <input
    type="text"
    placeholder="Search for a place..."
    className="..."
  />
</Autocomplete>
```

---

## Database Queries for Nearby Places

### Using PostGIS (Recommended)

```sql
-- In Supabase, enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography column
ALTER TABLE places 
ADD COLUMN location GEOGRAPHY(POINT, 4326);

-- Update location from lat/lng
UPDATE places 
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);

-- Query places within radius (in meters)
SELECT 
  *,
  ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) AS distance
FROM places
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint($1, $2), 4326),
  $3 -- radius in meters (e.g., 50000 for 50km)
)
ORDER BY distance
LIMIT 50;
```

### Simple Lat/Lng Filtering (Alternative)

```sql
-- Less accurate but simpler
-- Approximate: 1 degree ≈ 111km
SELECT *
FROM places
WHERE 
  latitude BETWEEN $1 - 0.5 AND $1 + 0.5
  AND longitude BETWEEN $2 - 0.5 AND $2 + 0.5
ORDER BY 
  (latitude - $1) * (latitude - $1) + 
  (longitude - $2) * (longitude - $2)
LIMIT 50;
```

---

## Mobile Optimization

### 1. Touch-friendly Controls

```tsx
<Map
  options={{
    gestureHandling: 'greedy', // Allow one-finger panning
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  }}
/>
```

### 2. Bottom Sheet for Place Cards

Use a bottom sheet component to show place cards over the map:
- Swipe up to expand
- Tap card to view details
- Keeps map visible while browsing

### 3. Current Location Button

```tsx
<button
  onClick={() => {
    navigator.geolocation.getCurrentPosition((position) => {
      map?.panTo({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      map?.setZoom(12);
    });
  }}
  className="absolute bottom-20 right-4 bg-white p-3 rounded-full shadow-lg"
>
  <MapPin className="w-6 h-6" />
</button>
```

---

## Alternative: Mapbox

If you prefer Mapbox over Google Maps:

### Pros:
- More customizable styling
- Better performance on mobile
- Generous free tier (50,000 loads/month)

### Cons:
- Places API not as comprehensive
- Requires separate geocoding service

### Setup:
```bash
npm install mapbox-gl
```

```tsx
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const map = new mapboxgl.Map({
  container: mapRef.current,
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [lng, lat],
  zoom: 9,
});
```

---

## Cost Estimation

### Google Maps Pricing (after $200 free credit):
- Map loads: $7 per 1,000 loads
- Places API: $17 per 1,000 requests
- Geocoding: $5 per 1,000 requests

**For 10,000 monthly users:**
- ~20,000 map loads = $140
- ~5,000 place searches = $85
- ~2,000 geocoding = $10
- **Total: $235/month** (covered by $200 credit + $35)

### Mapbox Pricing:
- First 50,000 loads free
- Then $5 per 1,000 loads
- **For 10,000 users: FREE**

---

## Recommended Approach

1. **Start with Google Maps** - It's the most comprehensive and reliable
2. **Use PostGIS in Supabase** - For efficient nearby place queries
3. **Implement bottom sheet UI** - For mobile-first experience
4. **Add filters** - Category, radius, rating threshold
5. **Cache map tiles** - For better performance

---

## Next Steps for Lovable

1. Install Google Maps package:
   ```bash
   npm install @googlemaps/js-api-loader
   ```

2. Add API key to environment variables

3. Create Map component using the code above

4. Create MapView page that:
   - Shows map with place markers
   - Has search bar at top
   - Has bottom sheet with place cards
   - Has "Current Location" button
   - Has category filters

5. Connect to Supabase to fetch places

6. Add routing: `/map` → MapView page
