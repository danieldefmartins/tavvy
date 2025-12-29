import { useState, useMemo } from 'react';
import { usePlaceStampAggregates } from '@/hooks/useReviews';
import { useAllStamps, getStampLabel } from '@/hooks/useStamps';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, ThumbsUp, Sparkles, AlertTriangle } from 'lucide-react';

interface MuvoReviewSimpleProps {
  placeId: string;
  className?: string;
}

interface ReviewItem {
  label: string;
  votes: number;
}

/**
 * MUVO v1.8.1 - Simplified 3-Line Review Display
 * 
 * STRICT 3-LINE STRUCTURE:
 * LINE 1 — POSITIVE (What stood out) - soft green
 * LINE 2 — NEUTRAL (How this place feels) - soft beige/warm
 * LINE 3 — NEGATIVE (What didn't go well) - soft coral
 * 
 * Each line shows TOP 1 signal only with expand option.
 * If no data, line is hidden (not shown).
 */
export function MuvoReviewSimple({ placeId, className }: MuvoReviewSimpleProps) {
  const { data: aggregates, isLoading } = usePlaceStampAggregates(placeId);
  const { data: allStamps } = useAllStamps();
  
  const [expandedSection, setExpandedSection] = useState<'positive' | 'neutral' | 'negative' | null>(null);

  const reviewData = useMemo(() => {
    if (!aggregates || aggregates.length === 0) {
      return { positive: [], neutral: [], negative: [] };
    }

    // Get ALL items sorted by votes
    const positiveItems: ReviewItem[] = aggregates
      .filter(a => a.polarity === 'positive')
      .sort((a, b) => b.total_votes - a.total_votes)
      .map(a => ({
        label: a.stamp_id ? getStampLabel(allStamps, a.stamp_id) : a.dimension,
        votes: a.total_votes,
      }));

    const neutralItems: ReviewItem[] = aggregates
      .filter(a => a.polarity === 'neutral')
      .sort((a, b) => b.total_votes - a.total_votes)
      .map(a => ({
        label: a.stamp_id ? getStampLabel(allStamps, a.stamp_id) : a.dimension,
        votes: a.total_votes,
      }));

    const negativeItems: ReviewItem[] = aggregates
      .filter(a => a.polarity === 'improvement')
      .sort((a, b) => b.total_votes - a.total_votes)
      .map(a => ({
        label: a.stamp_id ? getStampLabel(allStamps, a.stamp_id) : a.dimension,
        votes: a.total_votes,
      }));

    return {
      positive: positiveItems,
      neutral: neutralItems,
      negative: negativeItems,
    };
  }, [aggregates, allStamps]);

  const toggleSection = (section: 'positive' | 'neutral' | 'negative') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="h-12 bg-muted/50 rounded-lg animate-pulse" />
        <div className="h-12 bg-muted/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  const hasAnyReviews = reviewData.positive.length > 0 || reviewData.neutral.length > 0 || reviewData.negative.length > 0;

  if (!hasAnyReviews) {
    return (
      <div className={cn("text-sm text-muted-foreground italic py-3", className)}>
        No reviews yet. Be the first to tap!
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* LINE 1: POSITIVE - MUVO Blue #008fc0 solid */}
      {reviewData.positive.length > 0 && (
        <ReviewLine
          type="positive"
          icon={<ThumbsUp className="w-4 h-4" />}
          topItem={reviewData.positive[0]}
          allItems={reviewData.positive}
          isExpanded={expandedSection === 'positive'}
          onToggle={() => toggleSection('positive')}
          bgClass="bg-[hsl(var(--signal-positive))]"
          textClass="text-white"
          iconClass="text-white"
        />
      )}

      {/* LINE 2: NEUTRAL - Gray-500 solid */}
      {reviewData.neutral.length > 0 && (
        <ReviewLine
          type="neutral"
          icon={<Sparkles className="w-4 h-4" />}
          topItem={reviewData.neutral[0]}
          allItems={reviewData.neutral}
          isExpanded={expandedSection === 'neutral'}
          onToggle={() => toggleSection('neutral')}
          bgClass="bg-[hsl(var(--signal-neutral))]"
          textClass="text-white"
          iconClass="text-white"
        />
      )}

      {/* LINE 3: NEGATIVE - Orange-500 solid */}
      {reviewData.negative.length > 0 && (
        <ReviewLine
          type="negative"
          icon={<AlertTriangle className="w-4 h-4" />}
          topItem={reviewData.negative[0]}
          allItems={reviewData.negative}
          isExpanded={expandedSection === 'negative'}
          onToggle={() => toggleSection('negative')}
          bgClass="bg-[hsl(var(--signal-negative))]"
          textClass="text-white"
          iconClass="text-white"
        />
      )}
    </div>
  );
}

interface ReviewLineProps {
  type: 'positive' | 'neutral' | 'negative';
  icon: React.ReactNode;
  topItem: ReviewItem;
  allItems: ReviewItem[];
  isExpanded: boolean;
  onToggle: () => void;
  bgClass: string;
  textClass: string;
  iconClass: string;
}

function ReviewLine({
  type,
  icon,
  topItem,
  allItems,
  isExpanded,
  onToggle,
  bgClass,
  textClass,
  iconClass,
}: ReviewLineProps) {
  const hasMore = allItems.length > 1;
  
  return (
    <div className={cn("rounded-lg transition-all", bgClass)}>
      {/* Main collapsed line */}
      <div 
        className={cn(
          "flex items-center justify-between px-3 py-2.5 cursor-pointer",
          hasMore && "hover:opacity-80"
        )}
        onClick={hasMore ? onToggle : undefined}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={cn("flex-shrink-0", iconClass)}>{icon}</span>
          <span className={cn("font-medium truncate", textClass)}>
            {topItem.label}
          </span>
          <span className={cn("font-bold flex-shrink-0", textClass)}>
            ×{topItem.votes}
          </span>
        </div>
        
        {hasMore && (
          <button 
            className={cn("flex items-center gap-1 text-xs flex-shrink-0 ml-2", textClass, "opacity-70")}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isExpanded ? (
              <>
                <span className="hidden sm:inline">Less</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span className="hidden sm:inline">+{allItems.length - 1} more</span>
                <span className="sm:hidden">+{allItems.length - 1}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && hasMore && (
        <div className={cn("px-3 pb-2.5 pt-0 space-y-1.5 border-t border-white/20 mt-0")}>
          {allItems.slice(1).map((item, idx) => (
            <div 
              key={idx} 
              className={cn("flex items-center gap-2 pl-6 text-sm", textClass, "opacity-90")}
            >
              <span className="truncate">{item.label}</span>
              <span className="font-semibold flex-shrink-0">×{item.votes}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
