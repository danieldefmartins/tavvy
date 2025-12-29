import { useMemo } from 'react';
import { usePlaceStampAggregates } from '@/hooks/useReviews';
import { useAllStamps, getStampLabel } from '@/hooks/useStamps';
import { cn } from '@/lib/utils';

interface PlaceCardReviewLinesProps {
  placeId: string;
  className?: string;
}

/**
 * MUVO v1.8.1 - Place Card Review Display (LOCKED)
 * 
 * STRICT 3-LINE STRUCTURE:
 * - Line 1: POSITIVE (What stood out) - TOP 1 item
 * - Line 2: NEUTRAL (How the place feels) - TOP 1 item  
 * - Line 3: NEGATIVE (What didn't go well) - TOP 1 item (ONLY if exists)
 * 
 * VISIBILITY RULES:
 * - Tap counts (×N) ALWAYS visible
 * - Lines NEVER collapse into each other
 * - Lines NEVER reorder
 * - If no data: hide content but preserve order
 */
export function PlaceCardReviewLines({ placeId, className }: PlaceCardReviewLinesProps) {
  const { data: aggregates } = usePlaceStampAggregates(placeId);
  const { data: allStamps } = useAllStamps();

  const reviewLines = useMemo(() => {
    if (!aggregates || aggregates.length === 0) {
      return { positive: null, neutral: null, negative: null };
    }

    // TOP 1 POSITIVE
    const positiveData = aggregates
      .filter(a => a.polarity === 'positive')
      .sort((a, b) => b.total_votes - a.total_votes)[0];

    // TOP 1 NEUTRAL  
    const neutralData = aggregates
      .filter(a => a.polarity === 'neutral')
      .sort((a, b) => b.total_votes - a.total_votes)[0];

    // TOP 1 NEGATIVE
    const negativeData = aggregates
      .filter(a => a.polarity === 'improvement')
      .sort((a, b) => b.total_votes - a.total_votes)[0];

    return {
      positive: positiveData ? {
        label: positiveData.stamp_id ? getStampLabel(allStamps, positiveData.stamp_id) : positiveData.dimension,
        votes: positiveData.total_votes,
      } : null,
      neutral: neutralData ? {
        label: neutralData.stamp_id ? getStampLabel(allStamps, neutralData.stamp_id) : neutralData.dimension,
        votes: neutralData.total_votes,
      } : null,
      negative: negativeData ? {
        label: negativeData.stamp_id ? getStampLabel(allStamps, negativeData.stamp_id) : negativeData.dimension,
        votes: negativeData.total_votes,
      } : null,
    };
  }, [aggregates, allStamps]);

  // If no reviews at all, show nothing (cards will just show place info)
  const hasAnyReviews = reviewLines.positive || reviewLines.neutral || reviewLines.negative;
  if (!hasAnyReviews) return null;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {/* LINE 1: POSITIVE - Brand blue solid background */}
      {reviewLines.positive && (
        <div className="bg-[hsl(var(--signal-positive))] rounded px-2 py-0.5 truncate max-w-full">
          <span className="text-[13px] leading-tight font-semibold text-white truncate">
            {reviewLines.positive.label} <span className="font-bold">×{reviewLines.positive.votes}</span>
          </span>
        </div>
      )}

      {/* LINE 2: NEUTRAL - Gray solid background */}
      {reviewLines.neutral && (
        <div className="bg-[hsl(var(--signal-neutral))] rounded px-2 py-0.5 truncate max-w-full">
          <span className="text-[12px] leading-tight font-medium text-white/90 truncate">
            {reviewLines.neutral.label} <span className="font-bold">×{reviewLines.neutral.votes}</span>
          </span>
        </div>
      )}

      {/* LINE 3: NEGATIVE - Orange solid background, only shown if exists */}
      {reviewLines.negative && (
        <div className="bg-[hsl(var(--signal-negative))] rounded px-2 py-0.5 truncate max-w-full">
          <span className="text-[12px] leading-tight font-medium text-white truncate">
            {reviewLines.negative.label} <span className="font-bold">×{reviewLines.negative.votes}</span>
          </span>
        </div>
      )}
    </div>
  );
}
