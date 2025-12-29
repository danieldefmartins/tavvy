import { useState, useMemo } from 'react';
import { Filter, X, ThumbsUp, Sparkles, Ban, Award, TrendingUp, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useAllStamps, StampDefinition } from '@/hooks/useStamps';
import { MuvoMedalLevel } from '@/hooks/useMuvoScore';
import { useMembershipsList, useUserMemberships } from '@/hooks/useMemberships';

export interface MuvoFiltersState {
  // Section 1: What Stood Out (Positive)
  positiveStamps: string[];
  // Section 2: How This Place Feels (Neutral)
  neutralStamps: string[];
  // Section 3: What to Avoid (Negative)
  negativeStamps: string[];
  // Section 4: Medal Level
  medalLevels: MuvoMedalLevel[];
  // Section 5: MUVO Score minimum
  minMuvoScore: number | null;
  // Section 6: Membership filter (v1.8)
  membershipFilter: 'all' | 'included_only';
  selectedMemberships: string[];
}

export const DEFAULT_MUVO_FILTERS: MuvoFiltersState = {
  positiveStamps: [],
  neutralStamps: [],
  negativeStamps: [],
  medalLevels: [],
  minMuvoScore: null,
  membershipFilter: 'all',
  selectedMemberships: [],
};

interface MuvoFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: MuvoFiltersState;
  onFiltersChange: (filters: MuvoFiltersState) => void;
  filteredCount?: number;
  totalCount?: number;
}

// Common positive stamps shown as filter options
const POSITIVE_FILTER_STAMPS = [
  { id: 'great_food', label: 'Great Food' },
  { id: 'friendly_staff', label: 'Friendly Staff' },
  { id: 'clean_restrooms', label: 'Clean Restrooms' },
  { id: 'quiet_night', label: 'Quiet Night' },
  { id: 'felt_safe', label: 'Felt Safe' },
  { id: 'spacious_sites', label: 'Spacious Sites' },
  { id: 'great_views', label: 'Great Views' },
  { id: 'easy_access', label: 'Easy Access' },
  { id: 'good_wifi', label: 'Good WiFi' },
  { id: 'well_maintained', label: 'Well Maintained' },
];

// Neutral/vibe stamps
const NEUTRAL_FILTER_STAMPS = [
  { id: 'brand_new', label: 'Brand New' },
  { id: 'modern', label: 'Modern' },
  { id: 'contemporary', label: 'Contemporary' },
  { id: 'rustic', label: 'Rustic' },
  { id: 'local_favorite', label: 'Local Favorite' },
  { id: 'cozy', label: 'Cozy' },
  { id: 'themed_style', label: 'Themed Style' },
  { id: 'well_designed', label: 'Well Designed' },
  { id: 'outdated', label: 'Outdated' },
  { id: 'needs_refresh', label: 'Needs Refresh' },
  { id: 'worn_down', label: 'Worn Down' },
];

// Negative stamps to exclude
const NEGATIVE_FILTER_STAMPS = [
  { id: 'long_wait', label: 'Long Wait' },
  { id: 'dirty_restrooms', label: 'Dirty Restrooms' },
  { id: 'rude_staff', label: 'Rude Staff' },
  { id: 'too_noisy', label: 'Too Noisy' },
  { id: 'bad_wifi', label: 'Bad WiFi' },
  { id: 'hard_to_access', label: 'Hard to Access' },
  { id: 'cramped_sites', label: 'Cramped Sites' },
  { id: 'poor_maintenance', label: 'Poor Maintenance' },
];

