import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StampDefinition } from '@/hooks/useStamps';

interface StampButtonProps {
  stamp: StampDefinition;
  polarity: 'positive' | 'improvement';
  level: number; // 0 = not selected, 1-3 = intensity
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StampButton({
  stamp,
  polarity,
  level,
  onClick,
  disabled = false,
  size = 'md',
}: StampButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const selected = level > 0;

  // Get icon component from lucide-react
  const IconComponent = stamp.icon 
    ? (LucideIcons as any)[stamp.icon] || LucideIcons.Circle
    : LucideIcons.Circle;

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-18 h-18',
  };

  const iconSizes = {
    sm: 18,
    md: 24,
    lg: 32,
  };

  const handleClick = () => {
    if (disabled) return;
    
    // Trigger bounce animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 200);
    
    onClick();
  };

  const getPositiveStyles = () => {
    if (!selected) return 'bg-muted text-muted-foreground border-border hover:border-primary/50';
    
    switch (level) {
      case 1: // Good - filled
        return 'bg-primary/20 text-primary border-primary/50';
      case 2: // Great - filled + ring
        return 'bg-primary/40 text-primary border-primary ring-2 ring-primary/40';
      case 3: // Excellent - filled + ring + accent badge
        return 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/60 shadow-lg shadow-primary/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getImprovementStyles = () => {
    if (!selected) return 'bg-muted text-muted-foreground border-border hover:border-[hsl(var(--signal-neutral))]/50';
    
    switch (level) {
      case 1: // Needs work - outlined
        return 'bg-transparent text-[hsl(var(--signal-neutral))] border-[hsl(var(--signal-neutral))]';
      case 2: // Could be better - solid warning
        return 'bg-[hsl(var(--signal-neutral))]/30 text-[hsl(var(--signal-neutral))] border-[hsl(var(--signal-neutral))] ring-2 ring-[hsl(var(--signal-neutral))]/30';
      case 3: // Major issue - solid + alert accent
        return 'bg-[hsl(var(--signal-negative))] text-white border-[hsl(var(--signal-negative))] ring-2 ring-[hsl(var(--signal-negative))]/40 shadow-lg shadow-[hsl(var(--signal-negative))]/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const styles = polarity === 'positive' ? getPositiveStyles() : getImprovementStyles();

  // Render strength dots instead of text labels
  const renderStrengthDots = () => {
    if (!selected) return null;
    return (
      <div className="flex gap-0.5 justify-center mt-0.5">
        {[1, 2, 3].map((dot) => (
          <div
            key={dot}
            className={cn(
              'w-1.5 h-1.5 rounded-full transition-all',
              dot <= level
                ? polarity === 'positive'
                  ? 'bg-primary'
                  : level === 3
                  ? 'bg-[hsl(var(--signal-negative))]'
                  : 'bg-[hsl(var(--signal-neutral))]'
                : 'bg-muted-foreground/30'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            'rounded-full border-2 flex items-center justify-center transition-all duration-200',
            sizeClasses[size],
            styles,
            isAnimating && 'scale-125',
            !isAnimating && 'hover:scale-110 active:scale-95',
            disabled && 'opacity-50 cursor-not-allowed',
            !disabled && 'cursor-pointer'
          )}
          aria-label={`${stamp.label}${selected ? ` - Level ${level}` : ''}`}
        >
          <IconComponent size={iconSizes[size]} />
        </button>
        
        {/* Level indicator badge for level 3 */}
        {level === 3 && (
          <div 
            className={cn(
              'absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
              polarity === 'positive' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-[hsl(var(--signal-negative))] text-white'
            )}
          >
            ★
          </div>
        )}
      </div>
      
      {/* Label */}
      <div className="text-center w-16">
        <p className="text-xs font-medium text-foreground leading-tight break-words">
          {stamp.label}
        </p>
        {renderStrengthDots()}
      </div>
    </div>
  );
}
