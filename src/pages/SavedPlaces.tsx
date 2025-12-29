import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Header } from '@/components/Header';
import { PlaceCard } from '@/components/PlaceCard';
import { useSavedPlaces } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const SavedPlaces = () => {
  const { user, isVerified } = useAuth();
  const { data: places, isLoading, error } = useSavedPlaces();

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack />
        <main className="container px-4 py-12 max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">
            Sign in to save places
          </h2>
          <p className="text-muted-foreground mb-6">
            Create a free account to save your favorite RV spots.
          </p>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </main>
      </div>
    );
  }

  // Logged in but not verified
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack />
        <main className="container px-4 py-12 max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">
            Complete verification
          </h2>
          <p className="text-muted-foreground mb-6">
            Verify your email and phone to save places.
          </p>
          <Link to="/auth">
            <Button>Complete Verification</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header showBack />

      <main className="container px-4 py-4 max-w-lg mx-auto">
        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? 'Loading...'
              : `${places?.length || 0} saved place${places?.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
            <p className="text-sm text-destructive">Failed to load saved places. Please try again.</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && (!places || places.length === 0) && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">
              No saved places yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Tap the heart icon on any place to save it here.
            </p>
            <Link to="/places">
              <Button>Browse Places</Button>
            </Link>
          </div>
        )}

        {/* Places list */}
        {!isLoading && !error && places && places.length > 0 && (
          <div className="space-y-3">
            {places.map((place, index) => (
              <PlaceCard
                key={place.id}
                place={place}
                className="animate-fade-in"
                style={{ animationDelay: `${Math.min(index, 5) * 50}ms` }}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8 pb-4">
          Saved places are private and only visible to you.
        </p>
      </main>
    </div>
  );
};

export default SavedPlaces;
