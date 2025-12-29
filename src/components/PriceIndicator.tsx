import { cn } from '@/lib/utils';

interface PriceIndicatorProps {
  level: '$' | '$$' | '$$$';
  className?: string;
}

export function PriceIndicator({ level, className }: PriceIndicatorProps) {
  const activeCount = level.length;
  
  return (
    <div className={cn('flex items-center font-medium text-sm', className)}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            'transition-colors',
            i <= activeCount ? 'text-primary' : 'text-muted-foreground/30'
          )}
        >
          $
        </span>
      ))}
    </div>
  );
}
