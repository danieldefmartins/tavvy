import { useMemo } from 'react';
import { Place } from './usePlaces';

export function useSearchPlaces(places: Place[] | undefined, query: string): Place[] {
  return useMemo(() => {
    if (!places || !query.trim()) return places || [];
    
    const searchTerms = query.toLowerCase().trim().split(/\s+/);
    
    return places.filter((place) => {
      const searchableText = [
        place.name,
        place.primaryCategory,
        place.summary,
        ...place.features,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      
      // All search terms must be found somewhere in the searchable text
      return searchTerms.every((term) => searchableText.includes(term));
    });
  }, [places, query]);
}
