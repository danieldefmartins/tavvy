import { Ticket, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface MembershipIncludedBadgeProps {
  membershipName?: string;
  matchCount?: number;
  variant?: 'default' | 'compact' | 'pin';
  className?: string;
}

export function MembershipIncludedBadge({
  membershipName,
  matchCount = 1,
  variant = 'default',
  className,
}: MembershipIncludedBadgeProps) {
  const content = (
    <div className="flex flex-col gap-1">
      <span className="font-medium">Included with your membership</span>
      {membershipName && (
        <span className="text-xs opacity-90">{membershipName}</span>
      )}
      {matchCount > 1 && (
        <span className="text-xs opacity-75">+{matchCount - 1} more membership{matchCount > 2 ? 's' : ''}</span>
      )}
      <span className="text-xs opacity-60 mt-1 flex items-center gap-1">
        <Info className="w-3 h-3" />
        Based on reported data — availability may vary
      </span>
    </div>
  );

  if (variant === 'pin') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              'absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md',
              className
            )}>
              <Ticket className="w-3 h-3 text-primary-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            {content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className={cn(
                'gap-1 bg-primary/10 text-primary border-primary/20',
                className
              )}
            >
              <Ticket className="w-3 h-3" />
              Included
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            {content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Default variant
  return (
    <div className={cn(
      'flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20',
      className
    )}>
      <Ticket className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary">Included with your membership</p>
        {membershipName && (
          <p className="text-xs text-primary/80">{membershipName}</p>
        )}
        {matchCount > 1 && (
          <p className="text-xs text-primary/70">+{matchCount - 1} more</p>
        )}
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Based on reported data — availability may vary
        </p>
      </div>
    </div>
  );
}
