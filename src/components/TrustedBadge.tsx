import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustedBadgeProps {
  className?: string;
  showLabel?: boolean;
}

export function TrustedBadge({ className, showLabel = true }: TrustedBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-primary',
        className
      )}
      title="Trusted Contributor"
    >
      <Award className="w-3.5 h-3.5" />
      {showLabel && (
        <span className="text-xs font-medium">Trusted</span>
      )}
    </span>
  );
}
