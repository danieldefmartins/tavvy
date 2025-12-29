import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Place } from '@/hooks/usePlaces';
import { cn } from '@/lib/utils';
import { hapticLight } from '@/lib/haptics';
import { ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavigateButton } from '@/components/NavigateButton';
import { PlaceCardBottomSheet } from '@/components/PlaceCardBottomSheet';

type SheetState = 'collapsed' | 'peek' | 'expanded';

interface MapPlaceBottomSheetProps {
  places: Place[];
  selectedPlaceId: string | null;
  onPlaceSelect: (place: Place) => void;
  mapCenter?: { lng: number; lat: number };
}

function distanceFromCenter(place: Place, center?: { lng: number; lat: number }): number {
  if (!center) return place.distance || 0;
  const R = 3959; // Earth radius in miles
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

export function MapPlaceBottomSheet({ 
  places, 
  selectedPlaceId, 
  onPlaceSelect, 
  mapCenter 
}: MapPlaceBottomSheetProps) {
  const navigate = useNavigate();
  const [sheetState, setSheetState] = useState<SheetState>('collapsed');
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentTranslateY = useRef(0);
  const isDragging = useRef(false);

  // Sort places by distance from map center
  const sortedPlaces = useMemo(() => {
    return [...places]
      .sort((a, b) => distanceFromCenter(a, mapCenter) - distanceFromCenter(b, mapCenter))
      .slice(0, 30);
  }, [places, mapCenter]);

  // Find selected place details
  const selectedPlace = useMemo(() => {
    return selectedPlaceId ? sortedPlaces.find(p => p.id === selectedPlaceId) : null;
  }, [selectedPlaceId, sortedPlaces]);

  // Auto-expand to peek when a place is selected
  useEffect(() => {
    if (selectedPlaceId && sheetState === 'collapsed') {
      setSheetState('peek');
    }
  }, [selectedPlaceId]);

  const handleDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    isDragging.current = true;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartY.current = clientY;
    currentTranslateY.current = 0;
    
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
    }
  }, []);

  const handleDragMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging.current) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - dragStartY.current;
    currentTranslateY.current = deltaY;
    
    if (sheetRef.current) {
      const maxDrag = window.innerHeight * 0.5;
      const clampedDelta = Math.max(-maxDrag, Math.min(maxDrag, deltaY));
      sheetRef.current.style.transform = `translateY(${clampedDelta}px)`;
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const threshold = 40;
    const delta = currentTranslateY.current;
    
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      sheetRef.current.style.transform = '';
    }
    
    hapticLight();
    
    if (delta > threshold) {
      // Dragged down - collapse
      if (sheetState === 'expanded') {
        setSheetState('peek');
      } else if (sheetState === 'peek') {
        setSheetState('collapsed');
      }
    } else if (delta < -threshold) {
      // Dragged up - expand
      if (sheetState === 'collapsed') {
        setSheetState('peek');
      } else if (sheetState === 'peek') {
        setSheetState('expanded');
      }
    }
  }, [sheetState]);

  const handlePlaceClick = (place: Place) => {
    hapticLight();
    onPlaceSelect(place);
    setSheetState('peek');
  };

  const handleViewDetails = (placeId: string) => {
    hapticLight();
    navigate(`/place/${placeId}`);
  };

  // Sheet heights
  const getSheetHeight = () => {
    switch (sheetState) {
      case 'collapsed': return '52px';
      case 'peek': return selectedPlace ? '220px' : '200px';
      case 'expanded': return '60vh';
    }
  };

  if (sortedPlaces.length === 0) return null;

  return (
    <div
      ref={sheetRef}
      className="fixed left-0 right-0 z-[600] bg-card rounded-t-3xl transition-all duration-300 ease-out"
      style={{
        bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        height: getSheetHeight(),
        boxShadow: '0 -12px 40px -4px rgba(0, 0, 0, 0.18), 0 -4px 16px -4px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Drag Handle */}
      <div
        className="flex flex-col items-center py-3 cursor-grab active:cursor-grabbing touch-none"
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full mb-1.5" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <ChevronUp className={cn(
            "w-3.5 h-3.5 transition-transform",
            sheetState === 'expanded' && "rotate-180"
          )} />
          <span>{sortedPlaces.length} places nearby</span>
        </div>
      </div>

      {/* Content */}
      <div 
        ref={contentRef}
        className="overflow-y-auto px-4 pb-4"
        style={{ maxHeight: 'calc(100% - 52px)' }}
      >
        {/* Selected Place Card (when peek) */}
        {sheetState === 'peek' && selectedPlace && (
          <div className="mb-3">
            <PlaceCardBottomSheet
              place={selectedPlace}
              distance={distanceFromCenter(selectedPlace, mapCenter)}
              isSelected
              onClick={() => handleViewDetails(selectedPlace.id)}
              variant="peek"
            />
            
            {/* Quick actions */}
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                className="flex-1 h-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails(selectedPlace.id);
                }}
              >
                View Details
              </Button>
              <NavigateButton 
                latitude={selectedPlace.latitude}
                longitude={selectedPlace.longitude}
                name={selectedPlace.name}
                className="flex-1 h-10"
              />
            </div>
          </div>
        )}

        {/* Places List */}
        {(sheetState === 'expanded' || (sheetState === 'peek' && !selectedPlace)) && (
          <div className="space-y-3">
            {sortedPlaces.map((place) => {
              const isSelected = place.id === selectedPlaceId;
              const distance = distanceFromCenter(place, mapCenter);

              return (
                <PlaceCardBottomSheet
                  key={place.id}
                  place={place}
                  distance={distance}
                  isSelected={isSelected}
                  onClick={() => sheetState === 'expanded' ? handleViewDetails(place.id) : handlePlaceClick(place)}
                  variant="list"
                />
              );
            })}
          </div>
        )}

        {/* Collapsed state hint */}
        {sheetState === 'collapsed' && (
          <div className="text-center text-sm text-muted-foreground py-1 font-medium">
            Drag up to see places
          </div>
        )}
      </div>
    </div>
  );
}
