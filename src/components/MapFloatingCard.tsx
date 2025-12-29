import { useNavigate } from 'react-router-dom';
import { Place } from '@/hooks/usePlaces';
import { cn } from '@/lib/utils';
import { ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { hapticLight } from '@/lib/haptics';
import { usePlaceStampAggregates, usePlaceReviewCount } from '@/hooks/useReviews';
import { useAllStamps, getStampLabel, type StampDefinition } from '@/hooks/useStamps';
import { useMemo } from 'react';

interface MapFloatingCardProps {
  place: Place;
  isSelected: boolean;
  onSelect: () => void;
  distance: number;
}

// Derive confidence label from review data
function getConfidenceLabel(reviewCount: number, positiveCount: number, improvementCount: number): {
  label: string;
  variant: 'positive' | 'neutral' | 'caution';
} {
  if (reviewCount === 0) {
    return { label: 'No reports yet', variant: 'neutral' };
  }
  
  if (reviewCount < 3) {
    return { label: 'Limited reports', variant: 'neutral' };
  }
  
  const ratio = positiveCount / (positiveCount + improvementCount + 1);
  
  if (ratio >= 0.7 && reviewCount >= 5) {
    return { label: 'Often recommended', variant: 'positive' };
  }
  
  if (ratio >= 0.5) {
    return { label: 'Good for overnight', variant: 'positive' };
  }
  
  if (ratio >= 0.3) {
    return { label: 'Mixed experiences', variant: 'neutral' };
  }
  
  return { label: 'Proceed with caution', variant: 'caution' };
}

// Determine micro tag
function getMicroTag(reviewCount: number): { label: string; icon: React.ComponentType<any> } | null {
  if (reviewCount >= 10) {
    return { label: 'Popular', icon: TrendingUp };
  }
  if (reviewCount >= 5) {
    return { label: 'Favorite', icon: Sparkles };
  }
  return null;
}

/**
 * MUVO v1.7 - Map Floating Card
 * Shows 3-line stacked review display per spec:
 * - Line 1: TOP 1 Positive (Label ×N)
 * - Line 2: TOP 1 Neutral (Label ×N) 
 * - Line 3: TOP 1 Negative (Label ×N) - omit if none
 */
export function MapFloatingCard({ place, isSelected, onSelect, distance }: MapFloatingCardProps) {
  const navigate = useNavigate();
  const { data: aggregates } = usePlaceStampAggregates(place.id);
  const { data: reviewCount = 0 } = usePlaceReviewCount(place.id);
  const { data: allStamps } = useAllStamps();

  // Get top signals for 3-line display
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

  // Get confidence label
  const confidenceInfo = useMemo(() => {
    const positiveCount = aggregates?.filter(a => a.polarity === 'positive').length || 0;
    const improvementCount = aggregates?.filter(a => a.polarity === 'improvement').length || 0;
    return getConfidenceLabel(reviewCount, positiveCount, improvementCount);
  }, [reviewCount, aggregates]);

  // Get micro tag
  const microTag = useMemo(() => getMicroTag(reviewCount), [reviewCount]);

  const hasAnyReviews = reviewLines.positive || reviewLines.neutral || reviewLines.negative;

  const handleClick = () => {
    hapticLight();
    if (isSelected) {
      navigate(`/place/${place.id}`);
    } else {
      onSelect();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex-shrink-0 w-[90vw] max-w-[380px] bg-card/98 backdrop-blur-md rounded-2xl cursor-pointer transition-all duration-200',
        isSelected ? 'ring-2 ring-primary' : ''
      )}
      style={{
        boxShadow: isSelected 
          ? '0 8px 32px -4px rgba(0, 0, 0, 0.4), 0 4px 12px -2px rgba(0, 0, 0, 0.2)' 
          : '0 6px 24px -4px rgba(0, 0, 0, 0.3), 0 2px 8px -2px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div className="p-4">
        {/* Row 1: Name + Verification + Micro Tag */}
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-bold text-[17px] leading-tight text-foreground line-clamp-1 flex-1">
            {place.name}
          </h3>
          {place.isVerified && (
            <ShieldCheck className="w-5 h-5 text-accent flex-shrink-0" />
          )}
          {microTag && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-[13px] font-medium flex-shrink-0">
              <microTag.icon className="w-3.5 h-3.5" />
              {microTag.label}
            </div>
          )}
        </div>

        {/* MUVO v1.7: 3-line stacked review display */}
        {hasAnyReviews && (
          <div className="flex flex-col gap-1 mb-2.5">
            {/* Line 1: Positive */}
            {reviewLines.positive && (
              <div className="text-[15px] font-semibold text-[hsl(var(--signal-positive-text))]">
                {reviewLines.positive.label} <span className="font-bold">×{reviewLines.positive.votes}</span>
              </div>
            )}
            {/* Line 2: Neutral */}
            {reviewLines.neutral && (
              <div className="text-[14px] font-medium text-[hsl(var(--signal-neutral-text))]">
                {reviewLines.neutral.label} <span className="font-bold">×{reviewLines.neutral.votes}</span>
              </div>
            )}
            {/* Line 3: Negative - only if exists */}
            {reviewLines.negative && (
              <div className="text-[14px] font-medium text-[hsl(var(--signal-negative-text))]">
                {reviewLines.negative.label} <span className="font-bold">×{reviewLines.negative.votes}</span>
              </div>
            )}
          </div>
        )}

        {/* Row: Distance + Price */}
        <div className="flex items-center gap-2 text-[14px] text-muted-foreground mb-2">
          <span>{distance.toFixed(1)} mi</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="font-semibold">{place.priceLevel}</span>
        </div>

        {/* Row: Confidence Label */}
        <div className="flex items-center justify-between">
          <span className={cn(
            'text-[13px] font-medium',
            confidenceInfo.variant === 'positive' && 'text-[hsl(var(--signal-positive-text))]',
            confidenceInfo.variant === 'neutral' && 'text-muted-foreground',
            confidenceInfo.variant === 'caution' && 'text-[hsl(var(--signal-neutral-text))]'
          )}>
            {confidenceInfo.label}
          </span>
          
          {/* Tap hint chevron */}
          <div className={cn(
            "flex-shrink-0 transition-colors",
            isSelected ? "text-primary" : "text-muted-foreground/30"
          )}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
