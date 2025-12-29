import { useState, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { PlaceCard } from '@/components/PlaceCard';
import { PlaceFilters, PlaceFiltersState, SortOption } from '@/components/PlaceFilters';
import { PlacesMap, PlacesMapRef } from '@/components/PlacesMap';
import { usePlaces, Place } from '@/hooks/usePlaces';
import { useSearchPlaces } from '@/hooks/useSearch';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { useUserMemberships, useAllPlaceMemberships, getPlaceMembershipMatches } from '@/hooks/useMemberships';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Map as MapIcon, List, AlertCircle, Search, X, ArrowLeft, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ReviewFiltersState, 
  DEFAULT_REVIEW_FILTERS, 
  usePlaceStampAggregatesAll, 
  rankPlacesByReviews 
} from '@/hooks/useReviewFilters';

type ViewMode = 'list' | 'map';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState<PlaceFiltersState>({
    category: null,
    features: [],
    openYearRound: false,
    petFriendly: false,
    bigRigFriendly: false,
  });
  const [reviewFilters, setReviewFilters] = useState<ReviewFiltersState>(DEFAULT_REVIEW_FILTERS);
  const [sort, setSort] = useState<SortOption>('recently-updated');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [visiblePlaceIds, setVisiblePlaceIds] = useState<string[] | null>(null);

  const { data: places, isLoading, error } = usePlaces();
  const { data: mapboxToken, isLoading: isLoadingToken, error: tokenError } = useMapboxToken();
  const { data: stampData } = usePlaceStampAggregatesAll();
  const { data: userMemberships } = useUserMemberships();
  const { data: placeMembershipMap } = useAllPlaceMemberships();
  const mapRef = useRef<PlacesMapRef>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // User membership IDs for prioritization
  const userMembershipIds = useMemo(() => 
    new Set(userMemberships?.map(um => um.membership_id) || []),
    [userMemberships]
  );
  const hasUserMemberships = userMembershipIds.size > 0;

  // Search filter
  const searchedPlaces = useSearchPlaces(places, searchQuery);

  // Apply additional filters, review filters, and sort
  const filteredAndSortedPlaces = useMemo(() => {
    let result = [...searchedPlaces];

    // Apply filters
    if (filters.category) {
      result = result.filter((p) => p.primaryCategory === filters.category);
    }

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

    // Apply review-based filtering and ranking
    const placeIds = result.map(p => p.id);
    const { rankedIds } = rankPlacesByReviews(placeIds, stampData, reviewFilters);
    const rankedIdSet = new Set(rankedIds);
    result = result.filter(p => rankedIdSet.has(p.id));
    const rankMap = new Map(rankedIds.map((id, idx) => [id, idx]));
    // Apply sorting
    const hasReviewFilters = 
      reviewFilters.positiveStamps.length > 0 || 
      reviewFilters.neutralStamps.length > 0 || 
      reviewFilters.negativeStamps.length > 0;

    if (hasReviewFilters) {
      result.sort((a, b) => (rankMap.get(a.id) ?? Infinity) - (rankMap.get(b.id) ?? Infinity));
    } else if (sort === 'alphabetical') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Recently updated - membership matches first, then pro recommended, then by date
      result.sort((a, b) => {
        // Membership prioritization (v1.8): places included in user's memberships come first
        if (hasUserMemberships && placeMembershipMap) {
          const aMatches = getPlaceMembershipMatches(a.id, userMembershipIds, placeMembershipMap);
          const bMatches = getPlaceMembershipMatches(b.id, userMembershipIds, placeMembershipMap);
          if (aMatches.length > 0 && bMatches.length === 0) return -1;
          if (bMatches.length > 0 && aMatches.length === 0) return 1;
        }
        
        if (a.isProRecommended !== b.isProRecommended) {
          return a.isProRecommended ? -1 : 1;
        }
        return b.lastUpdated.getTime() - a.lastUpdated.getTime();
      });
    }

    return result;
  }, [searchedPlaces, filters, sort, stampData, reviewFilters, hasUserMemberships, userMembershipIds, placeMembershipMap]);

  // Places visible in the current map viewport
  const displayedPlaces = useMemo(() => {
    if (viewMode === 'list' || !visiblePlaceIds) {
      return filteredAndSortedPlaces;
    }
    const visibleSet = new Set(visiblePlaceIds);
    return filteredAndSortedPlaces.filter((p) => visibleSet.has(p.id));
  }, [filteredAndSortedPlaces, visiblePlaceIds, viewMode]);

  const handlePlaceCardClick = useCallback((place: Place) => {
    setSelectedPlaceId(place.id);
    if (viewMode === 'map' && mapRef.current) {
      mapRef.current.openPopup(place.id);
    }
  }, [viewMode]);

  const handleMapPlaceSelect = useCallback((place: Place) => {
    setSelectedPlaceId(place.id);
  }, []);

  const handleBoundsChange = useCallback((placeIds: string[]) => {
    setVisiblePlaceIds(placeIds);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL with new search query
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`, { replace: true });
  };

  const clearSearch = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header showBack />

      <main className="flex-1 flex flex-col">
        {/* Search Bar */}
        <div className="container px-4 pt-4 max-w-lg mx-auto w-full">
          <form onSubmit={handleSearchSubmit} className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search places..."
              className="w-full h-11 pl-9 pr-9 rounded-full border-border"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

        {/* Filters, Sort, and View Toggle */}
        <div className="container px-4 pb-4 max-w-lg mx-auto w-full">
          <div className="flex items-center gap-2 mb-4">
            {/* View toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'rounded-none px-3 h-9',
                  viewMode === 'list' && 'bg-muted'
                )}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4 mr-1.5" />
                List
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'rounded-none px-3 h-9 border-l border-border',
                  viewMode === 'map' && 'bg-muted'
                )}
                onClick={() => setViewMode('map')}
              >
                <MapIcon className="w-4 h-4 mr-1.5" />
                Map
              </Button>
            </div>
            
            <div className="flex-1">
              <PlaceFilters
                filters={filters}
                onFiltersChange={setFilters}
                sort={sort}
                onSortChange={setSort}
                totalCount={searchedPlaces.length}
                filteredCount={filteredAndSortedPlaces.length}
                reviewFilters={reviewFilters}
                onReviewFiltersChange={setReviewFilters}
              />
            </div>
          </div>

          {/* Results count */}
          {viewMode === 'list' && (
            <div className="flex flex-col gap-1.5 mb-3">
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? 'Searching...'
                  : searchQuery.trim()
                    ? `${filteredAndSortedPlaces.length} results for "${searchQuery}"`
                    : `${filteredAndSortedPlaces.length} places`}
              </p>
              {/* v1.8: Membership prioritization message */}
              {hasUserMemberships && !isLoading && (
                <p className="text-xs text-primary/80 flex items-center gap-1">
                  <Ticket className="w-3 h-3" />
                  Results prioritized based on your selected memberships.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Map View */}
        {viewMode === 'map' && (
          <div className="flex-1 relative min-h-[400px]">
            {isLoadingToken && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Skeleton className="w-8 h-8 rounded-full mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading map...</p>
                </div>
              </div>
            )}
            
            {tokenError && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center p-4">
                  <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-destructive font-medium mb-1">Map unavailable</p>
                  <p className="text-xs text-muted-foreground">
                    Mapbox token not configured.
                  </p>
                </div>
              </div>
            )}

            {mapboxToken && !isLoadingToken && (
              <PlacesMap
                ref={mapRef}
                places={filteredAndSortedPlaces}
                mapboxToken={mapboxToken}
                className="h-full"
                showSearch
                selectedPlaceId={selectedPlaceId}
                onPlaceSelect={handleMapPlaceSelect}
                onBoundsChange={handleBoundsChange}
              />
            )}

            <div className="absolute top-2 left-2 z-10">
              <div className="bg-background/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-border">
                <p className="text-xs font-medium">
                  {displayedPlaces.length} places in view
                </p>
              </div>
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="container px-4 max-w-lg mx-auto w-full pb-4">
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
                <p className="text-sm text-destructive">Failed to load places. Please try again.</p>
              </div>
            )}

            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/4 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && !error && filteredAndSortedPlaces.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">
                  {searchQuery.trim()
                    ? `No results found for "${searchQuery}"`
                    : 'No places match your filters.'}
                </p>
                {(filters.category || filters.features.length > 0 || filters.openYearRound || filters.petFriendly || filters.bigRigFriendly) && (
                  <button
                    onClick={() =>
                      setFilters({
                        category: null,
                        features: [],
                        openYearRound: false,
                        petFriendly: false,
                        bigRigFriendly: false,
                      })
                    }
                    className="text-sm text-primary hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {!isLoading && !error && filteredAndSortedPlaces.length > 0 && (
              <div className="space-y-3">
                {filteredAndSortedPlaces.map((place, index) => (
                  <div
                    key={place.id}
                    onClick={() => handlePlaceCardClick(place)}
                    className={cn(
                      'cursor-pointer transition-all',
                      selectedPlaceId === place.id && 'ring-2 ring-primary rounded-xl'
                    )}
                  >
                    <PlaceCard
                      place={place}
                      className="animate-fade-in"
                      style={{ animationDelay: `${Math.min(index, 5) * 50}ms` }}
                    />
                  </div>
                ))}
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground mt-8 pb-4">
              Information is based on community reports. Always verify locally.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchResults;
