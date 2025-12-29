import { PlaceFiltersState } from '@/components/PlaceFilters';
import { PlaceCategory, PlaceFeature } from '@/hooks/usePlaces';
import { cn } from '@/lib/utils';
import { hapticLight } from '@/lib/haptics';

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
    isActive: (f) => f.category === 'Overnight Parking' || f.category === 'Boondocking',
    toggle: (f) => {
      // Toggle between free options (Overnight Parking is often free)
      if (f.category === 'Overnight Parking') {
        return { ...f, category: null };
      }
      return { ...f, category: 'Overnight Parking' as PlaceCategory };
    },
  },
  {
    id: 'full-hookups',
    label: 'Full Hookups',
    icon: '🔌',
    isActive: (f) => 
      f.features.includes('Electric Hookups') && 
      f.features.includes('Sewer Hookups') && 
      f.features.includes('Fresh Water'),
    toggle: (f) => {
      const hasAll = 
        f.features.includes('Electric Hookups') && 
        f.features.includes('Sewer Hookups') && 
        f.features.includes('Fresh Water');
      
      if (hasAll) {
        return {
          ...f,
          features: f.features.filter(
            (feat) => !['Electric Hookups', 'Sewer Hookups', 'Fresh Water'].includes(feat)
          ),
        };
      }
      
      const newFeatures = [...f.features];
      (['Electric Hookups', 'Sewer Hookups', 'Fresh Water'] as PlaceFeature[]).forEach((feat) => {
        if (!newFeatures.includes(feat)) {
          newFeatures.push(feat);
        }
      });
      return { ...f, features: newFeatures };
    },
  },
  {
    id: 'pet-friendly',
    label: 'Pet Friendly',
    icon: '🐕',
    isActive: (f) => f.petFriendly,
    toggle: (f) => ({ ...f, petFriendly: !f.petFriendly }),
  },
  {
    id: 'overnight-ok',
    label: 'Overnight OK',
    icon: '🌙',
    isActive: (f) => f.category === 'Business Allowing Overnight',
    toggle: (f) => ({
      ...f,
      category: f.category === 'Business Allowing Overnight' ? null : 'Business Allowing Overnight' as PlaceCategory,
    }),
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
  {
    id: 'wifi',
    label: 'Wi-Fi',
    icon: '📶',
    isActive: (f) => f.features.includes('Wi-Fi'),
    toggle: (f) => ({
      ...f,
      features: f.features.includes('Wi-Fi')
        ? f.features.filter((feat) => feat !== 'Wi-Fi')
        : [...f.features, 'Wi-Fi' as PlaceFeature],
    }),
  },
];

interface QuickFilterChipsProps {
  filters: PlaceFiltersState;
  onFiltersChange: (filters: PlaceFiltersState) => void;
}

export function QuickFilterChips({ filters, onFiltersChange }: QuickFilterChipsProps) {
  return (
    <div 
      className="bg-background/95 backdrop-blur-sm border-b border-border"
      style={{
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 0.75rem)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 0.75rem)',
      }}
    >
      <div className="overflow-x-auto scrollbar-hide py-2">
        <div className="flex items-center gap-2 min-w-max">
          {QUICK_CHIPS.map((chip) => {
            const isActive = chip.isActive(filters);
            return (
              <button
                key={chip.id}
                onClick={() => {
                  hapticLight();
                  onFiltersChange(chip.toggle(filters));
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                  'border transition-all duration-200 whitespace-nowrap',
                  'active:scale-[0.95] active:opacity-80 touch-manipulation',
                  'transform-gpu will-change-transform',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                )}
              >
                <span className="text-base leading-none">{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
