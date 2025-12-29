import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { ContributorLevelBadge } from '@/components/ContributorLevelBadge';
import { ReviewerMedalBadge } from '@/components/ReviewerMedalBadge';
import { formatDistanceToNow, format } from 'date-fns';
import { MapPin, Calendar, MessageSquare, Plus, ChevronRight } from 'lucide-react';
import type { ContributorLevel, TravelerType } from '@/hooks/useAuth';

const TRAVELER_TYPE_LABELS: Record<TravelerType, { label: string; icon: string }> = {
  rv_full_timer: { label: 'RV Full-Timer', icon: '🚐' },
  weekend_rver: { label: 'Weekend RVer', icon: '🏕️' },
  van_life: { label: 'Van Life', icon: '🚌' },
  tent_camper: { label: 'Tent Camper', icon: '⛺' },
  just_exploring: { label: 'Just Exploring', icon: '🧭' },
};

interface PublicProfile {
  id: string;
  username: string;
  full_name: string;
  traveler_type: TravelerType | null;
  home_base: string | null;
  contributor_level: ContributorLevel;
  total_reviews_count: number;
  reviewer_medal: 'none' | 'bronze' | 'silver' | 'gold';
  trusted_contributor: boolean;
  created_at: string;
}

interface UserReview {
  id: string;
  place_id: string;
  place_name: string;
  place_category: string;
  note_public: string | null;
  created_at: string;
  signals: { dimension: string; polarity: string; level: number }[];
}

interface UserPlace {
  id: string;
  name: string;
  primary_category: string;
  city: string | null;
  state: string | null;
  is_verified: boolean;
  review_count: number;
  created_at: string;
}

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  // Fetch public profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, traveler_type, home_base, contributor_level, total_reviews_count, reviewer_medal, trusted_contributor, created_at')
        .eq('username', username?.toLowerCase())
        .maybeSingle();

      if (error) throw error;
      return data as PublicProfile | null;
    },
    enabled: !!username,
  });

  // Fetch user's reviews
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['user-reviews', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          place_id,
          note_public,
          created_at,
          places!inner(name, primary_category)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (reviewsError) throw reviewsError;

      // Fetch signals for each review
      const reviewIds = reviewsData?.map(r => r.id) || [];
      const { data: signalsData } = await supabase
        .from('review_signals')
        .select('review_id, dimension, polarity, level')
        .in('review_id', reviewIds);

      const signalsByReview = (signalsData || []).reduce((acc, sig) => {
        if (!acc[sig.review_id]) acc[sig.review_id] = [];
        acc[sig.review_id].push(sig);
        return acc;
      }, {} as Record<string, typeof signalsData>);

      return (reviewsData || []).map(r => ({
        id: r.id,
        place_id: r.place_id,
        place_name: (r.places as any)?.name || 'Unknown',
        place_category: (r.places as any)?.primary_category || 'Unknown',
        note_public: r.note_public,
        created_at: r.created_at,
        signals: signalsByReview[r.id] || [],
      })) as UserReview[];
    },
    enabled: !!profile?.id,
  });

  // Fetch places added by user
  const { data: places, isLoading: placesLoading } = useQuery({
    queryKey: ['user-places', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('places')
        .select('id, name, primary_category, city, state, is_verified, review_count, created_at')
        .eq('created_by_user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as UserPlace[];
    },
    enabled: !!profile?.id,
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack />
        <main className="container px-4 py-6 max-w-lg mx-auto">
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack />
        <main className="container px-4 py-8 max-w-lg mx-auto text-center">
          <h1 className="text-xl font-semibold mb-2">User not found</h1>
          <p className="text-muted-foreground mb-4">
            The profile @{username} doesn't exist.
          </p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </main>
      </div>
    );
  }

  const travelerInfo = profile.traveler_type ? TRAVELER_TYPE_LABELS[profile.traveler_type] : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header showBack />
      
      <main className="container px-4 py-6 max-w-lg mx-auto">
        {/* Profile Header Card */}
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="text-xl font-semibold">{profile.full_name}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>
              <ContributorLevelBadge level={profile.contributor_level} />
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap gap-2 mb-4">
              {travelerInfo && (
                <Badge variant="secondary" className="gap-1">
                  <span>{travelerInfo.icon}</span>
                  {travelerInfo.label}
                </Badge>
              )}
              {profile.reviewer_medal && profile.reviewer_medal !== 'none' && (
                <ReviewerMedalBadge medal={profile.reviewer_medal} size="sm" />
              )}
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {profile.home_base && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {profile.home_base}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Member since {format(new Date(profile.created_at), 'MMM yyyy')}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-4 pt-4 border-t">
              <div>
                <p className="text-2xl font-bold">{profile.total_reviews_count}</p>
                <p className="text-xs text-muted-foreground">Reviews</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{places?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Places Added</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Reviews and Places */}
        <Tabs defaultValue="reviews" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reviews" className="gap-1">
              <MessageSquare className="w-4 h-4" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="places" className="gap-1">
              <Plus className="w-4 h-4" />
              Places
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="mt-4 space-y-3">
            {reviewsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : reviews && reviews.length > 0 ? (
              reviews.map((review) => (
                <Card 
                  key={review.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/place/${review.place_id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{review.place_name}</h3>
                        <p className="text-xs text-muted-foreground">{review.place_category}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                    
                    {/* Signals */}
                    {review.signals.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {review.signals.slice(0, 4).map((sig, idx) => (
                          <Badge 
                            key={idx} 
                            variant="secondary"
                            className={`text-xs ${sig.polarity === 'positive' ? 'bg-primary/10 text-primary' : 'bg-[hsl(var(--signal-neutral-tint))] text-[hsl(var(--signal-neutral-text))]'}`}
                          >
                            {sig.dimension}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {review.note_public && (
                      <p className="text-sm mt-2 line-clamp-2">{review.note_public}</p>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No reviews yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="places" className="mt-4 space-y-3">
            {placesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : places && places.length > 0 ? (
              places.map((place) => (
                <Card 
                  key={place.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/place/${place.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{place.name}</h3>
                          {place.is_verified && (
                            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{place.primary_category}</p>
                        {(place.city || place.state) && (
                          <p className="text-xs text-muted-foreground">
                            {[place.city, place.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{place.review_count} reviews</span>
                      <span>{formatDistanceToNow(new Date(place.created_at), { addSuffix: true })}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Plus className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No places added yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
