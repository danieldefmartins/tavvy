import { Badge } from '@/components/ui/badge';
import { Shield, Star, Award, Trophy } from 'lucide-react';
import type { ContributorLevel } from '@/hooks/useAuth';

interface ContributorLevelBadgeProps {
  level: ContributorLevel;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const LEVEL_CONFIG: Record<ContributorLevel, {
  label: string;
  shortLabel: string;
  icon: typeof Shield;
  className: string;
}> = {
  new_contributor: {
    label: 'New Contributor',
    shortLabel: 'New',
    icon: Shield,
    className: 'bg-muted text-muted-foreground',
  },
  active_contributor: {
    label: 'Active Contributor',
    shortLabel: 'Active',
    icon: Star,
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  verified_contributor: {
    label: 'Verified Contributor',
    shortLabel: 'Verified',
    icon: Award,
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  trusted_explorer: {
    label: 'Trusted Explorer',
    shortLabel: 'Trusted',
    icon: Trophy,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
};

export function ContributorLevelBadge({ 
  level, 
  size = 'md',
  showLabel = true 
}: ContributorLevelBadgeProps) {
  const config = LEVEL_CONFIG[level];
  const Icon = config.icon;
  
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <Badge 
      variant="secondary" 
      className={`gap-1 ${config.className} ${textSize} font-medium`}
    >
      <Icon className={iconSize} />
      {showLabel && (size === 'sm' ? config.shortLabel : config.label)}
    </Badge>
  );
}
