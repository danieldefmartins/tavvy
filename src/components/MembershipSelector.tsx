import { Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMembershipsList, useUserMemberships, useToggleMembership } from '@/hooks/useMemberships';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface MembershipSelectorProps {
  compact?: boolean;
  className?: string;
}

const MEMBERSHIP_ICONS: Record<string, string> = {
  thousand_trails: '🏕️',
  harvest_hosts: '🍇',
  boondockers_welcome: '🚐',
  koa: '🏔️',
  passport_america: '🎫',
  good_sam: '⭐',
  state_regional_pass: '🌲',
};

export function MembershipSelector({ compact = false, className }: MembershipSelectorProps) {
  const { data: memberships, isLoading: membershipsLoading } = useMembershipsList();
  const { data: userMemberships, isLoading: userMembershipsLoading } = useUserMemberships();
  const toggleMembership = useToggleMembership();

  const userMembershipIds = new Set(userMemberships?.map(um => um.membership_id) || []);

  const handleToggle = async (membershipId: string) => {
    const isCurrentlySelected = userMembershipIds.has(membershipId);
    
    try {
      await toggleMembership.mutateAsync({
        membershipId,
        isAdding: !isCurrentlySelected,
      });
      
      const membership = memberships?.find(m => m.id === membershipId);
      toast({
        title: isCurrentlySelected ? 'Membership removed' : 'Membership added',
        description: membership?.name,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update membership',
        variant: 'destructive',
      });
    }
  };

  if (membershipsLoading || userMembershipsLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!memberships?.length) {
    return null;
  }

  if (compact) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {memberships.map((membership) => {
          const isSelected = userMembershipIds.has(membership.id);
          return (
            <Badge
              key={membership.id}
              variant={isSelected ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-all hover:scale-105',
                isSelected && 'bg-primary text-primary-foreground'
              )}
              onClick={() => handleToggle(membership.id)}
            >
              <span className="mr-1">{MEMBERSHIP_ICONS[membership.id] || '🏷️'}</span>
              {membership.name}
              {isSelected && <Check className="ml-1 w-3 h-3" />}
            </Badge>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {memberships.map((membership) => {
        const isSelected = userMembershipIds.has(membership.id);
        return (
          <button
            key={membership.id}
            type="button"
            onClick={() => handleToggle(membership.id)}
            disabled={toggleMembership.isPending}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
              isSelected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            <span className="text-xl">{MEMBERSHIP_ICONS[membership.id] || '🏷️'}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{membership.name}</p>
              {membership.description && (
                <p className="text-xs text-muted-foreground truncate">{membership.description}</p>
              )}
            </div>
            {isSelected && (
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}
