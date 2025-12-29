# MUVO 2.0 Component Migration Guide

**Purpose:** Update components from Schema A (RV-only) to Schema B (universal platform)

**Timeline:** 2-3 days with team of 5

---

## 📋 **Migration Overview**

### **What's Changing:**
- ❌ `stamps` → ✅ `signals` (terminology)
- ❌ `aggregated_signals` → ✅ `place_signal_aggregates` (table name)
- ❌ Simple polarity → ✅ Category-based signals
- ❌ No scoring → ✅ MUVO score + medals
- ❌ Single tap → ✅ Intensity (1-3 taps)
- ❌ No time decay → ✅ Recent vs all-time scores

### **What's Staying:**
- ✅ All UI components (layouts, cards, pages)
- ✅ All styling (Tailwind, design system)
- ✅ Navigation structure
- ✅ User flows

---

## 🔧 **Step-by-Step Migration**

### **Phase 1: Database Schema** (Day 1)

#### **1.1 Deploy Schema B**
```bash
# In Supabase SQL Editor:
# 1. Run muvo-complete-schema.sql
# 2. Run scoring-implementation.sql
# 3. Run api-schema-additions.sql (if using B2B API)
```

#### **1.2 Seed Initial Data**
```sql
-- Seed categories
INSERT INTO categories_primary (name, slug, icon) VALUES
  ('Food & Dining', 'food-dining', '🍽️'),
  ('Lodging', 'lodging', '🏨'),
  ('Outdoor & Recreation', 'outdoor-recreation', '🏕️'),
  ('Shopping', 'shopping', '🛍️'),
  ('Services', 'services', '🔧');

-- Seed signals (45 total, 15 per category)
-- See muvo-complete-schema.sql for full list
```

---

### **Phase 2: Update Hooks** (Day 1-2)

#### **2.1 Rename `useStamps.ts` → `useSignals.ts`**

**File:** `src/hooks/useSignals.ts`

```typescript
// OLD (useStamps.ts):
export function useAllStamps() {
  return useQuery({
    queryKey: ['stamps'],
    queryFn: async () => {
      const { data } = await supabase
        .from('stamps')
        .select('*')
      return data
    }
  })
}

// NEW (useSignals.ts):
export function useAllSignals() {
  return useQuery({
    queryKey: ['signals'],
    queryFn: async () => {
      const { data } = await supabase
        .from('review_signals')
        .select('*')
        .order('label')
      return data
    }
  })
}

// Get signals by category
export function useSignalsByCategory(category: 'positive' | 'neutral' | 'negative') {
  return useQuery({
    queryKey: ['signals', category],
    queryFn: async () => {
      const { data } = await supabase
        .from('review_signals')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('label')
      return data
    }
  })
}

// Get signal label helper
export function getSignalLabel(signals: Signal[] | undefined, signalId: string): string {
  return signals?.find(s => s.id === signalId)?.label || 'Unknown'
}
```

---

#### **2.2 Update `usePlaces.ts`**

**File:** `src/hooks/usePlaces.ts`

```typescript
// OLD:
export function usePlaces() {
  return useQuery({
    queryKey: ['places'],
    queryFn: async () => {
      const { data } = await supabase
        .from('places')
        .select(`
          *,
          aggregated_signals(*)
        `)
      return data
    }
  })
}

// NEW:
export function usePlaces() {
  return useQuery({
    queryKey: ['places'],
    queryFn: async () => {
      const { data } = await supabase
        .from('places')
        .select(`
          *,
          place_signal_aggregates(
            signal_id,
            category,
            tap_count,
            weighted_score,
            review_signals(label, icon, category)
          ),
          place_scores(
            score,
            medal,
            recent_score,
            total_reviews,
            last_calculated_at
          ),
          place_secondary_categories(
            categories_secondary(name, slug)
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      return data
    }
  })
}

