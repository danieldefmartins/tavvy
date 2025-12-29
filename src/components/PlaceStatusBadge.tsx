import { CheckCircle, AlertTriangle, XCircle, AlertOctagon, Clock } from 'lucide-react';
import { PlaceStatus } from '@/hooks/usePlaces';
import { STATUS_CONFIG } from '@/hooks/usePlaceStatus';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, differenceInDays } from 'date-fns';

interface PlaceStatusBadgeProps {
  status: PlaceStatus;
  statusUpdatedAt: Date | null;
  className?: string;
  showDetails?: boolean;
}

const STATUS_ICONS: Record<PlaceStatus, React.ElementType> = {
  open_accessible: CheckCircle,
  access_questionable: AlertTriangle,
  temporarily_closed: XCircle,
  restrictions_reported: AlertOctagon,
};

export function PlaceStatusBadge({ 
  status, 
  statusUpdatedAt, 
  className,
  showDetails = true,
}: PlaceStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = STATUS_ICONS[status];
  
  // Check if status needs re-verification (older than 60 days)
  const needsReverification = statusUpdatedAt 
    ? differenceInDays(new Date(), statusUpdatedAt) > 60 
    : true;

  if (needsReverification) {
    return (
      <div className={cn('space-y-1', className)}>
        <div className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium',
          'bg-muted text-muted-foreground'
        )}>
          <Clock className="w-4 h-4" />
          <span>Needs Re-verification</span>
        </div>
        {showDetails && (
          <p className="text-xs text-muted-foreground">
            Status not confirmed recently. Help by reporting current conditions.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium',
        config.bgColor,
        config.color
      )}>
        <Icon className="w-4 h-4" />
        <span>{config.label}</span>
      </div>
      {showDetails && statusUpdatedAt && (
        <p className="text-xs text-muted-foreground">
          Last confirmed {formatDistanceToNow(statusUpdatedAt, { addSuffix: true })}
        </p>
      )}
    </div>
  );
}
