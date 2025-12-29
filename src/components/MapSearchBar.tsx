import { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Navigation } from 'lucide-react';
import { Place } from '@/hooks/usePlaces';
import { cn } from '@/lib/utils';
import { hapticLight } from '@/lib/haptics';

// MUVO Pin Icon for search bar
const MuvoIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

interface MapSearchBarProps {
  mapboxToken: string;
  places?: Place[];
  onSelectLocation: (lng: number, lat: number, zoom?: number) => void;
  onSelectPlace?: (place: Place) => void;
  onFocusChange?: (focused: boolean) => void;
  isFocused?: boolean;
  className?: string;
}

interface GeocodingResult {
  id: string;
  place_name: string;
  center: [number, number];
  place_type: string[];
}

export function MapSearchBar({
  mapboxToken,
  places = [],
  onSelectLocation,
  onSelectPlace,
  onFocusChange,
  isFocused = false,
  className,
}: MapSearchBarProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [geocodingResults, setGeocodingResults] = useState<GeocodingResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Filter places by query
  const matchingPlaces = query.length >= 2
    ? places.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.primaryCategory.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  // Geocoding search
  async function searchGeocoding(searchQuery: string) {
    if (searchQuery.length < 3) {
      setGeocodingResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${mapboxToken}&country=us&types=place,locality,neighborhood,address,poi&limit=5`
      );
      const data = await res.json();
      setGeocodingResults(data.features || []);
    } catch (err) {
      console.error('Geocoding error:', err);
      setGeocodingResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= 3) {
      debounceRef.current = setTimeout(() => {
        searchGeocoding(query);
      }, 300);
    } else {
      setGeocodingResults([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        onFocusChange?.(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onFocusChange]);

  const handleSelectPlace = (place: Place) => {
    hapticLight();
    setQuery(place.name);
    setShowDropdown(false);
    onFocusChange?.(false);
    onSelectPlace?.(place);
  };

  const handleSelectLocation = (result: GeocodingResult) => {
    hapticLight();
    setQuery(result.place_name.split(',')[0]);
    setShowDropdown(false);
    onFocusChange?.(false);
    onSelectLocation(result.center[0], result.center[1], 12);
  };

  const handleClear = () => {
    hapticLight();
    setQuery('');
    setGeocodingResults([]);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setShowDropdown(true);
    onFocusChange?.(true);
  };

  const hasResults = matchingPlaces.length > 0 || geocodingResults.length > 0;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Search input - pill style with frosted glass and MUVO icon - taller (48px) for better touch */}
      <div 
        className={cn(
          'flex items-center gap-3 px-5 bg-card/[0.95] backdrop-blur-xl rounded-full transition-all duration-200',
          isFocused ? 'ring-2 ring-primary' : '',
        )}
        style={{ 
          height: '48px',
          boxShadow: isFocused 
            ? '0 8px 32px -4px rgba(0, 0, 0, 0.25)' 
            : '0 4px 16px -4px rgba(0, 0, 0, 0.15)' 
        }}
      >
        {/* MUVO Pin Icon - like Google Maps */}
        <MuvoIcon className="w-5 h-5 text-primary flex-shrink-0" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder="Search places or locations"
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/70 outline-none text-[16px] font-medium"
        />
        {query ? (
          <button
            onClick={handleClear}
            className="p-1.5 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        ) : (
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        )}
      </div>

      {/* Dropdown results */}
      {showDropdown && (query.length >= 2 || hasResults) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card/98 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden max-h-[60vh] overflow-y-auto z-[60]">
          {/* Loading state */}
          {isLoading && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {/* Matching places */}
          {matchingPlaces.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/30">
                Places
              </div>
              {matchingPlaces.map((place) => (
                <button
                  key={place.id}
                  onClick={() => handleSelectPlace(place)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{place.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {place.primaryCategory} · {place.priceLevel}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Geocoding results */}
          {geocodingResults.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/30">
                Locations
              </div>
              {geocodingResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectLocation(result)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Navigation className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {result.place_name.split(',')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.place_name.split(',').slice(1).join(',').trim()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {!isLoading && query.length >= 2 && !hasResults && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
