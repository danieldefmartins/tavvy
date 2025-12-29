import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Maximize2, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';
import { formatDistanceToNow } from 'date-fns';
import { hapticLight } from '@/lib/haptics';

type PlaceCategory = Database['public']['Enums']['place_category'];

// Map place categories to appropriate Mapbox styles
function getMapStyle(category?: PlaceCategory): string {
  switch (category) {
    case 'National Park':
    case 'State Park':
    case 'County / Regional Park':
      return 'mapbox://styles/mapbox/outdoors-v12';
    case 'RV Campground':
    case 'Luxury RV Resort':
    case 'Fairgrounds / Event Grounds':
      return 'mapbox://styles/mapbox/outdoors-v12';
    case 'Boondocking':
    case 'Overnight Parking':
    case 'Rest Area / Travel Plaza':
      return 'mapbox://styles/mapbox/streets-v12';
    case 'Business Allowing Overnight':
      return 'mapbox://styles/mapbox/streets-v12';
    default:
      return 'mapbox://styles/mapbox/outdoors-v12';
  }
}

function formatVerifiedDate(date: string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return '';
  }
}

interface PlaceMiniMapProps {
  latitude: number;
  longitude: number;
  name: string;
  mapboxToken: string;
  category?: PlaceCategory;
  isVerified?: boolean;
  lastUpdated?: string;
  className?: string;
}

export function PlaceMiniMap({ 
  latitude, 
  longitude, 
  name, 
  mapboxToken, 
  category, 
  isVerified,
  lastUpdated,
  className 
}: PlaceMiniMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const navigate = useNavigate();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [nearbyRoad, setNearbyRoad] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: getMapStyle(category),
      center: [longitude, latitude],
      zoom: 13,
      interactive: false,
      attributionControl: false,
      dragPan: false,
      scrollZoom: false,
      boxZoom: false,
      dragRotate: false,
      keyboard: false,
      doubleClickZoom: false,
      touchZoomRotate: false,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Add marker with pulse animation (avoid innerHTML)
    const el = document.createElement('div');
    el.className = 'place-mini-map-marker';

    const pulseRing = document.createElement('div');
    pulseRing.className = 'marker-pulse-ring';

    const pin = document.createElement('div');
    pin.className = 'marker-pin';

    const svgDoc = new DOMParser().parseFromString(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
         <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
         <circle cx="12" cy="10" r="3"/>
       </svg>`,
      'image/svg+xml'
    );
    const svgEl = svgDoc.documentElement;
    svgEl.setAttribute('aria-hidden', 'true');

    pin.appendChild(svgEl);
    el.appendChild(pulseRing);
    el.appendChild(pin);

    new mapboxgl.Marker({ element: el })
      .setLngLat([longitude, latitude])
      .addTo(map.current);

    return () => {
      map.current?.remove();
    };
  }, [latitude, longitude, mapboxToken, category]);

  // Fetch nearby road info using Mapbox Geocoding API
  useEffect(() => {
    if (!mapboxToken || !mapLoaded) return;

    const fetchNearbyRoad = async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=address,locality,neighborhood&limit=1&access_token=${mapboxToken}`
        );
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          // Extract road/locality name
          const placeName = feature.text || feature.place_name?.split(',')[0];
          if (placeName && placeName.length < 30) {
            setNearbyRoad(placeName);
          }
        }
      } catch (error) {
        // Silently fail - road info is optional
        console.debug('Could not fetch nearby road info');
      }
    };

    fetchNearbyRoad();
  }, [latitude, longitude, mapboxToken, mapLoaded]);

  const handleClick = () => {
    hapticLight();
    navigate(`/map?lat=${latitude}&lng=${longitude}&zoom=14`);
  };

  const verifiedText = lastUpdated ? formatVerifiedDate(lastUpdated) : null;

  return (
    <>
      {/* Marker animation styles */}
      <style>{`
        .place-mini-map-marker {
          position: relative;
          width: 32px;
          height: 32px;
        }
        .marker-pin {
          position: absolute;
          inset: 0;
          width: 32px;
          height: 32px;
          background: hsl(142, 76%, 36%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          border: 2px solid white;
          z-index: 2;
        }
        .marker-pin svg {
          width: 16px;
          height: 16px;
        }
        .marker-pulse-ring {
          position: absolute;
          inset: -8px;
          width: 48px;
          height: 48px;
          background: hsl(142, 76%, 36%);
          border-radius: 50%;
          opacity: 0;
          z-index: 1;
          animation: marker-pulse 1s ease-out forwards;
        }
        @keyframes marker-pulse {
          0% {
            transform: scale(0.5);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
      
      <div
        className={cn(
          'relative w-full h-40 rounded-lg overflow-hidden cursor-pointer group border border-border',
          className
        )}
        onClick={handleClick}
      >
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Top gradient for badges */}
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-background/50 to-transparent pointer-events-none" />
        
        {/* Bottom gradient overlay for contrast */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/70 to-transparent pointer-events-none" />
        
        {/* Verified/Updated badge - top left */}
        {(isVerified || verifiedText) && (
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-border">
              <span className="text-[10px] font-medium flex items-center gap-1 text-muted-foreground">
                {isVerified ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span className="text-green-700">Verified</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3" />
                    <span>Updated {verifiedText}</span>
                  </>
                )}
              </span>
            </div>
          </div>
        )}
        
        {/* Nearby road label - bottom left */}
        {nearbyRoad && (
          <div className="absolute bottom-2 left-2 z-10">
            <div className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-border max-w-[140px]">
              <span className="text-[10px] font-medium text-muted-foreground truncate block">
                Near {nearbyRoad}
              </span>
            </div>
          </div>
        )}
        
        {/* Always visible CTA label - bottom right */}
        <div className="absolute bottom-2 right-2 z-10">
          <div className="bg-background/95 backdrop-blur-sm px-2.5 py-1.5 rounded-md shadow-md border border-border group-hover:bg-background group-hover:shadow-lg transition-all">
            <span className="text-xs font-medium flex items-center gap-1.5 text-foreground">
              <Maximize2 className="w-3 h-3" />
              Expand map
            </span>
          </div>
        </div>
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors pointer-events-none" />
      </div>
    </>
  );
}

// Fallback when no token available
export function PlaceMiniMapPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative w-full h-40 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border',
        className
      )}
    >
      <div className="text-center">
        <MapPin className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
        <span className="text-xs text-muted-foreground">Map preview</span>
      </div>
    </div>
  );
}
