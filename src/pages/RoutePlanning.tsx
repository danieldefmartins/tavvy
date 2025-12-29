import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { PlacesMap, PlacesMapRef } from '@/components/PlacesMap';
import { RoutePanel, RouteLocation } from '@/components/RoutePanel';
import { usePlaces } from '@/hooks/usePlaces';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { useRouteDirections, distanceToRoute } from '@/hooks/useRouteDirections';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import mapboxgl from 'mapbox-gl';

const RoutePlanning = () => {
  const { data: places } = usePlaces();
  const { data: mapboxToken, isLoading: isLoadingToken, error: tokenError } = useMapboxToken();
  const mapRef = useRef<PlacesMapRef>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);

  const [start, setStart] = useState<RouteLocation | null>(null);
  const [end, setEnd] = useState<RouteLocation | null>(null);
  const [bufferDistance, setBufferDistance] = useState(20); // miles

  const { route, isLoading: isLoadingRoute, clearRoute } = useRouteDirections({
    mapboxToken: mapboxToken || '',
    start: start?.coordinates || null,
    end: end?.coordinates || null,
  });

  // Filter places within buffer distance of route
  const placesAlongRoute = useMemo(() => {
    if (!places || !route?.geometry.coordinates) return [];

    return places.filter((place) => {
      const distance = distanceToRoute(
        [place.longitude, place.latitude],
        route.geometry.coordinates
      );
      return distance <= bufferDistance;
    });
  }, [places, route, bufferDistance]);

  // Draw route on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !route) return;

    // Wait for map style to load
    const addRoute = () => {
      // Remove existing route if any
      if (map.getSource('route')) {
        map.removeLayer('route-line');
        map.removeSource('route');
      }

      // Add route source and layer
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: route.geometry,
        },
      });

      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 5,
          'line-opacity': 0.8,
        },
      });

      // Fit map to route bounds
      const coordinates = route.geometry.coordinates;
      const bounds = coordinates.reduce(
        (bounds, coord) => bounds.extend(coord as [number, number]),
        new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
      );

      map.fitBounds(bounds, {
        padding: { top: 100, bottom: 50, left: 50, right: 50 },
        duration: 1000,
      });
    };

    if (map.isStyleLoaded()) {
      addRoute();
    } else {
      map.on('style.load', addRoute);
    }

    return () => {
      if (map.getSource('route')) {
        try {
          map.removeLayer('route-line');
          map.removeSource('route');
        } catch (e) {
          // Layer may already be removed
        }
      }
    };
  }, [route]);

  // Clear route from map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || route) return;

    // Remove route if cleared
    if (map.getSource('route')) {
      try {
        map.removeLayer('route-line');
        map.removeSource('route');
      } catch (e) {
        // Layer may already be removed
      }
    }
  }, [route]);

  const handleClearRoute = useCallback(() => {
    setStart(null);
    setEnd(null);
    clearRoute();
  }, [clearRoute]);

  // Capture map instance
  const handleMapLoad = useCallback((mapInstance: mapboxgl.Map) => {
    mapInstanceRef.current = mapInstance;
  }, []);

  const isLoading = isLoadingToken;

  return (
    <div 
      className="bg-background flex flex-col overflow-hidden"
      style={{ 
        height: '100dvh',
        minHeight: '-webkit-fill-available',
      }}
    >
      <Header showBack />

      {/* Full-screen map */}
      <div className="flex-1 relative min-h-0">
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
            <div className="text-center">
              <Skeleton className="w-12 h-12 rounded-full mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {tokenError && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
            <div className="text-center p-6 max-w-sm">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Map Unavailable</h3>
              <p className="text-sm text-muted-foreground">
                The map couldn't be loaded. Please try again later.
              </p>
            </div>
          </div>
        )}

        {/* Map */}
        {mapboxToken && !isLoading && !tokenError && (
          <PlacesMapWithRoute
            ref={mapRef}
            places={placesAlongRoute}
            allPlaces={places || []}
            mapboxToken={mapboxToken}
            className="h-full w-full"
            route={route}
            onMapLoad={handleMapLoad}
          />
        )}

        {/* Route panel - properly positioned */}
        {mapboxToken && !isLoading && (
          <div className="absolute top-3 left-3 z-20 w-[calc(100%-1.5rem)] max-w-sm">
            <RoutePanel
              mapboxToken={mapboxToken}
              start={start}
              end={end}
              onStartChange={setStart}
              onEndChange={setEnd}
              bufferDistance={bufferDistance}
              onBufferDistanceChange={setBufferDistance}
              onClearRoute={handleClearRoute}
              placesInRange={placesAlongRoute.length}
              isLoading={isLoadingRoute}
            />
          </div>
        )}

        {/* Route info - positioned above safe area */}
        {route && (
          <div 
            className="absolute left-3 z-10"
            style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <div className="bg-background/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md border border-border">
              <p className="text-sm font-medium">
                {(route.distance / 1609.34).toFixed(0)} miles • {formatDuration(route.duration)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper to format duration
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}

// Extended PlacesMap component with route support
import { forwardRef, useImperativeHandle } from 'react';
import { Place } from '@/hooks/usePlaces';
import { PlaceMapCard } from '@/components/PlaceMapCard';
import { MapSearchBox } from '@/components/MapSearchBox';
import { createRoot, Root } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Loader2, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Supercluster from 'supercluster';
import { RouteData } from '@/hooks/useRouteDirections';

interface PlacesMapWithRouteProps {
  places: Place[];
  allPlaces: Place[];
  mapboxToken: string;
  className?: string;
  route: RouteData | null;
  onMapLoad?: (map: mapboxgl.Map) => void;
}

const popupQueryClient = new QueryClient();

interface PointProperties {
  cluster: boolean;
  placeId?: string;
  place?: Place;
  point_count?: number;
  point_count_abbreviated?: string;
}

const PlacesMapWithRoute = forwardRef<PlacesMapRef, PlacesMapWithRouteProps>(
  function PlacesMapWithRoute({ places, allPlaces, mapboxToken, className, route, onMapLoad }, ref) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const popupRef = useRef<mapboxgl.Popup | null>(null);
    const popupRootRef = useRef<Root | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const clusterRef = useRef<Supercluster<PointProperties, PointProperties> | null>(null);

    // Expose map ref
    useImperativeHandle(ref, () => ({
      flyTo: (lng: number, lat: number, zoom?: number) => {
        map.current?.flyTo({ center: [lng, lat], zoom: zoom || 14, duration: 1000 });
      },
      openPopup: (placeId: string) => {
        // Implementation
      },
      selectPlace: (placeId: string, centerOnPlace?: boolean) => {
        // Not used in route planning
      },
      getCenter: () => {
        if (map.current) {
          const center = map.current.getCenter();
          return { lng: center.lng, lat: center.lat };
        }
        return null;
      },
    }), []);

    // Create supercluster
    const cluster = useMemo(() => {
      const sc = new Supercluster<PointProperties, PointProperties>({ radius: 60, maxZoom: 14 });
      const points: Supercluster.PointFeature<PointProperties>[] = places.map((place) => ({
        type: 'Feature',
        properties: { cluster: false, placeId: place.id, place },
        geometry: { type: 'Point', coordinates: [place.longitude, place.latitude] },
      }));
      sc.load(points);
      clusterRef.current = sc;
      return sc;
    }, [places]);

    // Request location
    const requestLocation = useCallback(() => {
      if (!navigator.geolocation) return;
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
          setUserLocation(coords);
          setIsLocating(false);
          map.current?.flyTo({ center: coords, zoom: 10, duration: 1500 });
        },
        () => setIsLocating(false),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }, []);

    // Open popup for place
    const openPopupForPlace = useCallback((place: Place, lng: number, lat: number) => {
      if (!map.current) return;
      popupRef.current?.remove();
      popupRootRef.current?.unmount();

      const popupContainer = document.createElement('div');
      popupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: true,
        maxWidth: 'none',
        offset: 25,
        className: 'place-popup',
      })
        .setLngLat([lng, lat])
        .setDOMContent(popupContainer)
        .addTo(map.current);

      popupRootRef.current = createRoot(popupContainer);
      popupRootRef.current.render(
        <QueryClientProvider client={popupQueryClient}>
          <BrowserRouter>
            <PlaceMapCard place={place} onClose={() => popupRef.current?.remove()} />
          </BrowserRouter>
        </QueryClientProvider>
      );
    }, []);

    // Update markers
    const updateMarkers = useCallback(() => {
      if (!map.current || !clusterRef.current) return;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      popupRef.current?.remove();
      popupRootRef.current?.unmount();

      const bounds = map.current.getBounds();
      const zoom = Math.floor(map.current.getZoom());
      const clusters = clusterRef.current.getClusters(
        [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
        zoom
      );

      clusters.forEach((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties;

        if (props.cluster) {
          const count = props.point_count || 0;
          const size = count < 10 ? 40 : count < 50 ? 48 : 56;
          const el = document.createElement('div');
          el.className = 'map-cluster-marker';
          el.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: hsl(var(--primary));
            color: white;
            font-weight: 600;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 3px solid white;
            cursor: pointer;
            z-index: 100;
          `;
          el.textContent = String(props.point_count_abbreviated || count);
          el.addEventListener('click', () => {
            const clusterId = (feature as Supercluster.ClusterFeature<PointProperties>).id as number;
            const expansionZoom = clusterRef.current!.getClusterExpansionZoom(clusterId);
            map.current?.flyTo({ center: [lng, lat], zoom: expansionZoom, duration: 500 });
          });
          const marker = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map.current!);
          markersRef.current.push(marker);
        } else {
          const place = props.place!;
          const el = document.createElement('div');
          el.className = 'map-place-marker';
          el.style.cssText = `
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: hsl(var(--primary));
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            border: 3px solid white;
            cursor: pointer;
            z-index: 100;
            transition: transform 0.15s ease;
          `;
          // Avoid innerHTML: parse trusted SVG string and append
          const svgDoc = new DOMParser().parseFromString(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>`,
            'image/svg+xml'
          );
          const svgEl = svgDoc.documentElement;
          svgEl.setAttribute('aria-hidden', 'true');
          el.appendChild(svgEl);
          el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.15)'; });
          el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });
          el.addEventListener('click', () => openPopupForPlace(place, lng, lat));
          const marker = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map.current!);
          markersRef.current.push(marker);
        }
      });
    }, [openPopupForPlace]);

    // Initialize map
    useEffect(() => {
      if (!mapContainer.current || !mapboxToken) return;

      mapboxgl.accessToken = mapboxToken;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [-98.5, 39.8],
        zoom: 3,
      });

      map.current.on('load', () => {
        updateMarkers();
        onMapLoad?.(map.current!);
      });
      map.current.on('moveend', updateMarkers);
      map.current.on('zoomend', updateMarkers);
      map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), 'top-right');

      return () => {
        markersRef.current.forEach((m) => m.remove());
        popupRef.current?.remove();
        popupRootRef.current?.unmount();
        userMarkerRef.current?.remove();
        map.current?.remove();
      };
    }, [mapboxToken, updateMarkers, onMapLoad]);

    // Update user marker
    useEffect(() => {
      if (!map.current || !userLocation) return;
      userMarkerRef.current?.remove();
      const el = document.createElement('div');

      const wrapper = document.createElement('div');
      wrapper.className = 'relative';

      const dot = document.createElement('div');
      dot.className = 'w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg';

      const ping = document.createElement('div');
      ping.className = 'absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75';

      wrapper.appendChild(dot);
      wrapper.appendChild(ping);
      el.appendChild(wrapper);

      userMarkerRef.current = new mapboxgl.Marker({ element: el }).setLngLat(userLocation).addTo(map.current);
    }, [userLocation]);

    // Update markers when places change
    useEffect(() => {
      if (!map.current || places.length === 0) return;
      if (map.current.loaded()) {
        updateMarkers();
      } else {
        map.current.on('load', updateMarkers);
      }
    }, [places, updateMarkers]);

    // Draw route on map
    useEffect(() => {
      if (!map.current || !route) return;

      const addRoute = () => {
        if (!map.current) return;
        if (map.current.getSource('route')) {
          try {
            map.current.removeLayer('route-line');
            map.current.removeSource('route');
          } catch (e) {}
        }

        map.current.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: route.geometry },
        });

        map.current.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 0.8 },
        });

        // Fit to route
        const coords = route.geometry.coordinates;
        const bounds = coords.reduce(
          (b, c) => b.extend(c as [number, number]),
          new mapboxgl.LngLatBounds(coords[0], coords[0])
        );
        map.current.fitBounds(bounds, { padding: { top: 150, bottom: 80, left: 50, right: 50 }, duration: 1000 });
      };

      if (map.current.isStyleLoaded()) {
        addRoute();
      } else {
        map.current.on('style.load', addRoute);
      }

      return () => {
        if (map.current?.getSource('route')) {
          try {
            map.current.removeLayer('route-line');
            map.current.removeSource('route');
          } catch (e) {}
        }
      };
    }, [route]);

    return (
      <div className={cn('relative w-full h-full', className)}>
        <div ref={mapContainer} className="absolute inset-0" />
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-4 right-4 z-10 shadow-lg"
          onClick={requestLocation}
          disabled={isLocating}
        >
          {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
        </Button>
        <style>{`
          .place-popup .mapboxgl-popup-content { padding: 0; background: transparent; box-shadow: none; }
          .place-popup .mapboxgl-popup-tip { display: none; }
          .mapboxgl-popup { z-index: 200 !important; }
          .mapboxgl-marker { z-index: 100 !important; }
          .map-cluster-marker, .map-place-marker { position: relative; z-index: 100; }
          .user-location-marker { z-index: 90; }
          .mapboxgl-ctrl-top-right { z-index: 50 !important; }
        `}</style>
      </div>
    );
  }
);

export default RoutePlanning;
