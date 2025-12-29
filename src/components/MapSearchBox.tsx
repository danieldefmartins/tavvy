import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Place } from '@/hooks/usePlaces';

interface MapSearchBoxProps {
  mapboxToken: string;
  places?: Place[];
  onSelectLocation: (lng: number, lat: number, zoom?: number) => void;
  onSelectPlace?: (place: Place) => void;
  className?: string;
}

interface GeocodingResult {
  id: string;
  place_name: string;
  center: [number, number];
  place_type: string[];
}

export function MapSearchBox({ 
  mapboxToken, 
  places = [], 
  onSelectLocation, 
  onSelectPlace,
  className 
}: MapSearchBoxProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [geocodingResults, setGeocodingResults] = useState<GeocodingResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Filter places that match query
  const matchingPlaces = query.length >= 2
    ? places.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  // Geocoding search with debounce
  const searchGeocoding = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 3) {
      setGeocodingResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?` +
        `access_token=${mapboxToken}&country=us&types=place,locality,region,postcode&limit=5`
      );
      const data = await response.json();
      setGeocodingResults(data.features || []);
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodingResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [mapboxToken]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchGeocoding(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchGeocoding]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPlace = (place: Place) => {
    setQuery(place.name);
    setIsOpen(false);
    onSelectLocation(place.longitude, place.latitude, 14);
    onSelectPlace?.(place);
  };

  const handleSelectLocation = (result: GeocodingResult) => {
    setQuery(result.place_name);
    setIsOpen(false);
    // Determine zoom based on place type
    const zoom = result.place_type.includes('region') ? 6 
      : result.place_type.includes('place') ? 10 
      : 12;
    onSelectLocation(result.center[0], result.center[1], zoom);
  };

  const clearSearch = () => {
    setQuery('');
    setGeocodingResults([]);
    inputRef.current?.focus();
  };

  const hasResults = matchingPlaces.length > 0 || geocodingResults.length > 0;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search places or locations..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-9 bg-background/95 backdrop-blur-sm"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && query.length >= 2 && hasResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-[60] overflow-hidden max-h-80 overflow-y-auto">
          {/* Matching places */}
          {matchingPlaces.length > 0 && (
            <div>
              <div className="px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Places
              </div>
              {matchingPlaces.map((place) => (
                <button
                  key={place.id}
                  className="w-full px-3 py-2.5 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => handleSelectPlace(place)}
                >
                  <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{place.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {place.primaryCategory} • {place.distance} mi
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Geocoding results */}
          {geocodingResults.length > 0 && (
            <div>
              <div className="px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Locations
              </div>
              {geocodingResults.map((result) => (
                <button
                  key={result.id}
                  className="w-full px-3 py-2.5 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => handleSelectLocation(result)}
                >
                  <Search className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm">{result.place_name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No results */}
      {isOpen && query.length >= 2 && !hasResults && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-[60] p-4 text-center">
          <p className="text-sm text-muted-foreground">No results found</p>
        </div>
      )}
    </div>
  );
}
