import React from 'react';
import { usePlaceStampAggregates, usePlaceReviewCount } from '@/hooks/useReviews';
import { useAllStamps, getStampLabel } from '@/hooks/useStamps';
import { ThumbsUp, AlertTriangle, MessageSquareText, CheckCircle } from 'lucide-react';

interface PlaceSignalSummaryProps {
  placeId: string;
  showReviewCount?: boolean;
}

export function PlaceSignalSummary({ placeId, showReviewCount = true }: PlaceSignalSummaryProps) {
  const { data: aggregates, isLoading } = usePlaceStampAggregates(placeId);
  const { data: reviewCount } = usePlaceReviewCount(placeId);
  const { data: allStamps } = useAllStamps();

  if (isLoading || !aggregates) return null;

  // Sort by total_votes descending, then by review_count as tie-breaker
  const sortedAggregates = [...aggregates].sort((a, b) => {
    if (b.total_votes !== a.total_votes) return b.total_votes - a.total_votes;
    return b.review_count - a.review_count;
  });

  // Top 3 positive stamps
  const positiveStamps = sortedAggregates
    .filter(a => a.polarity === 'positive')
    .slice(0, 3);

  // Top 1 improvement stamp
  const improvementStamps = sortedAggregates
    .filter(a => a.polarity === 'improvement')
    .slice(0, 1);

  const hasPositive = positiveStamps.length > 0;
  const hasIssues = improvementStamps.length > 0;

  if (!hasPositive && !hasIssues) return null;

  return (
    <div className="space-y-4">
      {/* Review Count Header */}
      {showReviewCount && reviewCount !== undefined && reviewCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2 border-b border-border">
          <MessageSquareText className="h-4 w-4" />
          <span>
            {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      )}

      {hasPositive && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <ThumbsUp className="h-4 w-4" />
            <span className="font-medium text-sm">Known for</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {positiveStamps.map((stamp) => {
              const label = stamp.stamp_id 
                ? getStampLabel(allStamps, stamp.stamp_id)
                : stamp.dimension;
              
              return (
                <div
                  key={stamp.stamp_id || stamp.dimension}
                  className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-primary/70">({stamp.total_votes})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasIssues && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[hsl(var(--signal-negative))]">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium text-sm">Needs attention</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {improvementStamps.map((stamp) => {
              const label = stamp.stamp_id 
                ? getStampLabel(allStamps, stamp.stamp_id)
                : stamp.dimension;
              
              return (
                <div
                  key={stamp.stamp_id || stamp.dimension}
                  className="flex items-center gap-1.5 bg-[hsl(var(--signal-negative-tint))] text-[hsl(var(--signal-negative-text))] px-3 py-1.5 rounded-full"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-[hsl(var(--signal-negative))]/70">({stamp.total_votes})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}