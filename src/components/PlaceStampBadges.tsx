import React from 'react';
import * as LucideIcons from 'lucide-react';
import { usePlaceStampAggregates, usePlaceReviewCount } from '@/hooks/useReviews';
import { useAllStamps, getStampLabel, type StampDefinition } from '@/hooks/useStamps';
import { CheckCircle, AlertTriangle, MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';

function getStampIcon(stamps: StampDefinition[] | undefined, stampId: string): React.ComponentType<any> {
  const stamp = stamps?.find(s => s.id === stampId);
  if (stamp?.icon) {
    const IconComponent = (LucideIcons as any)[stamp.icon];
    if (IconComponent) return IconComponent;
  }
  return CheckCircle;
}

interface PlaceStampBadgesProps {
  placeId: string;
  maxGood?: number;
  maxBad?: number;
  showReviewCount?: boolean;
  variant?: 'default' | 'compact' | 'overlay';
  className?: string;
}

export const PlaceStampBadges = React.forwardRef<HTMLDivElement, PlaceStampBadgesProps>(
  function PlaceStampBadges(
    {
      placeId,
      maxGood = 3,
      maxBad = 1,
      showReviewCount = true,
      variant = 'default',
      className,
    }: PlaceStampBadgesProps,
    ref,
  ) {
    const { data: aggregates, isLoading } = usePlaceStampAggregates(placeId);
    const { data: reviewCount } = usePlaceReviewCount(placeId);
    const { data: allStamps } = useAllStamps();

    if (isLoading || !aggregates || aggregates.length === 0) return null;

    // Sort by total_votes descending, then review_count as tie-breaker
    const sortedAggregates = [...aggregates].sort((a, b) => {
      if (b.total_votes !== a.total_votes) return b.total_votes - a.total_votes;
      return b.review_count - a.review_count;
    });

    const positiveStamps = sortedAggregates
      .filter((a) => a.polarity === 'positive')
      .slice(0, maxGood);

    // Neutral stamps - always show between positive and negative
    const neutralStamps = sortedAggregates
      .filter((a) => a.polarity === 'neutral')
      .slice(0, 1); // Show top 1 neutral on cards

    // HIDE negative/improvement stamps on list cards (variant != 'default')
    // Only show on full detail page (default variant) when there's enough positive signal
    const showImprovementStamps = variant === 'default' && positiveStamps.length >= 2;
    const improvementStamps = showImprovementStamps
      ? sortedAggregates.filter((a) => a.polarity === 'improvement').slice(0, maxBad)
      : [];

    if (positiveStamps.length === 0 && neutralStamps.length === 0 && improvementStamps.length === 0) return null;

    const isOverlay = variant === 'overlay';
    const isCompact = variant === 'compact';

    return (
      <div ref={ref} className={cn('flex flex-col gap-2', className)}>
        {/* Review count */}
        {showReviewCount && reviewCount !== undefined && reviewCount > 0 && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs',
              isOverlay ? 'text-white/90' : 'text-muted-foreground',
            )}
          >
            <MessageSquareText className="w-3 h-3" />
            <span>{reviewCount}</span>
          </div>
        )}

        {/* Positive stamps - show ×N for intensity (avg rounded) */}
        {positiveStamps.map((stamp) => {
          const label = stamp.stamp_id ? getStampLabel(allStamps, stamp.stamp_id) : stamp.dimension;
          const intensity = Math.round(stamp.avg_intensity || 1); // Rounded intensity level
          const IconComponent = stamp.stamp_id ? getStampIcon(allStamps, stamp.stamp_id) : CheckCircle;

          return (
            <div
              key={stamp.stamp_id || `${stamp.dimension}-positive`}
              className={cn(
                'flex items-center justify-center gap-1 rounded-full font-semibold min-w-[192px] w-48 bg-[hsl(var(--signal-positive))] text-white',
                isCompact ? 'px-2.5 py-1.5' : 'px-2.5 py-1',
              )}
              title={`${label}${intensity > 1 ? ` ×${intensity}` : ''}`}
            >
              <IconComponent
                className={cn('flex-shrink-0', isCompact ? 'w-5 h-5' : 'w-4 h-4')}
                strokeWidth={2.5}
              />
              {!isCompact && (
                <>
                  <span className="text-sm font-medium">{label}</span>
                  {intensity > 1 && <span className="text-sm font-bold">×{intensity}</span>}
                </>
              )}
            </div>
          );
        })}

        {/* Neutral stamps - style/vibe indicators */}
        {neutralStamps.map((stamp) => {
          const label = stamp.stamp_id ? getStampLabel(allStamps, stamp.stamp_id) : stamp.dimension;
          const intensity = Math.round(stamp.avg_intensity || 1);
          const IconComponent = stamp.stamp_id ? getStampIcon(allStamps, stamp.stamp_id) : CheckCircle;

          return (
            <div
              key={stamp.stamp_id || `${stamp.dimension}-neutral`}
              className={cn(
                'flex items-center justify-center gap-1 rounded-full font-semibold min-w-[192px] w-48 bg-[hsl(var(--signal-neutral))] text-white',
                isCompact ? 'px-2.5 py-1.5' : 'px-2.5 py-1',
              )}
              title={`${label}${intensity > 1 ? ` ×${intensity}` : ''}`}
            >
              <IconComponent
                className={cn('flex-shrink-0', isCompact ? 'w-5 h-5' : 'w-4 h-4')}
                strokeWidth={2.5}
              />
              {!isCompact && (
                <>
                  <span className="text-sm font-medium">{label}</span>
                  {intensity > 1 && <span className="text-sm font-bold">×{intensity}</span>}
                </>
              )}
            </div>
          );
        })}

        {/* Improvement stamps - show ×N for intensity (avg rounded) */}
        {improvementStamps.map((stamp) => {
          const label = stamp.stamp_id ? getStampLabel(allStamps, stamp.stamp_id) : stamp.dimension;
          const intensity = Math.round(stamp.avg_intensity || 1);
          const IconComponent = stamp.stamp_id ? getStampIcon(allStamps, stamp.stamp_id) : AlertTriangle;

          return (
            <div
              key={stamp.stamp_id || `${stamp.dimension}-improvement`}
              className={cn(
                'flex items-center justify-center gap-1 rounded-full font-semibold min-w-[192px] w-48 bg-[hsl(var(--signal-negative))] text-white',
                isCompact ? 'px-2.5 py-1.5' : 'px-2.5 py-1',
              )}
              title={`${label}${intensity > 1 ? ` ×${intensity}` : ''}`}
            >
              <IconComponent
                className={cn('flex-shrink-0', isCompact ? 'w-5 h-5' : 'w-4 h-4')}
                strokeWidth={2.5}
              />
              {!isCompact && (
                <>
                  <span className="text-sm font-medium">{label}</span>
                  {intensity > 1 && <span className="text-sm font-bold">×{intensity}</span>}
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  },
);

PlaceStampBadges.displayName = 'PlaceStampBadges';