const MEDAL_OPTIONS: { value: MuvoMedalLevel; label: string; color: string }[] = [
  { value: 'bronze', label: 'Bronze', color: 'bg-amber-700/20 text-amber-700 dark:text-amber-500' },
  { value: 'silver', label: 'Silver', color: 'bg-slate-400/20 text-slate-600 dark:text-slate-300' },
  { value: 'gold', label: 'Gold', color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' },
  { value: 'platinum', label: 'Platinum', color: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' },
];

export function MuvoFilterModal({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  filteredCount,
  totalCount,
}: MuvoFilterModalProps) {
  const { data: allStamps } = useAllStamps();
  
  // Get actual stamps from database that match our filter stamp IDs
  const getMatchingStampIds = (filterStamps: { id: string; label: string }[], dbStamps: StampDefinition[] | undefined) => {
    if (!dbStamps) return filterStamps;
    // Match by label or ID
    return filterStamps.map(fs => {
      const match = dbStamps.find(db => 
        db.id === fs.id || 
        db.label.toLowerCase() === fs.label.toLowerCase()
      );
      return match ? { id: match.id, label: match.label } : fs;
    });
  };

  const positiveStampOptions = useMemo(() => 
    getMatchingStampIds(POSITIVE_FILTER_STAMPS, allStamps?.filter(s => s.polarity === 'positive')),
    [allStamps]
  );

  const neutralStampOptions = useMemo(() => 
    getMatchingStampIds(NEUTRAL_FILTER_STAMPS, allStamps?.filter(s => s.polarity === 'neutral')),
    [allStamps]
  );

  const negativeStampOptions = useMemo(() => 
    getMatchingStampIds(NEGATIVE_FILTER_STAMPS, allStamps?.filter(s => s.polarity === 'improvement')),
    [allStamps]
  );

  // Fetch memberships data
  const { data: allMemberships } = useMembershipsList();
  const { data: userMemberships } = useUserMemberships();
  const hasUserMemberships = (userMemberships?.length || 0) > 0;

  const activeFilterCount = 
    filters.positiveStamps.length + 
    filters.neutralStamps.length + 
    filters.negativeStamps.length +
    filters.medalLevels.length +
    (filters.minMuvoScore !== null ? 1 : 0) +
    (filters.membershipFilter === 'included_only' ? 1 : 0) +
    filters.selectedMemberships.length;

  const toggleMembership = (membershipId: string) => {
    const updated = filters.selectedMemberships.includes(membershipId)
      ? filters.selectedMemberships.filter(id => id !== membershipId)
      : [...filters.selectedMemberships, membershipId];
    onFiltersChange({ ...filters, selectedMemberships: updated });
  };

  const toggleStamp = (stampId: string, type: 'positive' | 'neutral' | 'negative') => {
    const key = type === 'positive' ? 'positiveStamps' : type === 'neutral' ? 'neutralStamps' : 'negativeStamps';
    const current = filters[key];
    const updated = current.includes(stampId)
      ? current.filter(id => id !== stampId)
      : [...current, stampId];
    onFiltersChange({ ...filters, [key]: updated });
  };

  const toggleMedal = (medal: MuvoMedalLevel) => {
    const updated = filters.medalLevels.includes(medal)
      ? filters.medalLevels.filter(m => m !== medal)
      : [...filters.medalLevels, medal];
    onFiltersChange({ ...filters, medalLevels: updated });
  };

  const clearFilters = () => {
    onFiltersChange(DEFAULT_MUVO_FILTERS);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Filter Places</DialogTitle>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                Clear all
              </Button>
            )}
          </div>
          {filteredCount !== undefined && totalCount !== undefined && (
            <p className="text-sm text-muted-foreground mt-1">
              Showing {filteredCount} of {totalCount} places
            </p>
          )}
        </DialogHeader>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-6 space-y-8">
            
            {/* SECTION 1: WHAT STOOD OUT (POSITIVE) */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <ThumbsUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">What Stood Out</h3>
                  <p className="text-xs text-muted-foreground">Show places with these top features</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {positiveStampOptions.map((stamp) => {
                  const isActive = filters.positiveStamps.includes(stamp.id);
                  return (
                    <button
                      key={stamp.id}
                      type="button"
                      onClick={() => toggleStamp(stamp.id, 'positive')}
                      className={cn(
                        'px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                        'touch-manipulation active:scale-95',
                        isActive
                          ? 'bg-primary/15 text-primary ring-2 ring-primary/30'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {stamp.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <Separator />

            {/* SECTION 2: HOW THIS PLACE FEELS (NEUTRAL) */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--signal-neutral-tint))] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[hsl(var(--signal-neutral-text))]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">How This Place Feels</h3>
                  <p className="text-xs text-muted-foreground">Style & vibe (does not affect quality)</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {neutralStampOptions.map((stamp) => {
                  const isActive = filters.neutralStamps.includes(stamp.id);
                  return (
                    <button
                      key={stamp.id}
                      type="button"
                      onClick={() => toggleStamp(stamp.id, 'neutral')}
                      className={cn(
                        'px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                        'touch-manipulation active:scale-95',
                        isActive
                          ? 'bg-[hsl(var(--signal-neutral))]/15 text-[hsl(var(--signal-neutral-text))] ring-2 ring-[hsl(var(--signal-neutral))]/30'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {stamp.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <Separator />

            {/* SECTION 3: WHAT TO AVOID (NEGATIVE) */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--signal-negative-tint))] flex items-center justify-center">
                  <Ban className="w-4 h-4 text-[hsl(var(--signal-negative-text))]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">What to Avoid</h3>
                  <p className="text-xs text-muted-foreground">Hide places with these issues</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {negativeStampOptions.map((stamp) => {
                  const isActive = filters.negativeStamps.includes(stamp.id);
                  return (
                    <button
                      key={stamp.id}
                      type="button"
                      onClick={() => toggleStamp(stamp.id, 'negative')}
                      className={cn(
                        'px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                        'touch-manipulation active:scale-95',
                        isActive
                          ? 'bg-[hsl(var(--signal-negative))]/15 text-[hsl(var(--signal-negative-text))] ring-2 ring-[hsl(var(--signal-negative))]/30'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {stamp.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <Separator />

            {/* SECTION 4: MEDAL LEVEL */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Award className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Medal Level</h3>
                  <p className="text-xs text-muted-foreground">Show places with earned recognition</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {MEDAL_OPTIONS.map((medal) => {
                  const isActive = filters.medalLevels.includes(medal.value);
                  return (
                    <button
                      key={medal.value}
                      type="button"
                      onClick={() => toggleMedal(medal.value)}
                      className={cn(
                        'px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
                        'touch-manipulation active:scale-95',
                        isActive
                          ? `${medal.color} ring-2 ring-current/30`
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      <Award className="w-4 h-4" />
                      {medal.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <Separator />

            {/* SECTION 5: MUVO SCORE */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">MUVO Score</h3>
                  <p className="text-xs text-muted-foreground">Minimum community score</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Show places with MUVO Score above:
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {filters.minMuvoScore ?? 'Any'}
                  </span>
                </div>
                <Slider
                  value={[filters.minMuvoScore ?? 0]}
                  onValueChange={([value]) => {
                    onFiltersChange({
                      ...filters,
                      minMuvoScore: value === 0 ? null : value,
                    });
                  }}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Any</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
            </section>

            {/* SECTION 6: MEMBERSHIP FILTER */}
            {hasUserMemberships && (
              <>
                <Separator />
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Ticket className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">My Memberships</h3>
                      <p className="text-xs text-muted-foreground">Show places included in your memberships</p>
                    </div>
                  </div>

                  {/* Toggle for filtering by memberships */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onFiltersChange({ 
                          ...filters, 
                          membershipFilter: filters.membershipFilter === 'all' ? 'included_only' : 'all' 
                        })}
                        className={cn(
                          'px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                          'touch-manipulation active:scale-95',
                          filters.membershipFilter === 'included_only'
                            ? 'bg-primary/15 text-primary ring-2 ring-primary/30'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <Ticket className="w-4 h-4" />
                          Show only included places
                        </span>
                      </button>
                    </div>

                    {/* Specific membership selection */}
                    {filters.membershipFilter === 'included_only' && userMemberships && userMemberships.length > 1 && allMemberships && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">Filter by specific memberships:</p>
                        <div className="flex flex-wrap gap-2">
                          {userMemberships.map((um) => {
                            const membership = allMemberships.find(m => m.id === um.membership_id);
                            if (!membership) return null;
                            const isActive = filters.selectedMemberships.includes(um.membership_id);
                            return (
                              <button
                                key={um.membership_id}
                                type="button"
                                onClick={() => toggleMembership(um.membership_id)}
                                className={cn(
                                  'px-3 py-2 rounded-xl text-sm font-medium transition-all',
                                  'touch-manipulation active:scale-95',
                                  isActive
                                    ? 'bg-primary/15 text-primary ring-2 ring-primary/30'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                )}
                              >
                                {membership.icon && <span className="mr-1.5">{membership.icon}</span>}
                                {membership.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                      Membership data is based on community reports — availability may vary.
                    </p>
                  </div>
                </section>
              </>
            )}

          </div>
        </ScrollArea>

        {/* Sticky Footer */}
        <div className="px-6 py-4 border-t border-border bg-background">
          <Button 
            className="w-full h-12 text-base font-semibold" 
            onClick={() => onOpenChange(false)}
          >
            Show {filteredCount ?? 0} places
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Filter button component for triggering the modal
interface MuvoFilterButtonProps {
  filters: MuvoFiltersState;
  onClick: () => void;
  variant?: 'default' | 'compact';
}

export function MuvoFilterButton({ filters, onClick, variant = 'default' }: MuvoFilterButtonProps) {
  const activeCount = 
    filters.positiveStamps.length + 
    filters.neutralStamps.length + 
    filters.negativeStamps.length +
    filters.medalLevels.length +
    (filters.minMuvoScore !== null ? 1 : 0) +
    (filters.membershipFilter === 'included_only' ? 1 : 0) +
    filters.selectedMemberships.length;

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm',
          'bg-card/[0.88] backdrop-blur-xl transition-all duration-200',
          'active:scale-[0.95] touch-manipulation',
          activeCount > 0
            ? 'ring-2 ring-primary text-primary font-semibold'
            : 'text-foreground font-medium'
        )}
        style={{ boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.12)' }}
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="ml-0.5 w-5 h-5 flex items-center justify-center bg-primary text-primary-foreground rounded-full text-xs font-bold">
            {activeCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} className="gap-1.5 h-9">
      <Filter className="w-3.5 h-3.5" />
      Filters
      {activeCount > 0 && (
        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
          {activeCount}
        </Badge>
      )}
    </Button>
  );
}

// Count active filters
export function countMuvoFilters(filters: MuvoFiltersState): number {
  return (
    filters.positiveStamps.length + 
    filters.neutralStamps.length + 
    filters.negativeStamps.length +
    filters.medalLevels.length +
    (filters.minMuvoScore !== null ? 1 : 0) +
    (filters.membershipFilter === 'included_only' ? 1 : 0) +
    filters.selectedMemberships.length
  );
}
