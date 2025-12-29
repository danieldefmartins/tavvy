import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { ReviewerMedal } from '@/components/ReviewerMedalBadge';

export type ReviewDimension = 
  | 'quality' 
  | 'service' 
  | 'value' 
  | 'cleanliness' 
  | 'location' 
  | 'comfort' 
  | 'reliability' 
  | 'speed' 
  | 'restrictions';

export type SignalPolarity = 'positive' | 'improvement' | 'neutral';

export interface ReviewSignal {
  dimension: ReviewDimension;
  polarity: SignalPolarity;
  level: number;
  stamp_id?: string;
}

export interface Review {
  id: string;
  place_id: string;
  user_id: string;
  note_public: string | null;
  note_private: string | null;
  created_at: string;
  updated_at: string;
  signals: ReviewSignal[];
  user_display_name?: string;
  trusted_contributor?: boolean;
  reviewer_medal?: ReviewerMedal;
}

export interface DimensionSummary {
  dimension: ReviewDimension;
  count: number;
  avgLevel: number;
  totalScore: number;
  totalVotes: number;
}

export interface StampAggregate {
  dimension: ReviewDimension;
  polarity: SignalPolarity;
  total_votes: number;
  review_count: number;
  avg_intensity: number;
  stamp_id?: string;
}

export const REVIEW_DIMENSIONS: { id: ReviewDimension; label: string; icon: string }[] = [
  { id: 'quality', label: 'Quality', icon: 'Star' },
  { id: 'service', label: 'Service', icon: 'HandHeart' },
  { id: 'value', label: 'Value', icon: 'DollarSign' },
  { id: 'cleanliness', label: 'Cleanliness', icon: 'Sparkles' },
  { id: 'location', label: 'Location', icon: 'MapPin' },
  { id: 'comfort', label: 'Comfort', icon: 'Sofa' },
  { id: 'reliability', label: 'Reliability', icon: 'Shield' },
  { id: 'speed', label: 'Speed', icon: 'Zap' },
  { id: 'restrictions', label: 'Restrictions', icon: 'Ban' },
];

export function useReviews(placeId: string, isAdmin?: boolean) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['reviews', placeId, isAdmin],
    queryFn: async () => {
      let reviews: any[] = [];
      
      if (isAdmin) {
        // Admins can query the reviews table directly (RLS allows this)
        // This includes note_private for admin visibility
        const { data, error } = await supabase
          .from('reviews')
          .select(`
            id,
            place_id,
            user_id,
            note_public,
            note_private,
            created_at,
            updated_at,
            reviewer_medal
          `)
          .eq('place_id', placeId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // For admin view, we need to fetch profile info separately
        const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, trusted_contributor, reviewer_medal')
          .in('id', userIds);
        
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        
        reviews = (data || []).map((r: any) => ({
          ...r,
          user_display_name: profileMap.get(r.user_id)?.display_name,
          trusted_contributor: profileMap.get(r.user_id)?.trusted_contributor,
          current_reviewer_medal: profileMap.get(r.user_id)?.reviewer_medal,
        }));
      } else {
        // Use the public_reviews view which excludes note_private for security
        // This prevents exposing private notes to unauthorized users
        const { data, error } = await supabase
          .from('public_reviews')
          .select('*')
          .eq('place_id', placeId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        reviews = data || [];
      }

      const { data: signals, error: signalsError } = await supabase
        .from('review_signals')
        .select('*')
        .eq('place_id', placeId);

      if (signalsError) throw signalsError;

      const reviewsWithSignals: Review[] = reviews.map((review: any) => ({
        id: review.id,
        place_id: review.place_id,
        user_id: review.user_id,
        note_public: review.note_public,
        // note_private only included for admins (from reviews table)
        // Non-admins get null (from public_reviews view)
        note_private: review.note_private || null,
        created_at: review.created_at,
        updated_at: review.updated_at,
        user_display_name: review.user_display_name,
        trusted_contributor: review.trusted_contributor,
        // Use current medal from profile, fallback to medal at time of review
        reviewer_medal: (review.current_reviewer_medal || review.reviewer_medal || 'none') as ReviewerMedal,
        signals: (signals || [])
          .filter((s: any) => s.review_id === review.id)
          .map((s: any) => ({
            dimension: s.dimension as ReviewDimension,
            polarity: s.polarity as SignalPolarity,
            level: s.level,
            stamp_id: s.stamp_id,
          })),
      }));

      return reviewsWithSignals;
    },
    enabled: !!placeId,
  });
}

export function useMyReview(placeId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-review', placeId, user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select('*')
        .eq('place_id', placeId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (reviewError) throw reviewError;
      if (!review) return null;

      const { data: signals, error: signalsError } = await supabase
        .from('review_signals')
        .select('*')
        .eq('review_id', review.id);

      if (signalsError) throw signalsError;

      return {
        ...review,
        signals: (signals || []).map((s: any) => ({
          dimension: s.dimension as ReviewDimension,
          polarity: s.polarity as SignalPolarity,
          level: s.level,
          stamp_id: s.stamp_id,
        })),
      };
    },
    enabled: !!placeId && !!user,
  });
}

// Fetch aggregated stamp data from the database (not calculated on frontend)
// Ranking: total_votes (primary), review_count (tie-breaker)
export function usePlaceStampAggregates(placeId: string) {
  return useQuery({
    queryKey: ['place-stamp-aggregates', placeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_stamp_aggregates')
        .select('dimension, polarity, total_votes, review_count, avg_intensity, stamp_id')
        .eq('place_id', placeId)
        .gte('total_votes', 1) // Show all stamps with at least 1 vote
        .order('total_votes', { ascending: false });

      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        avg_intensity: Number(d.avg_intensity) || 0,
      })) as StampAggregate[];
    },
    enabled: !!placeId,
  });
}