// Get place by ID with full details
export function usePlace(placeId: string) {
  return useQuery({
    queryKey: ['place', placeId],
    queryFn: async () => {
      const { data } = await supabase
        .from('places')
        .select(`
          *,
          place_signal_aggregates(
            signal_id,
            category,
            tap_count,
            weighted_score,
            review_signals(label, icon, category)
          ),
          place_scores(*),
          place_entrances(*),
          place_hours(*),
          place_photos(
            id,
            photo_url,
            caption,
            uploaded_by,
            created_at
          ),
          place_membership_offers(
            memberships(name, logo_url, description)
          ),
          place_secondary_categories(
            categories_secondary(name, slug, icon)
          )
        `)
        .eq('id', placeId)
        .single()
      return data
    }
  })
}
```

---

#### **2.3 Update `useReviews.ts`**

**File:** `src/hooks/useReviews.ts`

```typescript
// OLD:
export function usePlaceStampAggregates(placeId: string) {
  return useQuery({
    queryKey: ['place-aggregates', placeId],
    queryFn: async () => {
      const { data } = await supabase
        .from('aggregated_signals')
        .select('*')
        .eq('place_id', placeId)
      return data
    }
  })
}

// NEW:
export function usePlaceSignalAggregates(placeId: string) {
  return useQuery({
    queryKey: ['place-signal-aggregates', placeId],
    queryFn: async () => {
      const { data } = await supabase
        .from('place_signal_aggregates')
        .select(`
          *,
          review_signals(label, icon, category)
        `)
        .eq('place_id', placeId)
        .order('tap_count', { ascending: false })
      return data
    }
  })
}

// Submit review with intensity
export function useSubmitReview() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({
      placeId,
      signals
    }: {
      placeId: string
      signals: Array<{
        signal_id: string
        intensity: 1 | 2 | 3
        category: 'positive' | 'neutral' | 'negative'
      }>
    }) => {
      // Call the scoring function
      const { data, error } = await supabase.rpc('submit_review_with_scoring', {
        p_place_id: placeId,
        p_signals: signals
      })
      
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['place', variables.placeId] })
      queryClient.invalidateQueries({ queryKey: ['place-signal-aggregates', variables.placeId] })
      queryClient.invalidateQueries({ queryKey: ['places'] })
    }
  })
}
```

---

### **Phase 3: Update Components** (Day 2-3)

#### **3.1 Update `UniversalPlaceCard.tsx`**

**File:** `src/components/UniversalPlaceCard.tsx`

**Changes:**
1. Replace `usePlaceStampAggregates` → `usePlaceSignalAggregates`
2. Replace `useAllStamps` → `useAllSignals`
3. Add score + medal display
4. Update signal display logic

```typescript
// Line 8-9: Update imports
import { usePlaceSignalAggregates } from '@/hooks/useReviews';
import { useAllSignals, getSignalLabel } from '@/hooks/useSignals';

// Line 30-31: Update hooks
const { data: aggregates } = usePlaceSignalAggregates(place.id);
const { data: allSignals } = useAllSignals();

// Line 80-100: Update reviewLines logic
const reviewLines = useMemo(() => {
  if (!aggregates || aggregates.length === 0) {
    return { positive: null, neutral: null, negative: null };
  }

  // Helper to get label
  const getLabel = (data: typeof aggregates[0]): string => {
    return data.review_signals?.label || 'Unknown';
  };

  // TOP 1 POSITIVE
  const positiveData = aggregates
    .filter(a => a.category === 'positive')
    .sort((a, b) => b.tap_count - a.tap_count)[0];

  // TOP 1 NEUTRAL
  const neutralData = aggregates
    .filter(a => a.category === 'neutral')
    .sort((a, b) => b.tap_count - a.tap_count)[0];

  // TOP 1 NEGATIVE
  const negativeData = aggregates
    .filter(a => a.category === 'negative')
    .sort((a, b) => b.tap_count - a.tap_count)[0];

  return {
    positive: positiveData ? {
      label: getLabel(positiveData),
      votes: positiveData.tap_count,
    } : null,
    neutral: neutralData ? {
      label: getLabel(neutralData),
      votes: neutralData.tap_count,
    } : null,
    negative: negativeData ? {
      label: getLabel(negativeData),
      votes: negativeData.tap_count,
    } : null,
  };
}, [aggregates]);

// ADD: Score + Medal display (after line 200, before review lines)
{place.place_scores?.[0] && (
  <div className="flex items-center gap-2 mb-2">
    <span className="text-2xl font-bold text-[#008fc0]">
      {place.place_scores[0].score}
    </span>
    {place.place_scores[0].medal && (
      <MuvoMedalBadge medal={place.place_scores[0].medal} />
    )}
    <span className="text-xs text-muted-foreground">
      {place.place_scores[0].total_reviews} reviews
    </span>
  </div>
)}
```

---

#### **3.2 Update `PlaceDetail.tsx`**

**File:** `src/pages/PlaceDetail.tsx`

**Changes:**
1. Update `usePlace` hook to fetch full data
2. Add score + medal display
3. Update signal summary
4. Add intensity display

```typescript
// Line 15: Update hook
const { data: place, isLoading } = usePlace(placeId);

