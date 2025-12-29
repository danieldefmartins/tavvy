import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { usePlaceStampAggregates } from '@/hooks/useReviews';
import { useAllStamps, getStampLabel } from '@/hooks/useStamps';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MuvoReviewExpandedProps {
  placeId: string;
  className?: string;
}

/**
 * MUVO v1.8.1 - Full Place Page Reviews Section (LOCKED)
 * 
 * STRICT 3-SECTION STRUCTURE (ORDER LOCKED):
 * 1. POSITIVE (What stood out) - Top 5 default
 * 2. NEUTRAL (How the place feels) - Top 3 default
 * 3. NEGATIVE (What didn't go well) - Top 2 default
 * 
 * VISIBILITY RULES:
 * - Sections ALWAYS appear in this order (Positive → Neutral → Negative)
 * - Sections NEVER overlap or reorder
 * - Each section visually separated
 * - Tap counts (×N) ALWAYS visible next to each label
 * - "Expand / See all" option for each section
 */
export function MuvoReviewExpanded({ placeId, className }: MuvoReviewExpandedProps) {
  const { data: aggregates, isLoading } = usePlaceStampAggregates(placeId);
  const { data: allStamps } = useAllStamps();
  
  const [showAllPositive, setShowAllPositive] = useState(false);
  const [showAllNeutral, setShowAllNeutral] = useState(false);
  const [showAllNegative, setShowAllNegative] = useState(false);

  const categorizedSignals = useMemo(() => {
    if (!aggregates || aggregates.length === 0) {
      return { positive: [], neutral: [], negative: [] };
    }

    const positive = aggregates
      .filter(a => a.polarity === 'positive')
      .sort((a, b) => b.total_votes - a.total_votes)
      .map(a => ({
        id: a.stamp_id || a.dimension,
        label: a.stamp_id ? getStampLabel(allStamps, a.stamp_id) : a.dimension,
        votes: a.total_votes,
      }));

    const neutral = aggregates
      .filter(a => a.polarity === 'neutral')
      .sort((a, b) => b.total_votes - a.total_votes)
      .map(a => ({
        id: a.stamp_id || a.dimension,
        label: a.stamp_id ? getStampLabel(allStamps, a.stamp_id) : a.dimension,
        votes: a.total_votes,
      }));

    const negative = aggregates
      .filter(a => a.polarity === 'improvement')
      .sort((a, b) => b.total_votes - a.total_votes)
      .map(a => ({
        id: a.stamp_id || a.dimension,
        label: a.stamp_id ? getStampLabel(allStamps, a.stamp_id) : a.dimension,
        votes: a.total_votes,
      }));

    return { positive, neutral, negative };
  }, [aggregates, allStamps]);

  if (isLoading) {
    return (
      <div className={cn("animate-pulse space-y-3", className)}>
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="h-8 bg-muted rounded w-2/3" />
      </div>
    );
  }

  const hasAnySignals = 
    categorizedSignals.positive.length > 0 || 
    categorizedSignals.neutral.length > 0 || 
    categorizedSignals.negative.length > 0;

  if (!hasAnySignals) {
    return (
      <div className={cn("text-center py-6", className)}>
        <p className="text-muted-foreground">No reviews yet</p>
        <p className="text-sm text-muted-foreground mt-1">Be the first to share what this place is like</p>
      </div>
    );
  }

  // Default visible counts per v1.8.1: Top 5 Positive, Top 3 Neutral, Top 2 Negative
  const visiblePositive = showAllPositive ? categorizedSignals.positive : categorizedSignals.positive.slice(0, 5);
  const visibleNeutral = showAllNeutral ? categorizedSignals.neutral : categorizedSignals.neutral.slice(0, 3);
  const visibleNegative = showAllNegative ? categorizedSignals.negative : categorizedSignals.negative.slice(0, 2);

  return (
    <div className={cn("space-y-6", className)}>
      {/* SECTION 1: POSITIVE - What stood out (always first) */}
      {categorizedSignals.positive.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ThumbsUp className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground text-base">What stood out</h4>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {visiblePositive.map(signal => (
              <span
                key={signal.id}
                className="inline-flex w-full items-center justify-between gap-2 px-3 py-2 rounded-full text-[15px] font-semibold bg-[hsl(var(--signal-positive))] text-white"
              >
                <span className="truncate">{signal.label}</span>
                <span className="ml-1 font-bold flex-shrink-0">×{signal.votes}</span>
              </span>
            ))}
          </div>
          {categorizedSignals.positive.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllPositive(!showAllPositive)}
              className="mt-2 text-sm text-primary h-auto py-1 px-2"
            >
              {showAllPositive ? (
                <>Show less <ChevronUp className="w-3.5 h-3.5 ml-1" /></>
              ) : (
                <>See all {categorizedSignals.positive.length} <ChevronDown className="w-3.5 h-3.5 ml-1" /></>
              )}
            </Button>
          )}
        </div>
      )}

      {/* SECTION 2: NEUTRAL - How the place feels (always second) */}
      {categorizedSignals.neutral.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-[hsl(var(--signal-neutral))]" />
            <h4 className="font-semibold text-foreground text-base">How this place feels</h4>
            <span className="text-sm text-muted-foreground">(style, not quality)</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {visibleNeutral.map(signal => (
              <span
                key={signal.id}
                className="inline-flex w-full items-center justify-between gap-2 px-3 py-2 rounded-full text-[15px] font-semibold bg-[hsl(var(--signal-neutral))] text-white"
              >
                <span className="truncate">{signal.label}</span>
                <span className="ml-1 font-bold flex-shrink-0">×{signal.votes}</span>
              </span>
            ))}
          </div>
          {categorizedSignals.neutral.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllNeutral(!showAllNeutral)}
              className="mt-2 text-sm text-primary h-auto py-1 px-2"
            >
              {showAllNeutral ? (
                <>Show less <ChevronUp className="w-3.5 h-3.5 ml-1" /></>
              ) : (
                <>See all {categorizedSignals.neutral.length} <ChevronDown className="w-3.5 h-3.5 ml-1" /></>
              )}
            </Button>
          )}
        </div>
      )}

      {/* SECTION 3: NEGATIVE - What didn't go well (always third) */}
      {categorizedSignals.negative.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ThumbsDown className="w-5 h-5 text-[hsl(var(--signal-negative))]" />
            <h4 className="font-semibold text-foreground text-base">What didn't go well</h4>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {visibleNegative.map(signal => (
              <span
                key={signal.id}
                className="inline-flex w-full items-center justify-between gap-2 px-3 py-2 rounded-full text-[15px] font-semibold bg-[hsl(var(--signal-negative))] text-white"
              >
                <span className="truncate">{signal.label}</span>
                <span className="ml-1 font-bold flex-shrink-0">×{signal.votes}</span>
              </span>
            ))}
          </div>
          {categorizedSignals.negative.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllNegative(!showAllNegative)}
              className="mt-2 text-sm text-primary h-auto py-1 px-2"
            >
              {showAllNegative ? (
                <>Show less <ChevronUp className="w-3.5 h-3.5 ml-1" /></>
              ) : (
                <>See all {categorizedSignals.negative.length} <ChevronDown className="w-3.5 h-3.5 ml-1" /></>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
