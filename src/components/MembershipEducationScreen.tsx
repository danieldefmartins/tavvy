import { Ticket, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMembershipsList } from '@/hooks/useMemberships';
import { MembershipSelector } from './MembershipSelector';

const MEMBERSHIP_DETAILS: Record<string, { benefits: string[]; priceRange: string }> = {
  thousand_trails: {
    benefits: ['Access to 80+ campgrounds', 'No nightly fees at participating parks', 'Flexible stays'],
    priceRange: '$500-600/year',
  },
  harvest_hosts: {
    benefits: ['Unique stays at wineries & farms', 'Meet local hosts', 'Support small businesses'],
    priceRange: '$99-149/year',
  },
  boondockers_welcome: {
    benefits: ['Free overnight parking', 'Host-provided locations', 'Community reviews'],
    priceRange: '$50/year',
  },
  koa: {
    benefits: ['10% discount at 500+ locations', 'Reward points', 'Member exclusives'],
    priceRange: '$33/year',
  },
  passport_america: {
    benefits: ['50% off at 1,800+ campgrounds', 'No blackout dates at most parks', 'Easy to join'],
    priceRange: '$44/year',
  },
  good_sam: {
    benefits: ['10% off at Good Sam parks', 'Fuel discounts', 'Roadside assistance options'],
    priceRange: '$29/year',
  },
  state_regional_pass: {
    benefits: ['Discounted camping fees', 'Day-use access', 'Supports conservation'],
    priceRange: 'Varies by state',
  },
};

interface MembershipEducationScreenProps {
  onClose?: () => void;
  showSelector?: boolean;
}

export function MembershipEducationScreen({ onClose, showSelector = true }: MembershipEducationScreenProps) {
  const { data: memberships } = useMembershipsList();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Ticket className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">
          Many RVers save thousands using campground memberships
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          MUVO helps you find parks included in your memberships. Select the ones you have,
          and we'll highlight included places on the map and in search results.
        </p>
      </div>

      {/* Memberships Selector */}
      {showSelector && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your Memberships</CardTitle>
          </CardHeader>
          <CardContent>
            <MembershipSelector compact />
          </CardContent>
        </Card>
      )}

      {/* Membership Details */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Learn about memberships</h3>
        {memberships?.map((membership) => {
          const details = MEMBERSHIP_DETAILS[membership.id];
          const isExpanded = expandedId === membership.id;

          return (
            <Collapsible
              key={membership.id}
              open={isExpanded}
              onOpenChange={(open) => setExpandedId(open ? membership.id : null)}
            >
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {membership.id === 'thousand_trails' && '🏕️'}
                        {membership.id === 'harvest_hosts' && '🍇'}
                        {membership.id === 'boondockers_welcome' && '🚐'}
                        {membership.id === 'koa' && '🏔️'}
                        {membership.id === 'passport_america' && '🎫'}
                        {membership.id === 'good_sam' && '⭐'}
                        {membership.id === 'state_regional_pass' && '🌲'}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{membership.name}</p>
                        {details && (
                          <p className="text-xs text-muted-foreground">{details.priceRange}</p>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </CardContent>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="mt-1 border-t-0 rounded-t-none">
                  <CardContent className="p-3 pt-2">
                    {details && (
                      <ul className="space-y-1 mb-3">
                        {details.benefits.map((benefit, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    )}
                    {membership.website_url && (
                      <a
                        href={membership.affiliate_url || membership.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary flex items-center gap-1 hover:underline"
                      >
                        Learn more
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center">
        Memberships are optional. MUVO does not sell memberships directly.
        Affiliate links may be used for informational purposes.
      </p>

      {onClose && (
        <Button onClick={onClose} className="w-full">
          Done
        </Button>
      )}
    </div>
  );
}
