import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Place } from '@/hooks/usePlaces';
import { cn } from '@/lib/utils';
import { hapticLight } from '@/lib/haptics';
import { MapPin, ShieldCheck, ChevronRight } from 'lucide-react';
import { getCategoryColor } from '@/lib/categoryColors';

interface MapPlaceCardsProps {
  places: Place[];
  selectedPlaceId: string | null;
  onPlaceSelect: (place: Place) => void;
  mapCenter?: { lng: number; lat: number };
}

function distanceFromCenter(place: Place, center?: { lng: number; lat: number }): number {
  if (!center) return place.distance || 0;
  const R = 3959;
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

export function MapPlaceCards({ places, selectedPlaceId, onPlaceSelect, mapCenter }: MapPlaceCardsProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Sort places by distance from map center
  const sortedPlaces = [...places].sort((a, b) => 
    distanceFromCenter(a, mapCenter) - distanceFromCenter(b, mapCenter)
  ).slice(0, 20); // Limit to 20 nearest

  // Scroll to selected card when it changes
  useEffect(() => {
    if (selectedPlaceId && cardRefs.current.has(selectedPlaceId)) {
      const card = cardRefs.current.get(selectedPlaceId);
      card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [selectedPlaceId]);

  if (sortedPlaces.length === 0) return null;

  const handleCardTap = (place: Place) => {
    hapticLight();
    navigate(`/place/${place.id}`);
  };

  return (
    <div 
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1"
      style={{ scrollSnapType: 'x mandatory' }}
    >
      {sortedPlaces.map((place) => {
        const isSelected = place.id === selectedPlaceId;
        const categoryColor = getCategoryColor(place.primaryCategory);
        const distance = distanceFromCenter(place, mapCenter);

        return (
          <div
            key={place.id}
            ref={(el) => {
              if (el) cardRefs.current.set(place.id, el);
            }}
            onClick={() => handleCardTap(place)}
            className={cn(
              'flex-shrink-0 w-[280px] bg-card/95 backdrop-blur-md rounded-xl overflow-hidden cursor-pointer',
              'transition-all duration-200 border-2',
              'active:scale-[0.98]',
              isSelected 
                ? 'border-primary shadow-lg ring-2 ring-primary/20' 
                : 'border-transparent shadow-md hover:shadow-lg'
            )}
            style={{ 
              scrollSnapAlign: 'center',
              boxShadow: isSelected 
                ? '0 8px 24px -8px rgba(0, 0, 0, 0.25)' 
                : '0 4px 16px -4px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div className="flex gap-3 p-4">
              {/* Category color stripe */}
              <div 
                className="w-1.5 rounded-full flex-shrink-0" 
                style={{ backgroundColor: categoryColor }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Name row */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="text-place-name text-foreground line-clamp-1">
                    {place.name}
                  </h3>
                  {place.isVerified && (
                    <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </div>

                {/* Category badge */}
                <div 
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-chip mb-2"
                  style={{ 
                    backgroundColor: `${categoryColor}20`,
                    color: categoryColor,
                  }}
                >
                  {place.primaryCategory}
                </div>

                {/* Distance + Price */}
                <div className="flex items-center gap-2 text-secondary text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{distance.toFixed(1)} mi</span>
                  </div>
                  <span>•</span>
                  <span className="font-medium">{place.priceLevel}</span>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 self-center" />
            </div>
          </div>
        );
      })}
    </div>
  );
}