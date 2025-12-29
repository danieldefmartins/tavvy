import { useState, useRef, useEffect, forwardRef } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { usePlaces, Place } from '@/hooks/usePlaces';
import { WeatherBadge } from './WeatherBadge';
import { cn } from '@/lib/utils';

interface HomeSearchBarProps {
  className?: string;
}

export const HomeSearchBar = forwardRef<HTMLDivElement, HomeSearchBarProps>(
  function HomeSearchBar({ className }, ref) {
  const navigate = useNavigate();
  const { data: places } = usePlaces();
  
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter matching places based on query
  const matchingPlaces = query.trim().length >= 2
    ? (places || [])
        .filter((place) => {
          const searchText = `${place.name} ${place.primaryCategory} ${place.features.join(' ')}`.toLowerCase();
          return searchText.includes(query.toLowerCase().trim());
        })
        .slice(0, 5)
    : [];

  // Combine refs for click-outside detection
  const internalRef = useRef<HTMLDivElement>(null);
  const combinedRef = (ref || internalRef) as React.RefObject<HTMLDivElement>;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (combinedRef.current && !combinedRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [combinedRef]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  };

  const handleSelectPlace = (place: Place) => {
    navigate(`/place/${place.id}`);
    setIsOpen(false);
    setQuery('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const showSuggestions = isOpen && query.trim().length >= 2;

  return (
    <div ref={combinedRef} className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder="Where do you want to go?"
            className="w-full h-12 sm:h-14 pl-12 pr-10 rounded-full bg-white/95 backdrop-blur-sm border-0 shadow-lg text-foreground placeholder:text-muted-foreground/80 text-base"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
          {matchingPlaces.length > 0 ? (
            <>
              {matchingPlaces.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => handleSelectPlace(place)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-place-name text-foreground">{place.name}</p>
                    <p className="text-secondary text-muted-foreground">{place.primaryCategory}</p>
                  </div>
                  <WeatherBadge 
                    latitude={place.latitude} 
                    longitude={place.longitude} 
                    variant="compact"
                    className="flex-shrink-0"
                  />
                </button>
              ))}
              
              {/* Search all results option */}
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors border-t border-border bg-muted/30"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Search className="w-4 h-4 text-accent" />
                </div>
                <p className="text-sm text-foreground">
                  Search for "<span className="font-medium">{query}</span>"
                </p>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Search className="w-4 h-4 text-accent" />
              </div>
              <p className="text-sm text-foreground">
                Search for "<span className="font-medium">{query}</span>"
              </p>
            </button>
          )}
        </div>
      )}
    </div>
  );
});
