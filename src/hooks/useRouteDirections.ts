import { useState, useCallback, useEffect } from 'react';

export interface RouteData {
  geometry: {
    coordinates: [number, number][];
    type: 'LineString';
  };
  distance: number; // meters
  duration: number; // seconds
}

interface UseRouteDirectionsOptions {
  mapboxToken: string;
  start: [number, number] | null;
  end: [number, number] | null;
}

export function useRouteDirections({ mapboxToken, start, end }: UseRouteDirectionsOptions) {
  const [route, setRoute] = useState<RouteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoute = useCallback(async () => {
    if (!start || !end || !mapboxToken) {
      setRoute(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?` +
        `geometries=geojson&overview=full&access_token=${mapboxToken}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch route');
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0];
        setRoute({
          geometry: routeData.geometry,
          distance: routeData.distance,
          duration: routeData.duration,
        });
      } else {
        setError('No route found');
        setRoute(null);
      }
    } catch (err) {
      console.error('Route fetch error:', err);
      setError('Failed to calculate route');
      setRoute(null);
    } finally {
      setIsLoading(false);
    }
  }, [mapboxToken, start, end]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  const clearRoute = useCallback(() => {
    setRoute(null);
    setError(null);
  }, []);

  return { route, isLoading, error, clearRoute };
}

// Calculate distance from a point to the nearest point on a route
export function distanceToRoute(
  point: [number, number],
  routeCoordinates: [number, number][]
): number {
  let minDistance = Infinity;

  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const segmentStart = routeCoordinates[i];
    const segmentEnd = routeCoordinates[i + 1];
    const distance = pointToSegmentDistance(point, segmentStart, segmentEnd);
    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
}

// Calculate distance from point to line segment (in miles)
function pointToSegmentDistance(
  point: [number, number],
  segmentStart: [number, number],
  segmentEnd: [number, number]
): number {
  const [px, py] = point;
  const [ax, ay] = segmentStart;
  const [bx, by] = segmentEnd;

  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;

  let t = 0;
  if (lengthSquared > 0) {
    t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  }

  const nearestX = ax + t * dx;
  const nearestY = ay + t * dy;

  return haversineDistance(py, px, nearestY, nearestX);
}

// Haversine formula for distance between two points (in miles)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
