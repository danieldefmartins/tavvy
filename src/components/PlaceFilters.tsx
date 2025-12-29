import { useState } from 'react';
import { Filter, X, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PLACE_CATEGORIES, PLACE_FEATURES, PlaceCategory, PlaceFeature } from '@/hooks/usePlaces';
import { MuvoFilterModal, MuvoFiltersState, DEFAULT_MUVO_FILTERS } from '@/components/MuvoFilterModal';
import { ReviewFiltersState, DEFAULT_REVIEW_FILTERS, countActiveReviewFilters } from '@/hooks/useReviewFilters';

export type SortOption = 'recently-updated' | 'alphabetical';

export interface PlaceFiltersState {
  category: PlaceCategory | null;
  features: PlaceFeature[];
  openYearRound: boolean;
  petFriendly: boolean;
  bigRigFriendly: boolean;
}

interface PlaceFiltersProps {
  filters: PlaceFiltersState;
  onFiltersChange: (filters: PlaceFiltersState) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalCount: number;
  filteredCount: number;
  // New: MUVO review filters
  reviewFilters?: ReviewFiltersState;
  onReviewFiltersChange?: (filters: ReviewFiltersState) => void;
}

export function PlaceFilters({
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  totalCount,
  filteredCount,
  reviewFilters = DEFAULT_REVIEW_FILTERS,
  onReviewFiltersChange,
}: PlaceFiltersProps) {
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    filters.features.length +
    (filters.openYearRound ? 1 : 0) +
    (filters.petFriendly ? 1 : 0) +
    (filters.bigRigFriendly ? 1 : 0);

  const activeReviewFilterCount = countActiveReviewFilters(reviewFilters);
  const totalActiveFilters = activeFilterCount + activeReviewFilterCount;

  // Convert ReviewFiltersState to MuvoFiltersState
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

  function clearAllFilters() {
    onFiltersChange({
      category: null,
      features: [],
      openYearRound: false,
      petFriendly: false,
      bigRigFriendly: false,
    });
    if (onReviewFiltersChange) {
      onReviewFiltersChange(DEFAULT_REVIEW_FILTERS);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Sort dropdown */}
      <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
        <SelectTrigger className="w-auto gap-1.5 h-9 text-sm bg-card border-border">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border z-50">
          <SelectItem value="recently-updated">Recently updated</SelectItem>
          <SelectItem value="alphabetical">A-Z</SelectItem>
        </SelectContent>
      </Select>

      {/* Filters button - opens full-screen modal */}
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        className="gap-1.5 h-9"
        onClick={() => setFilterModalOpen(true)}
      >
        <Filter className="w-3.5 h-3.5" />
        Filters
        {totalActiveFilters > 0 && (
          <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
            {totalActiveFilters}
          </Badge>
        )}
      </Button>

      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {filters.category && (
            <Badge variant="secondary" className="shrink-0 gap-1 pr-1">
              {filters.category.length > 15
                ? filters.category.substring(0, 15) + '...'
                : filters.category}
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, category: null })}
                className="ml-0.5 p-0.5 hover:bg-muted rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.petFriendly && (
            <Badge variant="secondary" className="shrink-0 gap-1 pr-1">
              Pet Friendly
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, petFriendly: false })}
                className="ml-0.5 p-0.5 hover:bg-muted rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.bigRigFriendly && (
            <Badge variant="secondary" className="shrink-0 gap-1 pr-1">
              Big Rig
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, bigRigFriendly: false })}
                className="ml-0.5 p-0.5 hover:bg-muted rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* MUVO Filter Modal */}
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
