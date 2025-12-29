import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MuvoMedalLevel } from '@/hooks/useMuvoScore';

// Re-export for backwards compatibility
export type MedalLevel = MuvoMedalLevel | null;

interface MuvoMedalBadgeProps {
  level: MuvoMedalLevel | null;
  score?: number | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

const medalStyles: Record<Exclude<MuvoMedalLevel, 'none'>, { bg: string; text: string; border: string; glow: string }> = {
  bronze: {
    bg: 'bg-amber-700/20',
    text: 'text-amber-700 dark:text-amber-500',
    border: 'border-amber-700/30',
    glow: 'shadow-amber-500/20',
  },
  silver: {
    bg: 'bg-slate-400/20',
    text: 'text-slate-600 dark:text-slate-300',
    border: 'border-slate-400/30',
    glow: 'shadow-slate-400/20',
  },
  gold: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-500/30',
    glow: 'shadow-yellow-500/30',
  },
  platinum: {
    bg: 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-400/30',
    glow: 'shadow-indigo-500/30',
  },
};

const sizeStyles = {
  sm: {
    wrapper: 'w-6 h-6',
    icon: 'w-3.5 h-3.5',
    text: 'text-[10px]',
    scoreWrapper: 'min-w-[16px] h-[16px] -bottom-1 -right-1',
  },
  md: {
    wrapper: 'w-8 h-8',
    icon: 'w-4 h-4',
    text: 'text-xs',
    scoreWrapper: 'min-w-[18px] h-[18px] -bottom-1 -right-1',
  },
  lg: {
    wrapper: 'w-12 h-12',
    icon: 'w-6 h-6',
    text: 'text-sm font-bold',
    scoreWrapper: 'min-w-[24px] h-[24px] -bottom-1.5 -right-1.5',
  },
};

/**
 * MUVO Medal Badge
 * 
 * Medals recognize CONSISTENCY over time.
 * - Bronze / Silver / Gold / Platinum
 * - Number inside medal = MUVO Score (when showScore is true)
 * - Does NOT replace tap counts
 */
export function MuvoMedalBadge({ 
  level, 
  score, 
  className, 
  size = 'md',
  showScore = false 
}: MuvoMedalBadgeProps) {
  // Don't render if no medal or level is 'none'
  if (!level || level === 'none') return null;

  const style = medalStyles[level];
  const sizeStyle = sizeStyles[size];
  const displayScore = score !== null && score !== undefined ? Math.round(score) : null;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full border shadow-lg',
        style.bg,
        style.text,
        style.border,
        style.glow,
        sizeStyle.wrapper,
        className
      )}
      title={`${level.charAt(0).toUpperCase() + level.slice(1)} Medal${displayScore !== null ? ` - Score: ${displayScore}` : ''}`}
    >
      <Award className={cn(sizeStyle.icon)} strokeWidth={2.5} />
      
      {/* Score overlay - only show on larger sizes when showScore is true and score exists */}
      {showScore && displayScore !== null && size !== 'sm' && (
        <span 
          className={cn(
            'absolute flex items-center justify-center rounded-full bg-background border px-1',
            style.border,
            style.text,
            sizeStyle.text,
            sizeStyle.scoreWrapper
          )}
        >
          {displayScore}
        </span>
      )}
    </div>
  );
}
