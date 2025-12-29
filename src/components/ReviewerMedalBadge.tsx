import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type ReviewerMedal = 'none' | 'bronze' | 'silver' | 'gold';

interface ReviewerMedalBadgeProps {
  medal: ReviewerMedal;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const medalConfig = {
  none: { label: '', color: '', bgColor: '' },
  bronze: {
    label: 'Bronze Reviewer',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    iconColor: '#CD7F32',
  },
  silver: {
    label: 'Silver Reviewer',
    color: 'text-slate-500',
    bgColor: 'bg-slate-100',
    iconColor: '#C0C0C0',
  },
  gold: {
    label: 'Gold Reviewer',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    iconColor: '#FFD700',
  },
};

const sizeConfig = {
  sm: { icon: 12, text: 'text-xs', padding: 'px-1.5 py-0.5' },
  md: { icon: 14, text: 'text-sm', padding: 'px-2 py-1' },
  lg: { icon: 16, text: 'text-base', padding: 'px-2.5 py-1.5' },
};

export function ReviewerMedalBadge({
  medal,
  size = 'sm',
  showLabel = false,
  className,
}: ReviewerMedalBadgeProps) {
  if (medal === 'none') return null;

  const config = medalConfig[medal];
  const sizeConf = sizeConfig[size];

  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        config.bgColor,
        config.color,
        sizeConf.padding,
        className
      )}
    >
      <Award
        size={sizeConf.icon}
        style={{ color: config.iconColor }}
        className="flex-shrink-0"
      />
      {showLabel && <span className={sizeConf.text}>{config.label}</span>}
    </span>
  );

  if (showLabel) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {config.label}
      </TooltipContent>
    </Tooltip>
  );
}

export function getMedalLabel(medal: ReviewerMedal): string {
  return medalConfig[medal]?.label || '';
}