import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, MapPin, X, Loader2, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface RouteInputProps {
  mapboxToken: string;
  placeholder: string;
  icon?: 'start' | 'end';
  value: { name: string; coordinates: [number, number] } | null;
  onChange: (location: { name: string; coordinates: [number, number] } | null) => void;
  className?: string;
}

interface GeocodingResult {
  id: string;
  place_name: string;
  center: [number, number];
}

export function RouteInput({ 
  mapboxToken, 
  placeholder,
  icon = 'start',
  value,
  onChange,
  className 
}: RouteInputProps) {
  const [query, setQuery] = useState(value?.name || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Sync query with value
  useEffect(() => {
    if (value?.name && value.name !== query) {
      setQuery(value.name);
    }
  }, [value?.name]);

  // Geocoding search with debounce
  const searchGeocoding = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?` +
        `access_token=${mapboxToken}&country=us&types=place,locality,address,poi&limit=5`
      );
      const data = await response.json();
      setResults(data.features || []);
    } catch (error) {
      console.error('Geocoding error:', error);
      setResults([]);
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

  const handleSelect = (result: GeocodingResult) => {
    setQuery(result.place_name);
    setIsOpen(false);
    onChange({
      name: result.place_name,
      coordinates: result.center,
    });
  };

  const clearInput = () => {
    setQuery('');
    setResults([]);
    onChange(null);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <div className={cn(
          'absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2',
          icon === 'start' ? 'bg-green-500 border-green-600' : 'bg-red-500 border-red-600'
        )} />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (!e.target.value) {
              onChange(null);
            }
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-9"
        />
        {query && (
          <button
            onClick={clearInput}
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
      {isOpen && query.length >= 3 && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.id}
              className="w-full px-3 py-2.5 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left"
              onClick={() => handleSelect(result)}
            >
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-sm">{result.place_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
