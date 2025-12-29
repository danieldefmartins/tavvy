import React from 'react';
import {
  Star,
  HandHeart,
  DollarSign,
  Sparkles,
  MapPin,
  Sofa,
  Shield,
  Zap,
  Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReviewDimension, SignalPolarity } from '@/hooks/useReviews';

const iconMap: Record<ReviewDimension, React.ComponentType<any>> = {
  quality: Star,
  service: HandHeart,
  value: DollarSign,
  cleanliness: Sparkles,
  location: MapPin,
  comfort: Sofa,
  reliability: Shield,
  speed: Zap,
  restrictions: Ban,
};

interface ReviewSignalIconProps {
  dimension: ReviewDimension;
  polarity: SignalPolarity;
  level: number;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

export function ReviewSignalIcon({
  dimension,
  polarity,
  level,
  selected = false,
  onClick,
  size = 'md',
  showLabel = false,
  label,
}: ReviewSignalIconProps) {
  const Icon = iconMap[dimension];
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const getPositiveStyles = () => {
    if (!selected) return 'bg-muted text-muted-foreground border-border';
    
    switch (level) {
      case 1: // Good
        return 'bg-primary/20 text-primary border-primary/50';
      case 2: // Great
        return 'bg-primary/30 text-primary border-primary ring-2 ring-primary/30';
      case 3: // Excellent
        return 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/50 shadow-lg shadow-primary/25';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getImprovementStyles = () => {
    if (!selected) return 'bg-muted text-muted-foreground border-border';
    
    switch (level) {
      case 1: // Needs work
        return 'bg-transparent text-[hsl(var(--signal-neutral))] border-[hsl(var(--signal-neutral))]';
      case 2: // Could be better
        return 'bg-[hsl(var(--signal-neutral))]/20 text-[hsl(var(--signal-neutral))] border-[hsl(var(--signal-neutral))]';
      case 3: // Major issue
        return 'bg-[hsl(var(--signal-negative))] text-white border-[hsl(var(--signal-negative))] ring-2 ring-[hsl(var(--signal-negative))]/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const styles = polarity === 'positive' ? getPositiveStyles() : getImprovementStyles();

  const getLevelLabel = () => {
    if (!selected) return '';
    if (polarity === 'positive') {
      return level === 1 ? 'Good' : level === 2 ? 'Great' : 'Excellent';
    } else {
      return level === 1 ? 'Needs work' : level === 2 ? 'Could be better' : 'Major issue';
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'rounded-full border-2 flex items-center justify-center transition-all duration-200',
          sizeClasses[size],
          styles,
          onClick && 'cursor-pointer hover:scale-110 active:scale-95',
          !onClick && 'cursor-default'
        )}
      >
        <Icon size={iconSizes[size]} />
      </button>
      {showLabel && (
        <div className="text-center">
          <p className="text-xs font-medium text-foreground">{label || dimension}</p>
          {selected && (
            <p className={cn(
              'text-xs',
              polarity === 'positive' ? 'text-primary' : 'text-[hsl(var(--signal-neutral))]'
            )}>
              {getLevelLabel()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
