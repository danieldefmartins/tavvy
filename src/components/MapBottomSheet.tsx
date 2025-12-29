import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Place } from '@/hooks/usePlaces';
import { cn } from '@/lib/utils';
import { hapticLight } from '@/lib/haptics';
import { 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  ChevronRight, 
  MapPin, 
  X,
  Wifi,
  Droplets,
  Zap,
  ShowerHead,
  Dog,
  Truck
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { usePlaceStampAggregates, usePlaceReviewCount } from '@/hooks/useReviews';
import { useAllStamps, type StampDefinition } from '@/hooks/useStamps';
import { Button } from '@/components/ui/button';
import { NavigateButton } from '@/components/NavigateButton';
import { FavoriteButton } from '@/components/FavoriteButton';

type SheetState = 'hidden' | 'peek' | 'expanded';

interface MapBottomSheetProps {
  place: Place | null;
  places: Place[];
  mapCenter?: { lng: number; lat: number };
  onClose: () => void;
  onSheetStateChange?: (state: SheetState) => void;
}

// Feature icon mapping
const FEATURE_ICONS: Record<string, React.ComponentType<any>> = {
  'Wi-Fi': Wifi,
  'Fresh Water': Droplets,
  'Electric Hookups': Zap,
  'Showers': ShowerHead,
  'Pet Friendly': Dog,
  'Big Rig Friendly': Truck,
};

function getStampIcon(stamps: StampDefinition[] | undefined, stampId: string): React.ComponentType<any> {
  const stamp = stamps?.find(s => s.id === stampId);
  if (stamp?.icon) {
    const IconComponent = (LucideIcons as any)[stamp.icon];
    if (IconComponent) return IconComponent;
  }
  return Sparkles;
}

function getConfidenceLabel(reviewCount: number, positiveCount: number, improvementCount: number): {
  label: string;
  variant: 'positive' | 'neutral' | 'caution';
} {
  if (reviewCount === 0) {
    return { label: 'No reports yet', variant: 'neutral' };
  }
  
  if (reviewCount < 3) {
    return { label: 'Limited reports', variant: 'neutral' };
  }
  
  const ratio = positiveCount / (positiveCount + improvementCount + 1);
  
  if (ratio >= 0.7 && reviewCount >= 5) {
    return { label: 'Often recommended', variant: 'positive' };
  }
  
  if (ratio >= 0.5) {
    return { label: 'Good for overnight', variant: 'positive' };
  }
  
  if (ratio >= 0.3) {
    return { label: 'Mixed experiences', variant: 'neutral' };
  }
  
  return { label: 'Proceed with caution', variant: 'caution' };
}

function distanceFromCenter(place: Place, center?: { lng: number; lat: number }): number {
  if (!center) return 0;
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

export function MapBottomSheet({ 
  place, 
  places, 
  mapCenter, 
  onClose,
  onSheetStateChange 
}: MapBottomSheetProps) {
  const navigate = useNavigate();
  const [sheetState, setSheetState] = useState<SheetState>('peek');
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentTranslateY = useRef(0);
  const isDragging = useRef(false);

  const { data: aggregates } = usePlaceStampAggregates(place?.id || '');
  const { data: reviewCount = 0 } = usePlaceReviewCount(place?.id || '');
  const { data: allStamps } = useAllStamps();

  // Heights for each state (percentage of viewport)
  const HEIGHTS = {
    hidden: 0,
    peek: 20,
    expanded: 60,
  };

  // Nearby places (excluding selected)
  const nearbyPlaces = useMemo(() => {
    if (!places || !mapCenter) return [];
    return places
      .filter(p => p.id !== place?.id)
      .sort((a, b) => distanceFromCenter(a, mapCenter) - distanceFromCenter(b, mapCenter))
      .slice(0, 5);
  }, [places, mapCenter, place?.id]);

  // Experience signals
  const experienceSignals = useMemo(() => {
    if (!aggregates || aggregates.length === 0) return [];
    return aggregates
      .filter(a => a.polarity === 'positive')
      .sort((a, b) => b.total_votes - a.total_votes)
      .slice(0, 4)
      .map(stamp => ({
        id: stamp.stamp_id || stamp.dimension,
        icon: stamp.stamp_id ? getStampIcon(allStamps, stamp.stamp_id) : Sparkles,
        label: stamp.stamp_id ? allStamps?.find(s => s.id === stamp.stamp_id)?.label : stamp.dimension,
      }));
  }, [aggregates, allStamps]);

  // Confidence info
  const confidenceInfo = useMemo(() => {
    const positiveCount = aggregates?.filter(a => a.polarity === 'positive').length || 0;
    const improvementCount = aggregates?.filter(a => a.polarity === 'improvement').length || 0;
    return getConfidenceLabel(reviewCount, positiveCount, improvementCount);
  }, [reviewCount, aggregates]);

  // Feature icons for display
  const featureIcons = useMemo(() => {
    if (!place?.features) return [];
    return place.features
      .filter(f => FEATURE_ICONS[f])
      .slice(0, 5)
      .map(f => ({ name: f, icon: FEATURE_ICONS[f] }));
  }, [place?.features]);

  // Notify parent of state changes
  useEffect(() => {
    onSheetStateChange?.(sheetState);
  }, [sheetState, onSheetStateChange]);

  // Reset to peek when place changes
  useEffect(() => {
    if (place) {
      setSheetState('peek');
    } else {
      setSheetState('hidden');
    }
  }, [place?.id]);

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
      // Limit the drag range
      const maxDrag = window.innerHeight * 0.4;
      const clampedDelta = Math.max(-maxDrag, Math.min(maxDrag, deltaY));
      sheetRef.current.style.transform = `translateY(${clampedDelta}px)`;
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const threshold = 50;
    const delta = currentTranslateY.current;
    
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
      sheetRef.current.style.transform = '';
    }
    
    hapticLight();
    
    if (delta > threshold) {
      // Dragged down
      if (sheetState === 'expanded') {
        setSheetState('peek');
      } else if (sheetState === 'peek') {
        setSheetState('hidden');
        onClose();
      }
    } else if (delta < -threshold) {
      // Dragged up
      if (sheetState === 'hidden') {
        setSheetState('peek');
      } else if (sheetState === 'peek') {
        setSheetState('expanded');
      }
    }
  }, [sheetState, onClose]);

  const handleViewDetails = () => {
    if (place) {
      hapticLight();
      navigate(`/place/${place.id}`);
    }
  };

  if (!place && sheetState !== 'hidden') {
    return null;
  }

  const distance = place && mapCenter ? distanceFromCenter(place, mapCenter) : place?.distance || 0;

  return (
    <>
      {/* Backdrop for expanded state */}
      {sheetState === 'expanded' && (
        <div 
          className="fixed inset-0 z-[35] bg-black/20 transition-opacity duration-300"
          onClick={() => {
            hapticLight();
            setSheetState('peek');
          }}
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed left-0 right-0 z-[40] transition-all duration-300 ease-out',
          sheetState === 'hidden' && 'translate-y-full'
        )}
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)', // Above footer
          height: `${HEIGHTS[sheetState]}vh`,
          minHeight: sheetState === 'peek' ? '140px' : sheetState === 'expanded' ? '50vh' : '0',
        }}
      >
        <div 
          className="h-full bg-card/[0.92] backdrop-blur-xl rounded-t-3xl overflow-hidden flex flex-col"
          style={{
            boxShadow: '0 -4px 32px -4px rgba(0, 0, 0, 0.15)',
          }}
        >
          {/* Drag Handle */}
          <div
            className="flex-shrink-0 flex items-center justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
          >
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Content */}
          {place && (
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {/* PEEK STATE: Minimal info */}
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-foreground text-lg leading-tight line-clamp-1">
                        {place.name}
                      </h2>
                      {place.isVerified && (
                        <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0" />
                      )}
                    </div>
                    
                    {/* Distance + Price + Category */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{distance.toFixed(1)} mi</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="font-medium">{place.priceLevel}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-xs truncate">{place.primaryCategory}</span>
                    </div>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => {
                      hapticLight();
                      setSheetState('hidden');
                      onClose();
                    }}
                    className="p-1.5 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick icons row */}
                <div className="flex items-center gap-2 overflow-x-auto">
                  {featureIcons.slice(0, 4).map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={feature.name}
                        className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"
                        title={feature.name}
                      >
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                    );
                  })}
                  
                  {/* Confidence badge */}
                  <div className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0',
                    confidenceInfo.variant === 'positive' && 'bg-[hsl(var(--signal-positive-tint))] text-[hsl(var(--signal-positive-text))]',
                    confidenceInfo.variant === 'neutral' && 'bg-muted text-muted-foreground',
                    confidenceInfo.variant === 'caution' && 'bg-[hsl(var(--signal-neutral-tint))] text-[hsl(var(--signal-neutral-text))]'
                  )}>
                    {confidenceInfo.label}
                  </div>
                </div>

                {/* EXPANDED STATE: More details */}
                {sheetState === 'expanded' && (
                  <div className="space-y-4 pt-2 animate-fade-in">
                    {/* Cover image */}
                    {place.coverImageUrl && (
                      <div className="rounded-xl overflow-hidden aspect-[16/9]">
                        <img 
                          src={place.coverImageUrl} 
                          alt={place.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Experience signals */}
                    {experienceSignals.length > 0 && (
                      <div>
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          What Stood Out
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {experienceSignals.map((signal, idx) => {
                            const IconComponent = signal.icon;
                            return (
                              <div
                                key={signal.id + idx}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary/10"
                              >
                                <IconComponent className="w-3.5 h-3.5 text-primary" />
                                <span className="text-xs font-medium text-foreground capitalize">
                                  {signal.label || signal.id}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* All amenities */}
                    {place.features.length > 0 && (
                      <div>
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          Amenities
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {place.features.map(feature => (
                            <span 
                              key={feature}
                              className="px-2 py-1 bg-muted rounded-lg text-xs text-foreground"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description preview */}
                    {place.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {place.summary}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <Button 
                        onClick={handleViewDetails}
                        className="flex-1 gap-2"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <NavigateButton 
                        latitude={place.latitude}
                        longitude={place.longitude}
                        name={place.name}
                        className="flex-1"
                      />
                    </div>

                    {/* Favorite */}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">Save to favorites</span>
                      <FavoriteButton placeId={place.id} />
                    </div>

                    {/* Nearby places */}
                    {nearbyPlaces.length > 0 && (
                      <div className="border-t border-border pt-4">
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                          Nearby Places
                        </h3>
                        <div className="space-y-2">
                          {nearbyPlaces.slice(0, 3).map(nearby => (
                            <button
                              key={nearby.id}
                              onClick={() => {
                                hapticLight();
                                navigate(`/place/${nearby.id}`);
                              }}
                              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{nearby.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {distanceFromCenter(nearby, mapCenter).toFixed(1)} mi · {nearby.priceLevel}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Peek state action hint */}
                {sheetState === 'peek' && (
                  <button
                    onClick={() => {
                      hapticLight();
                      setSheetState('expanded');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-primary font-medium"
                  >
                    <span>Swipe up for more</span>
                    <ChevronRight className="w-4 h-4 rotate-[-90deg]" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
