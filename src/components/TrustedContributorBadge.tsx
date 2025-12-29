import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustedContributorBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function TrustedContributorBadge({ 
  className, 
  size = 'sm',
  showLabel = true,
}: TrustedContributorBadgeProps) {
  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        size === 'sm' && 'text-xs px-1.5 py-0.5 rounded',
        size === 'md' && 'text-sm px-2 py-1 rounded-md',
        'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        className
      )}
    >
      <Shield className={cn(
        'fill-current',
        size === 'sm' && 'w-3 h-3',
        size === 'md' && 'w-4 h-4',
      )} />
      {showLabel && <span>Trusted</span>}
    </span>
  );
}
