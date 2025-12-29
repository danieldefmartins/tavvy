import { Award, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustBadgeProps {
  type: 'pro' | 'verified' | 'updated' | 'conflict';
  value?: string;
  className?: string;
}

const badgeConfig = {
  pro: {
    icon: Award,
    label: 'Pro Recommended',
    colorClass: 'text-accent bg-accent/10',
  },
  verified: {
    icon: ShieldCheck,
    label: 'Verified',
    colorClass: 'text-success bg-success/10',
  },
  updated: {
    icon: Clock,
    label: 'Updated',
    colorClass: 'text-muted-foreground bg-muted',
  },
  conflict: {
    icon: AlertTriangle,
    label: 'Conflicting reports',
    colorClass: 'text-warning bg-warning/10',
  },
};

export function TrustBadge({ type, value, className }: TrustBadgeProps) {
  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        config.colorClass,
        className
      )}
      title={config.label}
    >
      <Icon className="w-3 h-3" />
      {value && <span>{value}</span>}
    </div>
  );
}