// Get place review count
export function usePlaceReviewCount(placeId: string) {
  return useQuery({
    queryKey: ['place-review-count', placeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('places')
        .select('review_count')
        .eq('id', placeId)
        .single();

      if (error) throw error;
      return data?.review_count || 0;
    },
    enabled: !!placeId,
  });
}

// Legacy hook - now uses aggregated data from DB
export function usePlaceSignalSummary(placeId: string) {
  const { data: aggregates, isLoading } = usePlaceStampAggregates(placeId);

  return useQuery({
    queryKey: ['place-signals', placeId, aggregates],
    queryFn: async () => {
      if (!aggregates) return { knownFor: [], commonIssues: [] };

      const positive = aggregates
        .filter(a => a.polarity === 'positive')
        .map(a => ({
          dimension: a.dimension,
          count: a.review_count,
          avgLevel: a.review_count > 0 ? a.total_votes / a.review_count : 0,
          totalScore: a.total_votes,
          totalVotes: a.total_votes,
        }))
        .sort((a, b) => b.totalVotes - a.totalVotes);

      const improvement = aggregates
        .filter(a => a.polarity === 'improvement')
        .map(a => ({
          dimension: a.dimension,
          count: a.review_count,
          avgLevel: a.review_count > 0 ? a.total_votes / a.review_count : 0,
          totalScore: a.total_votes,
          totalVotes: a.total_votes,
        }))
        .sort((a, b) => b.totalVotes - a.totalVotes);

      return {
        knownFor: positive.slice(0, 3),
        commonIssues: improvement.slice(0, 2),
      };
    },
    enabled: !!placeId && !isLoading,
  });
}

interface CreateReviewData {
  placeId: string;
  notePublic: string;
  notePrivate: string;
  signals: ReviewSignal[];
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ placeId, notePublic, notePrivate, signals }: CreateReviewData) => {
      if (!user) throw new Error('Must be logged in');

      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          place_id: placeId,
          user_id: user.id,
          note_public: notePublic || null,
          note_private: notePrivate || null,
        })
        .select()
        .single();

      if (reviewError) throw reviewError;

      if (signals.length > 0) {
        const signalsToInsert = signals.map((s) => ({
          review_id: review.id,
          place_id: placeId,
          user_id: user.id,
          dimension: s.dimension,
          polarity: s.polarity,
          level: s.level,
          stamp_id: s.stamp_id || null,
        }));

        const { error: signalsError } = await supabase
          .from('review_signals')
          .insert(signalsToInsert);

        if (signalsError) throw signalsError;
      }

      return review;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.placeId] });
      queryClient.invalidateQueries({ queryKey: ['my-review', variables.placeId] });
      queryClient.invalidateQueries({ queryKey: ['place-signals', variables.placeId] });
      queryClient.invalidateQueries({ queryKey: ['place-stamp-aggregates', variables.placeId] });
      queryClient.invalidateQueries({ queryKey: ['place-review-count', variables.placeId] });
      queryClient.invalidateQueries({ queryKey: ['muvo-score', variables.placeId] });
      queryClient.invalidateQueries({ queryKey: ['places'] });
      queryClient.invalidateQueries({ queryKey: ['place', variables.placeId] });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ reviewId, placeId, notePublic, notePrivate, signals }: CreateReviewData & { reviewId: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { error: reviewError } = await supabase
        .from('reviews')
        .update({
          note_public: notePublic || null,
          note_private: notePrivate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId);

      if (reviewError) throw reviewError;

      // Delete existing signals and insert new ones
      const { error: deleteError } = await supabase
        .from('review_signals')
        .delete()
        .eq('review_id', reviewId);

      if (deleteError) throw deleteError;

      if (signals.length > 0) {
        const signalsToInsert = signals.map((s) => ({
          review_id: reviewId,
          place_id: placeId,
          user_id: user.id,
          dimension: s.dimension,
          polarity: s.polarity,
          level: s.level,
          stamp_id: s.stamp_id || null,
        }));

        const { error: signalsError } = await supabase
          .from('review_signals')
          .insert(signalsToInsert);

        if (signalsError) throw signalsError;
      }

      return { reviewId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.placeId] });
      queryClient.invalidateQueries({ queryKey: ['my-review', variables.placeId] });
      queryClient.invalidateQueries({ queryKey: ['place-signals', variables.placeId] });
      queryClient.invalidateQueries({ queryKey: ['place-stamp-aggregates', variables.placeId] });
      queryClient.invalidateQueries({ queryKey: ['place-review-count', variables.placeId] });
      queryClient.invalidateQueries({ queryKey: ['muvo-score', variables.placeId] });
      queryClient.invalidateQueries({ queryKey: ['places'] });
      queryClient.invalidateQueries({ queryKey: ['place', variables.placeId] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, placeId }: { reviewId: string; placeId: string }) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
      return { reviewId, placeId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.placeId] });
      queryClient.invalidateQueries({ queryKey: ['my-review', variables.placeId] });
      queryClient.invalidateQueries({ queryKey: ['place-signals', variables.placeId] });
      queryClient.invalidateQueries({ queryKey: ['place-stamp-aggregates', variables.placeId] });
      queryClient.invalidateQueries({ queryKey: ['place-review-count', variables.placeId] });
      queryClient.invalidateQueries({ queryKey: ['muvo-score', variables.placeId] });
      queryClient.invalidateQueries({ queryKey: ['places'] });
      queryClient.invalidateQueries({ queryKey: ['place', variables.placeId] });
    },
  });
}
