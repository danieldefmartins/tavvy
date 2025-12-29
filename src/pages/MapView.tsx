import { useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PlacesMap, PlacesMapRef } from '@/components/PlacesMap';
import { MapSearchBar } from '@/components/MapSearchBar';
import { MapFilterChips } from '@/components/MapFilterChips';
import { MapPlaceBottomSheet } from '@/components/MapPlaceBottomSheet';
import { AddPlaceWizard } from '@/components/place-wizard/AddPlaceWizard';
import { usePlaces, Place } from '@/hooks/usePlaces';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { useAuth } from '@/hooks/useAuth';
import { useFooter } from '@/contexts/FooterContext';
import { useUserMemberships, useAllPlaceMemberships, getPlaceMembershipMatches } from '@/hooks/useMemberships';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, MapPinOff, FilterX, ArrowLeft, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceFiltersState, SortOption } from '@/components/PlaceFilters';
import { hapticLight } from '@/lib/haptics';
import { 
  ReviewFiltersState, 
  DEFAULT_REVIEW_FILTERS, 
  usePlaceStampAggregatesAll, 
  rankPlacesByReviews 
} from '@/hooks/useReviewFilters';
const MapView = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: places, isLoading: isLoadingPlaces, error: placesError } = usePlaces();
  const mapRef = useRef<PlacesMapRef>(null);
  const { user } = useAuth();
  const { setMapInteracting } = useFooter();
  
  // State
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lng: number; lat: number } | undefined>(undefined);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Parse URL params for initial map position
  const initialCenter = useMemo(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat && lng) {
      return [parseFloat(lng), parseFloat(lat)] as [number, number];
    }
    return undefined;
  }, [searchParams]);

  const initialZoom = useMemo(() => {
    const zoom = searchParams.get('zoom');
    return zoom ? parseFloat(zoom) : undefined;
  }, [searchParams]);
  
  const { data: mapboxToken, isLoading: isLoadingToken, error: tokenError } = useMapboxToken();
  const { data: stampData } = usePlaceStampAggregatesAll();
  const { data: userMemberships } = useUserMemberships();
  const { data: placeMembershipMap } = useAllPlaceMemberships();
  
  // User membership IDs for filtering
  const userMembershipIds = useMemo(() => 
    new Set(userMemberships?.map(um => um.membership_id) || []),
    [userMemberships]
  );
  const hasUserMemberships = userMembershipIds.size > 0;

  const [filters, setFilters] = useState<PlaceFiltersState>({
    category: null,
    features: [],
    openYearRound: false,
    petFriendly: false,
    bigRigFriendly: false,
  });

  const [reviewFilters, setReviewFilters] = useState<ReviewFiltersState>(DEFAULT_REVIEW_FILTERS);

  const [sort, setSort] = useState<SortOption>('recently-updated');

  // Filter and rank places
  const filteredPlaces = useMemo(() => {
    if (!places) return [];

    let result = [...places];

    // Apply category filter (still hides non-matching)
    if (filters.category) {
      result = result.filter((p) => p.primaryCategory === filters.category);
    }

    // Apply feature filters (still hides non-matching)
    if (filters.features.length > 0) {
      result = result.filter((p) =>
        filters.features.every((f) => p.features.includes(f))
      );
    }

    if (filters.petFriendly) {
      result = result.filter((p) => p.features.includes('Pet Friendly'));
    }

    if (filters.bigRigFriendly) {
      result = result.filter((p) => p.features.includes('Big Rig Friendly'));
    }

    if (filters.openYearRound) {
      result = result.filter((p) => p.openYearRound);
    }

    // v1.8: Apply membership filter if enabled
    if (reviewFilters.membershipFilter === 'included_only' && hasUserMemberships && placeMembershipMap) {
      const filterMembershipIds = reviewFilters.selectedMemberships.length > 0
        ? new Set(reviewFilters.selectedMemberships)
        : userMembershipIds;
      
      result = result.filter((p) => {
        const matches = getPlaceMembershipMatches(p.id, filterMembershipIds, placeMembershipMap);
        return matches.length > 0;
      });
    }

    // Apply review-based filtering and re-ranking
    // - Positive/Neutral: boost ranking
    // - Negative: EXCLUDE places with those signals
    const placeIds = result.map(p => p.id);
    const { rankedIds } = rankPlacesByReviews(placeIds, stampData, reviewFilters);
    
    // Filter to only include ranked places (excluded places are removed)
    const rankedIdSet = new Set(rankedIds);
    result = result.filter(p => rankedIdSet.has(p.id));
    
    // Create a map for quick lookup of rank position
    const rankMap = new Map(rankedIds.map((id, idx) => [id, idx]));

    // Apply sorting - review filter ranking takes priority when active
    const hasReviewFilters = 
      reviewFilters.positiveStamps.length > 0 || 
      reviewFilters.neutralStamps.length > 0 || 
      reviewFilters.negativeStamps.length > 0;

    if (hasReviewFilters) {
      // Sort by review filter ranking
      result.sort((a, b) => {
        const rankA = rankMap.get(a.id) ?? Infinity;
        const rankB = rankMap.get(b.id) ?? Infinity;
        return rankA - rankB;
      });
    } else if (sort === 'alphabetical') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => {
        if (a.isProRecommended !== b.isProRecommended) {
          return a.isProRecommended ? -1 : 1;
        }
        return b.lastUpdated.getTime() - a.lastUpdated.getTime();
      });
    }

    return result;
  }, [places, filters, sort, stampData, reviewFilters, hasUserMemberships, userMembershipIds, placeMembershipMap]);

  const isLoading = isLoadingPlaces || isLoadingToken;
  const hasError = placesError || tokenError;
  const hasActiveFilters = filters.category || filters.features.length > 0 || filters.openYearRound || filters.petFriendly || filters.bigRigFriendly || 
    reviewFilters.positiveStamps.length > 0 || reviewFilters.neutralStamps.length > 0 || reviewFilters.negativeStamps.length > 0 ||
    reviewFilters.membershipFilter === 'included_only';

  const clearFilters = useCallback(() => {
    setFilters({
      category: null,
      features: [],
      openYearRound: false,
      petFriendly: false,
      bigRigFriendly: false,
    });
    setReviewFilters(DEFAULT_REVIEW_FILTERS);
  }, []);

  // Handle search selections
  const handleSearchLocation = useCallback((lng: number, lat: number, zoom?: number) => {
    mapRef.current?.flyTo(lng, lat, zoom || 12);
    setIsSearchFocused(false);
  }, []);

  const handleSearchPlaceSelect = useCallback((place: Place) => {
    mapRef.current?.flyTo(place.longitude, place.latitude, 14);
    setSelectedPlaceId(place.id);
    setSelectedPlace(place);
    setIsSearchFocused(false);
  }, []);

  const handleCenterChange = useCallback((center: { lng: number; lat: number }) => {
    setMapCenter(center);
  }, []);

  // Handle place selection from map pin click
  const handleMapPlaceSelect = useCallback((place: Place) => {
    setSelectedPlaceId(place.id);
    setSelectedPlace(place);
  }, []);

  // Handle map interaction for footer auto-hide
  const handleMapInteractionStart = useCallback(() => {
    setMapInteracting(true);
  }, [setMapInteracting]);

  const handleMapInteractionEnd = useCallback(() => {
    setMapInteracting(false);
  }, [setMapInteracting]);

  // GPS location request
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    
    hapticLight();
    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
        setIsLocating(false);
        mapRef.current?.flyTo(coords[0], coords[1], 12);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return (
    <div 
      className="relative bg-background overflow-hidden"
      style={{ 
        height: '100dvh',
        minHeight: '-webkit-fill-available',
      }}
    >
      {/* Full-screen map container */}
      <div className="absolute inset-0">
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-[1]">
            <div className="text-center">
              <Skeleton className="w-12 h-12 rounded-full mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}

        {/* Error state - Map token error */}
        {tokenError && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-[1]">
            <div className="text-center p-6 max-w-sm">
              <MapPinOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Map Unavailable</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The map couldn't be loaded. You can still browse places in list view.
              </p>
              <Button onClick={() => navigate('/places')}>
                View as List
              </Button>
            </div>
          </div>
        )}

        {/* Error state - Places error */}
        {placesError && !tokenError && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-[1]">
            <div className="text-center p-6 max-w-sm">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Places</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Something went wrong loading the places data. Please try again.
              </p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Map */}
        {mapboxToken && !isLoading && !hasError && (
          <PlacesMap
            ref={mapRef}
            places={filteredPlaces}
            mapboxToken={mapboxToken}
            className="h-full w-full"
            initialCenter={initialCenter}
            initialZoom={initialZoom}
            showSearch={false}
            selectedPlaceId={selectedPlaceId}
            onPlaceSelect={handleMapPlaceSelect}
            onCenterChange={handleCenterChange}
            onInteractionStart={handleMapInteractionStart}
            onInteractionEnd={handleMapInteractionEnd}
          />
        )}
      </div>

      {/* Search dimmer overlay */}
      {isSearchFocused && (
        <div 
          className="absolute inset-0 bg-black/30 z-[45] transition-opacity duration-200"
          onClick={() => setIsSearchFocused(false)}
        />
      )}

      {/* Top controls - compact single row: Back + Search */}
      <div 
        className="absolute top-0 left-0 right-0 z-[50] pointer-events-none"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}
      >
        {/* Search row with back button inline - flush left with proper margins */}
        <div className="flex items-center gap-3 px-4 py-2 pointer-events-auto">
          {/* Back button - compact, flush left */}
          <Button
            variant="secondary"
            size="icon"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card/[0.95] backdrop-blur-xl shadow-md border-0 hover:bg-card flex-shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Search bar - wider and taller */}
          <div className="flex-1">
            <MapSearchBar
              mapboxToken={mapboxToken || ''}
              places={places || []}
              onSelectLocation={handleSearchLocation}
              onSelectPlace={handleSearchPlaceSelect}
              onFocusChange={setIsSearchFocused}
              isFocused={isSearchFocused}
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="px-3 pb-2 pointer-events-auto">
          <MapFilterChips 
            filters={filters} 
            onFiltersChange={setFilters}
            filteredCount={filteredPlaces.length}
            reviewFilters={reviewFilters}
            onReviewFiltersChange={setReviewFilters}
          />
        </div>
      </div>

      {/* No results state - floating pill */}
      {!isLoading && !hasError && filteredPlaces.length === 0 && hasActiveFilters && (
        <div className="absolute inset-0 flex items-center justify-center z-[30] pointer-events-none">
          <div className="text-center p-6 max-w-sm bg-card/95 backdrop-blur-md rounded-2xl shadow-xl pointer-events-auto">
            <FilterX className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">No Places Match</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your filters
            </p>
            <Button onClick={clearFilters} variant="outline" size="sm" className="gap-2">
              <FilterX className="w-4 h-4" />
              Reset Filters
            </Button>
          </div>
        </div>
      )}

      {/* GPS Location button - bottom right (where + was) */}
      <Button
        variant="secondary"
        size="icon"
        onClick={requestLocation}
        disabled={isLocating}
        className="fixed right-4 z-40 w-12 h-12 rounded-full shadow-lg bg-card/95 backdrop-blur-sm hover:bg-card"
        style={{ bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }}
      >
        {isLocating ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Navigation className="w-5 h-5" />
        )}
      </Button>

      {/* Bottom Sheet Place Cards */}
      {mapboxToken && !isLoading && !hasError && filteredPlaces.length > 0 && (
        <MapPlaceBottomSheet
          places={filteredPlaces}
          selectedPlaceId={selectedPlaceId}
          onPlaceSelect={handleMapPlaceSelect}
          mapCenter={mapCenter}
        />
      )}

      {/* Add Place Wizard */}
      <AddPlaceWizard 
        open={showAddPlace} 
        onOpenChange={setShowAddPlace}
        initialLocation={mapCenter}
      />
    </div>
  );
};

export default MapView;