import { useRef, useEffect, useCallback } from 'react';
import { Place } from '@/hooks/usePlaces';
import { cn } from '@/lib/utils';
import { MapPinOff } from 'lucide-react';
import { MapFloatingCard } from './MapFloatingCard';

interface MapPlaceCarouselProps {
  places: Place[];
  selectedPlaceId: string | null;
  onPlaceSelect: (place: Place) => void;
  mapCenter?: { lng: number; lat: number };
  className?: string;
}

// Calculate distance from center
function distanceFromCenter(place: Place, center?: { lng: number; lat: number }): number {
  if (!center) return 0;
  const R = 3959; // Earth's radius in miles
  const dLat = ((place.latitude - center.lat) * Math.PI) / 180;
  const dLng = ((place.longitude - center.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((center.lat * Math.PI) / 180) *
      Math.cos((place.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function MapPlaceCarousel({ 
  places, 
  selectedPlaceId, 
  onPlaceSelect,
  mapCenter,
  className 
}: MapPlaceCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Sort places by distance from center
  const sortedPlaces = [...places].sort((a, b) => {
    const distA = distanceFromCenter(a, mapCenter);
    const distB = distanceFromCenter(b, mapCenter);
    return distA - distB;
  }).slice(0, 15);

  // Scroll to selected place card
  useEffect(() => {
    if (selectedPlaceId && containerRef.current) {
      const card = cardRefs.current.get(selectedPlaceId);
      if (card) {
        card.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [selectedPlaceId]);

  const setCardRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(id, el);
    } else {
      cardRefs.current.delete(id);
    }
  }, []);

  // Empty state - floating pill
  if (sortedPlaces.length === 0) {
    return (
      <div className={cn('px-4 pb-2', className)}>
        <div 
          className="flex items-center justify-center gap-2 py-2 px-4 bg-card/95 backdrop-blur-md rounded-full text-muted-foreground mx-auto w-fit"
          style={{ boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.25)' }}
        >
          <MapPinOff className="w-4 h-4" />
          <span className="text-sm">No places here. Zoom out or move the map.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('pb-2', className)}>
      {/* Floating horizontal scroll carousel - no background */}
      <div 
        ref={containerRef}
        className="flex gap-3 overflow-x-auto px-4 snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
        {sortedPlaces.map((place) => {
          const dist = mapCenter ? distanceFromCenter(place, mapCenter) : place.distance;
          return (
            <div
              key={place.id}
              ref={(el) => setCardRef(place.id, el)}
              className="snap-center"
            >
              <MapFloatingCard
                place={place}
                isSelected={selectedPlaceId === place.id}
                onSelect={() => onPlaceSelect(place)}
                distance={dist}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
