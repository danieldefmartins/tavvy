import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, MapPin, LogOut, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Mock data - in production, fetch from Supabase
interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  review_count: number;
  joined_at: string;
}

interface UserReview {
  id: string;
  place_id: string;
  place_name: string;
  place_city: string;
  place_state: string;
  created_at: string;
  signals: Array<{
    emoji: string;
    name: string;
    category: string;
  }>;
}

const MOCK_USER: UserProfile = {
  id: '1',
  email: 'user@example.com',
  name: 'John Doe',
  review_count: 12,
  joined_at: '2024-01-15T00:00:00Z',
};

const MOCK_REVIEWS: UserReview[] = [
  {
    id: '1',
    place_id: '1',
    place_name: 'Mountain View Campground',
    place_city: 'Boulder',
    place_state: 'CO',
    created_at: '2024-12-20T10:30:00Z',
    signals: [
      { emoji: '👍', name: 'Beautiful Views', category: 'what_stood_out' },
      { emoji: '👍', name: 'Clean Bathrooms', category: 'what_stood_out' },
      { emoji: '⭐', name: 'Quiet', category: 'whats_it_like' },
      { emoji: '⚠️', name: 'Spotty WiFi', category: 'what_didnt_work' },
    ],
  },
  {
    id: '2',
    place_id: '2',
    place_name: 'The Rustic Table',
    place_city: 'Denver',
    place_state: 'CO',
    created_at: '2024-12-15T18:45:00Z',
    signals: [
      { emoji: '👍', name: 'Delicious Food', category: 'what_stood_out' },
      { emoji: '👍', name: 'Friendly Staff', category: 'what_stood_out' },
      { emoji: '⭐', name: 'Cozy', category: 'whats_it_like' },
    ],
  },
];

export function Profile() {
  const { toast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(MOCK_USER);
  const [reviews, setReviews] = useState<UserReview[]>(MOCK_REVIEWS);
  const [loading, setLoading] = useState(false);

  // In production, fetch from Supabase
  useEffect(() => {
    // const fetchUserData = async () => {
    //   setLoading(true);
    //   const { data: { user } } = await supabase.auth.getUser();
    //   if (!user) {
    //     navigate('/auth');
    //     return;
    //   }
    //   
    //   const { data: reviews } = await supabase
    //     .from('reviews')
    //     .select(`
    //       *,
    //       place:places(*),
    //       review_signals(
    //         signal:signals(*)
    //       )
    //     `)
    //     .eq('user_id', user.id)
    //     .order('created_at', { ascending: false });
    //   
    //   setReviews(reviews || []);
    //   setLoading(false);
    // };
    // fetchUserData();
  }, []);

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      // In production:
      // await supabase.from('reviews').delete().eq('id', reviewId);
      // await supabase.rpc('refresh_aggregated_signals');
      
      setReviews(reviews.filter(r => r.id !== reviewId));
      toast({
        title: 'Review deleted',
        description: 'Your review has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Error deleting review',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    // In production:
    // await supabase.auth.signOut();
    // navigate('/');
    toast({ title: 'Signed out successfully' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatJoinedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">Please sign in to view your profile</p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-[#008fc0] to-[#006a91] text-white px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name || 'User'}
                className="w-20 h-20 rounded-full border-4 border-white/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-10 h-10" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{user.name || 'MUVO User'}</h1>
              <p className="text-white/80">{user.email}</p>
              <p className="text-sm text-white/60 mt-1">
                Member since {formatJoinedDate(user.joined_at)}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-center">
            <div>
              <div className="text-3xl font-bold">{user.review_count}</div>
              <div className="text-sm text-white/80">Reviews</div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-4 max-w-2xl mx-auto">
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" onClick={handleSignOut} className="flex-1">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="px-4 py-4 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-4">Your Reviews</h2>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <p className="text-muted-foreground mb-4">You haven't left any reviews yet</p>
            <Button asChild>
              <Link to="/places">Discover Places</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="bg-card rounded-xl p-4 border border-border">
                {/* Place Info */}
                <div className="flex items-start justify-between mb-3">
                  <Link 
                    to={`/place/${review.place_id}`}
                    className="flex-1"
                  >
                    <h3 className="text-lg font-bold text-foreground hover:text-[#008fc0] transition-colors">
                      {review.place_name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>{review.place_city}, {review.place_state}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(review.created_at)}
                    </p>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteReview(review.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Signals */}
                <div className="flex flex-wrap gap-2">
                  {review.signals.map((signal, idx) => {
                    const colorClass = 
                      signal.category === 'what_stood_out' ? 'bg-[#008fc0]/10 text-[#008fc0]' :
                      signal.category === 'whats_it_like' ? 'bg-gray-500/10 text-gray-700 dark:text-gray-300' :
                      'bg-orange-500/10 text-orange-600 dark:text-orange-400';

                    return (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}
                      >
                        {signal.emoji} {signal.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
