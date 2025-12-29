import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MuvoMedalLevel } from '@/hooks/useMuvoScore';

export interface ReviewFiltersState {
  positiveStamps: string[];  // What people liked - boost places with these
  neutralStamps: string[];   // Place feels like - boost places with these
  negativeStamps: string[];  // Avoid places with - penalize places with these
  medalLevels: MuvoMedalLevel[];  // Filter by medal level
  minMuvoScore: number | null;    // Minimum MUVO score
  // v1.8 Membership filters
  membershipFilter: 'all' | 'included_only';
  selectedMemberships: string[];
}

export const DEFAULT_REVIEW_FILTERS: ReviewFiltersState = {
  positiveStamps: [],
  neutralStamps: [],
  negativeStamps: [],
  medalLevels: [],
  minMuvoScore: null,
  membershipFilter: 'all',
  selectedMemberships: [],
};

export interface PlaceStampData {
  placeId: string;
  positiveStamps: Map<string, number>; // stampId -> vote count
  neutralStamps: Map<string, number>;
  negativeStamps: Map<string, number>;
}

// Fetch all place stamp aggregates for filtering
export function usePlaceStampAggregatesAll() {
  return useQuery({
    queryKey: ['all-place-stamp-aggregates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_stamp_aggregates')
        .select('place_id, stamp_id, polarity, total_votes')
        .gte('total_votes', 2); // Noise filter

      if (error) throw error;

      // Group by place_id
      const placeStampMap = new Map<string, PlaceStampData>();

      (data || []).forEach((row) => {
        if (!row.stamp_id) return;
        
        let placeData = placeStampMap.get(row.place_id);
        if (!placeData) {
          placeData = {
            placeId: row.place_id,
            positiveStamps: new Map(),
            neutralStamps: new Map(),
            negativeStamps: new Map(),
          };
          placeStampMap.set(row.place_id, placeData);
        }

        if (row.polarity === 'positive') {
          placeData.positiveStamps.set(row.stamp_id, row.total_votes);
        } else if (row.polarity === 'neutral') {
          placeData.neutralStamps.set(row.stamp_id, row.total_votes);
        } else if (row.polarity === 'improvement') {
          placeData.negativeStamps.set(row.stamp_id, row.total_votes);
        }
      });

      return placeStampMap;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// Score places by how well they match filters (higher = better match)
export interface PlaceFilterScore {
  placeId: string;
  score: number;
  matchedPositive: { stampId: string; votes: number }[];
  matchedNeutral: { stampId: string; votes: number }[];
  matchedNegative: { stampId: string; votes: number }[];
  hasExcludedNegative: boolean; // True if place should be hidden due to negative exclusion
}

export function scorePlacesByReviews(
  placeIds: string[],
  stampData: Map<string, PlaceStampData> | undefined,
  filters: ReviewFiltersState
): Map<string, PlaceFilterScore> {
  const scores = new Map<string, PlaceFilterScore>();
  
  placeIds.forEach((placeId) => {
    const data = stampData?.get(placeId);
    let score = 0;
    const matchedPositive: { stampId: string; votes: number }[] = [];
    const matchedNeutral: { stampId: string; votes: number }[] = [];
    const matchedNegative: { stampId: string; votes: number }[] = [];
    let hasExcludedNegative = false;

    // Positive stamps boost score
    filters.positiveStamps.forEach((stampId) => {
      const votes = data?.positiveStamps.get(stampId);
      if (votes) {
        score += votes * 2; // Weight positive matches heavily
        matchedPositive.push({ stampId, votes });
      }
    });

    // Neutral stamps boost score (lighter weight)
    filters.neutralStamps.forEach((stampId) => {
      const votes = data?.neutralStamps.get(stampId);
      if (votes) {
        score += votes; // Neutral has moderate weight
        matchedNeutral.push({ stampId, votes });
      }
    });

    // Negative stamps act as EXCLUSIONS - places with these are hidden
    filters.negativeStamps.forEach((stampId) => {
      const votes = data?.negativeStamps.get(stampId);
      if (votes && votes >= 2) { // Only exclude if signal has meaningful votes
        hasExcludedNegative = true;
        matchedNegative.push({ stampId, votes });
      }
    });

    scores.set(placeId, {
      placeId,
      score,
      matchedPositive,
      matchedNeutral,
      matchedNegative,
      hasExcludedNegative,
    });
  });

  return scores;
}

// Medal level hierarchy for filtering
const MEDAL_HIERARCHY: Record<MuvoMedalLevel, number> = {
  'none': 0,
  'bronze': 1,
  'silver': 2,
  'gold': 3,
  'platinum': 4,
};

// Filter and rank places by review signals, medals, and score
export function rankPlacesByReviews(
  placeIds: string[],
  stampData: Map<string, PlaceStampData> | undefined,
  filters: ReviewFiltersState,
  placeMedalLevels?: Map<string, MuvoMedalLevel>,
  placeMuvoScores?: Map<string, number | null>
): { rankedIds: string[]; scores: Map<string, PlaceFilterScore>; excludedCount: number } {
  const hasActiveFilters = 
    filters.positiveStamps.length > 0 || 
    filters.neutralStamps.length > 0 || 
    filters.negativeStamps.length > 0 ||
    filters.medalLevels.length > 0 ||
    filters.minMuvoScore !== null;

  const scores = scorePlacesByReviews(placeIds, stampData, filters);

  if (!hasActiveFilters) {
    return { rankedIds: placeIds, scores, excludedCount: 0 };
  }

  let excludedCount = 0;
  const filteredIds = placeIds.filter((id) => {
    const placeScore = scores.get(id);
    
    // Check if excluded by negative stamps
    if (placeScore?.hasExcludedNegative) {
      excludedCount++;
      return false;
    }

    // Check medal level filter
    if (filters.medalLevels.length > 0 && placeMedalLevels) {
      const placeMedal = placeMedalLevels.get(id) || 'none';
      if (!filters.medalLevels.includes(placeMedal)) {
        excludedCount++;
        return false;
      }
    }

    // Check minimum MUVO score filter
    if (filters.minMuvoScore !== null && placeMuvoScores) {
      const placeScore = placeMuvoScores.get(id);
      if (placeScore === null || placeScore === undefined || placeScore < filters.minMuvoScore) {
        excludedCount++;
        return false;
      }
    }

    return true;
  });

  // Sort by score descending (places with better filter matches first)
  const rankedIds = [...filteredIds].sort((a, b) => {
    const scoreA = scores.get(a)?.score || 0;
    const scoreB = scores.get(b)?.score || 0;
    return scoreB - scoreA;
  });

  return { rankedIds, scores, excludedCount };
}

// Check if a place should be excluded based on negative filters
export function isPlaceExcludedByNegatives(
  placeId: string,
  stampData: Map<string, PlaceStampData> | undefined,
  negativeStamps: string[]
): boolean {
  if (negativeStamps.length === 0) return false;
  
  const data = stampData?.get(placeId);
  if (!data) return false;
  
  return negativeStamps.some((stampId) => {
    const votes = data.negativeStamps.get(stampId);
    return votes && votes >= 2; // Only exclude if signal has meaningful votes
  });
}

// Count active review filters
export function countActiveReviewFilters(filters: ReviewFiltersState): number {
  return (
    filters.positiveStamps.length +
    filters.neutralStamps.length +
    filters.negativeStamps.length +
    filters.medalLevels.length +
    (filters.minMuvoScore !== null ? 1 : 0) +
    (filters.membershipFilter === 'included_only' ? 1 : 0) +
    filters.selectedMemberships.length
  );
}

// Get matching signals for a place (for filter transparency)
export function getMatchingSignals(
  placeId: string,
  stampData: Map<string, PlaceStampData> | undefined,
  filters: ReviewFiltersState
): { positive: { id: string; votes: number }[]; neutral: { id: string; votes: number }[]; negative: { id: string; votes: number }[] } {
  const data = stampData?.get(placeId);
  
  const positive = filters.positiveStamps
    .map(id => ({ id, votes: data?.positiveStamps.get(id) || 0 }))
    .filter(s => s.votes > 0);
  
  const neutral = filters.neutralStamps
    .map(id => ({ id, votes: data?.neutralStamps.get(id) || 0 }))
    .filter(s => s.votes > 0);
  
  const negative = filters.negativeStamps
    .map(id => ({ id, votes: data?.negativeStamps.get(id) || 0 }))
    .filter(s => s.votes > 0);

  return { positive, neutral, negative };
}