// ADD: Score section (after hero, before signals)
{place?.place_scores?.[0] && (
  <div className="px-4 py-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3">
          <span className="text-5xl font-black text-[#008fc0]">
            {place.place_scores[0].score}
          </span>
          {place.place_scores[0].medal && (
            <MuvoMedalBadge medal={place.place_scores[0].medal} size="lg" />
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Based on {place.place_scores[0].total_reviews} reviews
        </p>
      </div>
      
      {place.place_scores[0].recent_score && (
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Recent (90 days)</p>
          <p className="text-2xl font-bold text-[#008fc0]">
            {place.place_scores[0].recent_score}
          </p>
        </div>
      )}
    </div>
  </div>
)}

// Update PlaceSignalSummary component call
<PlaceSignalSummary 
  placeId={place.id}
  aggregates={place.place_signal_aggregates}
/>
```

---

#### **3.3 Update `PlaceSignalSummary.tsx`**

**File:** `src/components/PlaceSignalSummary.tsx`

**Changes:**
1. Update to use `place_signal_aggregates`
2. Group by category
3. Show tap counts

```typescript
interface PlaceSignalSummaryProps {
  placeId: string;
  aggregates?: Array<{
    signal_id: string;
    category: 'positive' | 'neutral' | 'negative';
    tap_count: number;
    weighted_score: number;
    review_signals?: {
      label: string;
      icon: string;
      category: string;
    };
  }>;
}

export function PlaceSignalSummary({ placeId, aggregates }: PlaceSignalSummaryProps) {
  // Group by category
  const groupedSignals = useMemo(() => {
    if (!aggregates) return { positive: [], neutral: [], negative: [] };
    
    return {
      positive: aggregates
        .filter(a => a.category === 'positive')
        .sort((a, b) => b.tap_count - a.tap_count)
        .slice(0, 5),
      neutral: aggregates
        .filter(a => a.category === 'neutral')
        .sort((a, b) => b.tap_count - a.tap_count)
        .slice(0, 3),
      negative: aggregates
        .filter(a => a.category === 'negative')
        .sort((a, b) => b.tap_count - a.tap_count)
        .slice(0, 2),
    };
  }, [aggregates]);

  return (
    <div className="space-y-4">
      {/* Positive Signals */}
      <div>
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
          <ThumbsUp className="w-5 h-5 text-[#008fc0]" />
          What Stood Out
        </h3>
        <div className="space-y-2">
          {groupedSignals.positive.map((signal) => (
            <div
              key={signal.signal_id}
              className="flex items-center justify-between bg-[#008fc0]/10 px-3 py-2 rounded-full"
            >
              <span className="font-medium">
                {signal.review_signals?.icon} {signal.review_signals?.label}
              </span>
              <span className="text-sm font-bold">×{signal.tap_count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Neutral Signals */}
      {groupedSignals.neutral.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <Star className="w-5 h-5 text-gray-500" />
            What's it like
          </h3>
          <div className="space-y-2">
            {groupedSignals.neutral.map((signal) => (
              <div
                key={signal.signal_id}
                className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-full"
              >
                <span className="font-medium">
                  {signal.review_signals?.icon} {signal.review_signals?.label}
                </span>
                <span className="text-sm font-bold">×{signal.tap_count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Negative Signals */}
      {groupedSignals.negative.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            What didn't work
          </h3>
          <div className="space-y-2">
            {groupedSignals.negative.map((signal) => (
              <div
                key={signal.signal_id}
                className="flex items-center justify-between bg-orange-100 dark:bg-orange-900/30 px-3 py-2 rounded-full"
              >
                <span className="font-medium">
                  {signal.review_signals?.icon} {signal.review_signals?.label}
                </span>
                <span className="text-sm font-bold">×{signal.tap_count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

#### **3.4 Update `ReviewSubmit.tsx`**

**File:** `src/components/ReviewSubmit.tsx`

**Changes:**
1. Add intensity selector (1-3 taps)
2. Update submission logic
3. Add category limits

```typescript
interface SelectedSignal {
  signal_id: string;
  intensity: 1 | 2 | 3;
  category: 'positive' | 'neutral' | 'negative';
}

export function ReviewSubmit({ placeId }: { placeId: string }) {
  const [selectedSignals, setSelectedSignals] = useState<SelectedSignal[]>([]);
  const { data: signals } = useAllSignals();
  const submitReview = useSubmitReview();

  // Group signals by category
  const signalsByCategory = useMemo(() => {
    if (!signals) return { positive: [], neutral: [], negative: [] };
    return {
      positive: signals.filter(s => s.category === 'positive'),
      neutral: signals.filter(s => s.category === 'neutral'),
      negative: signals.filter(s => s.category === 'negative'),
    };
  }, [signals]);

  // Check if signal is selected
  const isSelected = (signalId: string) => {
    return selectedSignals.find(s => s.signal_id === signalId);
  };

  // Get intensity for signal
  const getIntensity = (signalId: string): 1 | 2 | 3 => {
    return selectedSignals.find(s => s.signal_id === signalId)?.intensity || 1;
  };

  // Toggle signal selection
  const toggleSignal = (signalId: string, category: 'positive' | 'neutral' | 'negative') => {
    const existing = isSelected(signalId);
    
    if (existing) {
      // If already selected, cycle intensity 1 → 2 → 3 → remove
      const currentIntensity = existing.intensity;
      if (currentIntensity < 3) {
        setSelectedSignals(prev =>
          prev.map(s =>
            s.signal_id === signalId
              ? { ...s, intensity: (currentIntensity + 1) as 1 | 2 | 3 }
              : s
          )
        );
      } else {
        // Remove if at max intensity
        setSelectedSignals(prev => prev.filter(s => s.signal_id !== signalId));
      }
    } else {
      // Add new signal with intensity 1
      setSelectedSignals(prev => [...prev, { signal_id: signalId, intensity: 1, category }]);
    }
  };

  // Check category limits
  const canAddMore = (category: 'positive' | 'neutral' | 'negative') => {
    const count = selectedSignals.filter(s => s.category === category).length;
    const limits = { positive: 5, neutral: 3, negative: 2 };
    return count < limits[category];
  };

  // Submit review
  const handleSubmit = async () => {
    // Validate: must have at least 1 positive
    const positiveCount = selectedSignals.filter(s => s.category === 'positive').length;
    if (positiveCount === 0) {
      alert('Please select at least 1 positive signal');
      return;
    }

    try {
      await submitReview.mutateAsync({
        placeId,
        signals: selectedSignals
      });
      // Success!
      setSelectedSignals([]);
      alert('Review submitted! Thank you!');
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Positive Signals */}
      <div>
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
          <ThumbsUp className="w-5 h-5 text-[#008fc0]" />
          What Stood Out (1-5 required)
        </h3>
        <div className="flex flex-wrap gap-2">
          {signalsByCategory.positive.map(signal => {
            const selected = isSelected(signal.id);
            const intensity = getIntensity(signal.id);
            const canAdd = canAddMore('positive');
            
            return (
              <button
                key={signal.id}
                onClick={() => toggleSignal(signal.id, 'positive')}
                disabled={!selected && !canAdd}
                className={cn(
                  'px-4 py-2 rounded-full font-medium transition-all',
                  selected
                    ? 'bg-[#008fc0] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                  !selected && !canAdd && 'opacity-50 cursor-not-allowed'
                )}
              >
                {signal.icon} {signal.label}
                {selected && (
                  <span className="ml-2 text-xs">
                    {'●'.repeat(intensity)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Tap once for mild, twice for moderate, three times for strong
        </p>
      </div>

      {/* Neutral Signals */}
      <div>
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
          <Star className="w-5 h-5 text-gray-500" />
          What's it like (0-3 optional)
        </h3>
        <div className="flex flex-wrap gap-2">
          {signalsByCategory.neutral.map(signal => {
            const selected = isSelected(signal.id);
            const intensity = getIntensity(signal.id);
            const canAdd = canAddMore('neutral');
            
            return (
              <button
                key={signal.id}
                onClick={() => toggleSignal(signal.id, 'neutral')}
                disabled={!selected && !canAdd}
                className={cn(
                  'px-4 py-2 rounded-full font-medium transition-all',
                  selected
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                  !selected && !canAdd && 'opacity-50 cursor-not-allowed'
                )}
              >
                {signal.icon} {signal.label}
                {selected && (
                  <span className="ml-2 text-xs">
                    {'●'.repeat(intensity)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Negative Signals */}
      <div>
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          What didn't work (0-2 optional)
        </h3>
        <div className="flex flex-wrap gap-2">
          {signalsByCategory.negative.map(signal => {
            const selected = isSelected(signal.id);
            const intensity = getIntensity(signal.id);
            const canAdd = canAddMore('negative');
            
            return (
              <button
                key={signal.id}
                onClick={() => toggleSignal(signal.id, 'negative')}
                disabled={!selected && !canAdd}
                className={cn(
                  'px-4 py-2 rounded-full font-medium transition-all',
                  selected
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                  !selected && !canAdd && 'opacity-50 cursor-not-allowed'
                )}
              >
                {signal.icon} {signal.label}
                {selected && (
                  <span className="ml-2 text-xs">
                    {'●'.repeat(intensity)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={selectedSignals.filter(s => s.category === 'positive').length === 0}
        className="w-full py-4 bg-[#008fc0] text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit Review
      </button>
    </div>
  );
}
```

---

### **Phase 4: Add New Components** (Day 3)

#### **4.1 Create `MuvoMedalBadge.tsx`**

**File:** `src/components/MuvoMedalBadge.tsx`

```typescript
import { cn } from '@/lib/utils';

interface MuvoMedalBadgeProps {
  medal: 'bronze' | 'silver' | 'gold' | 'platinum';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const medalConfig = {
  bronze: {
    icon: '🥉',
    label: 'Bronze',
    color: 'bg-amber-700 text-white',
  },
  silver: {
    icon: '🥈',
    label: 'Silver',
    color: 'bg-gray-400 text-gray-900',
  },
  gold: {
    icon: '🥇',
    label: 'Gold',
    color: 'bg-yellow-400 text-yellow-900',
  },
  platinum: {
    icon: '💎',
    label: 'Platinum',
    color: 'bg-gradient-to-br from-cyan-400 to-purple-500 text-white',
  },
};

const sizeConfig = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
};

export function MuvoMedalBadge({ medal, size = 'md', className }: MuvoMedalBadgeProps) {
  const config = medalConfig[medal];
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-bold',
        config.color,
        sizeConfig[size],
        className
      )}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
}
```

---

## 📋 **Migration Checklist**

### **Day 1: Database**
- [ ] Deploy Schema B to Supabase
- [ ] Deploy scoring implementation
- [ ] Seed categories and signals
- [ ] Test database functions
- [ ] Export existing data (if any)

### **Day 2: Hooks & Core Components**
- [ ] Rename `useStamps.ts` → `useSignals.ts`
- [ ] Update `usePlaces.ts`
- [ ] Update `useReviews.ts`
- [ ] Update `UniversalPlaceCard.tsx`
- [ ] Update `PlaceDetail.tsx`
- [ ] Update `PlaceSignalSummary.tsx`

### **Day 3: Review Flow & New Features**
- [ ] Update `ReviewSubmit.tsx` (add intensity)
- [ ] Create `MuvoMedalBadge.tsx`
- [ ] Add score display to place cards
- [ ] Add score display to place detail
- [ ] Test review submission
- [ ] Test scoring calculation

### **Day 4: Testing & Polish**
- [ ] Test all pages
- [ ] Test review flow end-to-end
- [ ] Verify scoring works
- [ ] Verify medals display
- [ ] Fix any bugs
- [ ] Deploy to staging

---

## 🎯 **Key Points**

### **What's Changing:**
- Database tables and fields
- Hook names and queries
- Signal terminology

### **What's NOT Changing:**
- UI layouts and designs
- Component structure
- User flows
- Styling

### **New Features:**
- MUVO score (0-100)
- Medals (bronze, silver, gold, platinum)
- Intensity (1-3 taps per signal)
- Time decay (recent vs all-time)
- Category-based signals

---

## 🚀 **After Migration**

Your MUVO 2.0 will have:
- ✅ Universal platform (any business type)
- ✅ Advanced scoring with time decay
- ✅ Medals and gamification
- ✅ Intensity-based reviews
- ✅ Category-scoped signals
- ✅ B2B API ready
- ✅ Production-ready database

**Ready to compete with Google Maps!** 🎉
