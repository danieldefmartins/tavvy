import { Link } from 'react-router-dom';
import { Place } from '@/hooks/usePlaces';
import { UniversalPlaceCard } from '@/components/UniversalPlaceCard';

interface TrendingSectionProps {
  places: Place[];
}

export function TrendingSection({ places }: TrendingSectionProps) {
  if (places.length === 0) return null;

  return (
    <section className="py-6 sm:py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Trending Near You
          </h2>
          <Link to="/places" className="text-sm font-medium text-primary hover:text-primary/80">
            See all
          </Link>
        </div>

        <div className="space-y-4">
          {places.slice(0, 4).map((place) => (
            <UniversalPlaceCard key={place.id} place={place} />
          ))}
        </div>
      </div>
    </section>
  );
}
