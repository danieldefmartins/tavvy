import { useState } from 'react';
import { Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticLight } from '@/lib/haptics';
import { PlaceFiltersState } from '@/components/PlaceFilters';
import { PlaceCategory, PlaceFeature } from '@/hooks/usePlaces';
import { ReviewFiltersState, DEFAULT_REVIEW_FILTERS, countActiveReviewFilters } from '@/hooks/useReviewFilters';
import { MuvoFilterModal, MuvoFilterButton, DEFAULT_MUVO_FILTERS, MuvoFiltersState } from '@/components/MuvoFilterModal';
import { useUserMemberships } from '@/hooks/useMemberships';

interface QuickChip {
  id: string;
  label: string;
  icon: string;
  isActive: (filters: PlaceFiltersState) => boolean;
  toggle: (filters: PlaceFiltersState) => PlaceFiltersState;
}

const QUICK_CHIPS: QuickChip[] = [
  {
    id: 'boondocking',
    label: 'Boondocking',
    icon: '🏕️',
    isActive: (f) => f.category === 'Boondocking',
    toggle: (f) => ({
      ...f,
      category: f.category === 'Boondocking' ? null : 'Boondocking' as PlaceCategory,
    }),
  },
  {
    id: 'free',
    label: 'Free',
    icon: '💵',
    isActive: (f) => f.category === 'Overnight Parking',
    toggle: (f) => ({
      ...f,
      category: f.category === 'Overnight Parking' ? null : 'Overnight Parking' as PlaceCategory,
    }),
  },
  {
    id: 'full-hookups',
    label: 'Hookups',
    icon: '🔌',
    isActive: (f) => 
      f.features.includes('Electric Hookups') && 
      f.features.includes('Sewer Hookups'),
    toggle: (f) => {
      const hasAll = f.features.includes('Electric Hookups') && f.features.includes('Sewer Hookups');
      if (hasAll) {
        return {
          ...f,
          features: f.features.filter((feat) => !['Electric Hookups', 'Sewer Hookups'].includes(feat)),
        };
      }
      const newFeatures = [...f.features];
      (['Electric Hookups', 'Sewer Hookups'] as PlaceFeature[]).forEach((feat) => {
        if (!newFeatures.includes(feat)) newFeatures.push(feat);
      });
      return { ...f, features: newFeatures };
    },
  },
  {
    id: 'pets',
    label: 'Pets',
    icon: '🐕',
    isActive: (f) => f.petFriendly,
    toggle: (f) => ({ ...f, petFriendly: !f.petFriendly }),
  },
  {
    id: 'big-rig',
    label: 'Big Rig',
    icon: '🚛',
    isActive: (f) => f.bigRigFriendly,
    toggle: (f) => ({ ...f, bigRigFriendly: !f.bigRigFriendly }),
  },
  {
    id: 'showers',
    label: 'Showers',
    icon: '🚿',
    isActive: (f) => f.features.includes('Showers'),
    toggle: (f) => ({
      ...f,
      features: f.features.includes('Showers')
        ? f.features.filter((feat) => feat !== 'Showers')
        : [...f.features, 'Showers' as PlaceFeature],
    }),
  },
];

interface MapFilterChipsProps {
  filters: PlaceFiltersState;
  onFiltersChange: (filters: PlaceFiltersState) => void;
  filteredCount?: number;
  totalCount?: number;
  reviewFilters?: ReviewFiltersState;
  onReviewFiltersChange?: (filters: ReviewFiltersState) => void;
}

export function MapFilterChips({ 
  filters, 
  onFiltersChange, 
  filteredCount,
  totalCount,
  reviewFilters = DEFAULT_REVIEW_FILTERS,
  onReviewFiltersChange,
}: MapFilterChipsProps) {
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const { data: userMemberships } = useUserMemberships();
  const hasUserMemberships = (userMemberships?.length || 0) > 0;
  const activeFilterCount =
    (filters.category ? 1 : 0) +
    filters.features.length +
    (filters.openYearRound ? 1 : 0) +
    (filters.petFriendly ? 1 : 0) +
    (filters.bigRigFriendly ? 1 : 0);

  const activeReviewFilterCount = countActiveReviewFilters(reviewFilters);
  const totalActiveFilters = activeFilterCount + activeReviewFilterCount;

  // Convert between ReviewFiltersState and MuvoFiltersState
  const muvoFilters: MuvoFiltersState = {
    positiveStamps: reviewFilters.positiveStamps,
    neutralStamps: reviewFilters.neutralStamps,
    negativeStamps: reviewFilters.negativeStamps,
    medalLevels: reviewFilters.medalLevels,
    minMuvoScore: reviewFilters.minMuvoScore,
    membershipFilter: reviewFilters.membershipFilter,
    selectedMemberships: reviewFilters.selectedMemberships,
  };

  const handleMuvoFiltersChange = (newFilters: MuvoFiltersState) => {
    if (onReviewFiltersChange) {
      onReviewFiltersChange({
        positiveStamps: newFilters.positiveStamps,
        neutralStamps: newFilters.neutralStamps,
        negativeStamps: newFilters.negativeStamps,
        medalLevels: newFilters.medalLevels,
        minMuvoScore: newFilters.minMuvoScore,
        membershipFilter: newFilters.membershipFilter,
        selectedMemberships: newFilters.selectedMemberships,
      });
    }
  };

  return (
    <div>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 min-w-max py-1">
          {/* Main Filter Button - Opens Full Modal */}
          <MuvoFilterButton 
            filters={muvoFilters}
            onClick={() => {
              hapticLight();
              setFilterModalOpen(true);
            }}
            variant="compact"
          />

          {/* My Memberships quick chip - only shown if user has memberships */}
          {hasUserMemberships && (
            <button
              type="button"
              onClick={() => {
                hapticLight();
                if (onReviewFiltersChange) {
                  onReviewFiltersChange({
                    ...reviewFilters,
                    membershipFilter: reviewFilters.membershipFilter === 'included_only' ? 'all' : 'included_only',
                  });
                }
              }}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm whitespace-nowrap',
                'bg-card/[0.88] backdrop-blur-xl transition-all duration-200',
                'active:scale-[0.95] touch-manipulation',
                reviewFilters.membershipFilter === 'included_only'
                  ? 'ring-2 ring-primary text-primary font-semibold'
                  : 'text-foreground font-medium'
              )}
              style={{ boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.12)' }}
            >
              <Ticket className="w-4 h-4" />
              <span>My Memberships</span>
            </button>
          )}

          {/* Quick filter chips */}
          {QUICK_CHIPS.map((chip) => {
            const isActive = chip.isActive(filters);
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  hapticLight();
                  onFiltersChange(chip.toggle(filters));
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm whitespace-nowrap',
                  'bg-card/[0.88] backdrop-blur-xl transition-all duration-200',
                  'active:scale-[0.95] touch-manipulation',
                  isActive
                    ? 'ring-2 ring-primary text-primary font-semibold'
                    : 'text-foreground font-medium'
                )}
                style={{ boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.12)' }}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full-screen Filter Modal */}
      <MuvoFilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        filters={muvoFilters}
        onFiltersChange={handleMuvoFiltersChange}
        filteredCount={filteredCount}
        totalCount={totalCount}
      />
    </div>
  );
}
