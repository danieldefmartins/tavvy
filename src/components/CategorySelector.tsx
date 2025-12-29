import { useState, useMemo, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePrimaryCategories } from '@/hooks/usePlaceForm';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  X, 
  Plus,
  Check,
  Tent,
  Caravan,
  TreePine,
  Mountain,
  Trees,
  Grape,
  ParkingSquare,
  Shield,
  Home,
  Building,
  Hotel,
  Bed,
  Droplets,
  Flame,
  Wrench,
  Truck,
  Store,
  Sparkles,
  Fuel,
  ShoppingCart,
  ShoppingBasket,
  Hammer,
  Car,
  Building2,
  ShoppingBag,
  Backpack,
  UtensilsCrossed,
  Sandwich,
  Coffee,
  Beer,
  Wine,
  Hospital,
  HeartPulse,
  Stethoscope,
  Pill,
  Dog,
  Umbrella,
  Waves,
  Footprints,
  Info,
  Landmark,
  Ticket,
  MapPin,
  Camera,
  Wifi,
  Users,
  BookOpen,
  Laptop,
  FileCheck,
  AlertTriangle,
  Ship,
  Ban,
  MoreHorizontal,
  LucideIcon,
  Bike,
  Church,
  Library,
  Shirt,
} from 'lucide-react';

// Icon mapping for categories
const ICON_MAP: Record<string, LucideIcon> = {
  Tent, Caravan, TreePine, Mountain, Trees, Grape, ParkingSquare,
  Shield, Home, Building, Hotel, Bed, Droplets, Flame, Wrench,
  Truck, Store, Sparkles, Fuel, ShoppingCart, ShoppingBasket,
  Hammer, Car, Building2, ShoppingBag, Backpack, UtensilsCrossed, Sandwich,
  Coffee, Beer, Wine, Hospital, HeartPulse, Stethoscope, Pill, Dog,
  Umbrella, Waves, Footprints, Info, Landmark, Ticket, MapPin, Camera, Shirt,
  Wifi, Users, BookOpen, Laptop, FileCheck, AlertTriangle, Ship,
  Ban, MoreHorizontal, Bike, Church, Library,
};

// Group labels with icons and descriptions
const CATEGORY_GROUP_CONFIG: Record<string, { label: string; icon: LucideIcon; description?: string }> = {
  stay_sleep: { label: 'Camping & Stay', icon: Tent, description: 'Campgrounds, RV parks, overnight spots' },
  rv_services: { label: 'RV & Vehicle Services', icon: Caravan, description: 'Dump stations, repairs, supplies' },
  essential_stops: { label: 'Food & Essentials', icon: ShoppingBasket, description: 'Groceries, fuel, shopping' },
  food_drink: { label: 'Food & Drink', icon: UtensilsCrossed, description: 'Restaurants, cafes, bars' },
  health_safety: { label: 'Health & Safety', icon: Hospital, description: 'Medical, emergency, vet' },
  attractions: { label: 'Parks & Nature', icon: Mountain, description: 'Parks, trails, scenic spots' },
  general_services: { label: 'Services & Shopping', icon: Wrench, description: 'Mechanics, laundry, stores' },
  non_rv_lodging: { label: 'Lodging', icon: Hotel, description: 'Hotels, cabins, resorts' },
  community_other: { label: 'Community & Public', icon: Users, description: 'Libraries, churches, centers' },
  other: { label: 'Other', icon: MoreHorizontal, description: 'Custom category' },
};

// Order of groups for display
const GROUP_ORDER = [
  'stay_sleep',
  'attractions',
  'non_rv_lodging',
  'rv_services',
  'food_drink',
  'essential_stops',
  'general_services',
  'health_safety',
  'community_other',
];

interface CategorySelectorProps {
  primaryCategoryId: string;
  additionalCategoryIds: string[];
  customCategoryText?: string;
  onPrimaryChange: (categoryId: string) => void;
  onAdditionalChange: (categoryIds: string[]) => void;
  onCustomTextChange?: (text: string) => void;
  maxAdditional?: number;
}

export function CategorySelector({
  primaryCategoryId,
  additionalCategoryIds,
  customCategoryText = '',
  onPrimaryChange,
  onAdditionalChange,
  onCustomTextChange,
  maxAdditional = 5,
}: CategorySelectorProps) {
  const { data: categories } = usePrimaryCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['stay_sleep']));
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group categories by category_group
  const groupedCategories = useMemo(() => {
    if (!categories) return {};
    
    const grouped = categories.reduce((acc, cat) => {
      const group = cat.category_group;
      if (!acc[group]) acc[group] = [];
      acc[group].push(cat);
      return acc;
    }, {} as Record<string, typeof categories>);
    
    // Check if 'other' category exists, if not add it to community_other
    const allCats = Object.values(grouped).flat();
    const hasOther = allCats.some(c => c?.id === 'other');
    if (!hasOther) {
      if (!grouped['community_other']) grouped['community_other'] = [];
      // Create a compatible category object with all required fields
      const otherCategory = { 
        id: 'other', 
        label: 'Other (Custom)', 
        category_group: 'community_other' as const, 
        icon: 'MoreHorizontal', 
        sort_order: 999,
        created_at: new Date().toISOString(),
      };
      (grouped['community_other'] as typeof categories)?.push(otherCategory);
    }
    
    return grouped;
  }, [categories]);

  // Filter categories by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedCategories;
    
    const query = searchQuery.toLowerCase();
    const filtered: Record<string, typeof categories> = {};
    
    Object.entries(groupedCategories).forEach(([group, cats]) => {
      const groupConfig = CATEGORY_GROUP_CONFIG[group];
      const groupMatches = groupConfig?.label.toLowerCase().includes(query);
      
      const matchingCats = cats?.filter(cat => 
        cat.label.toLowerCase().includes(query) ||
        groupMatches
      );
      if (matchingCats && matchingCats.length > 0) {
        filtered[group] = matchingCats;
      }
    });
    
    return filtered;
  }, [groupedCategories, searchQuery]);

  // Auto-expand groups that have search matches
  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedGroups(new Set(Object.keys(filteredGroups)));
    }
  }, [searchQuery, filteredGroups]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const handleSelectPrimary = (categoryId: string) => {
    onPrimaryChange(categoryId);
    // Remove from additional if it was selected there
    if (additionalCategoryIds.includes(categoryId)) {
      onAdditionalChange(additionalCategoryIds.filter(id => id !== categoryId));
    }
  };

  const toggleAdditional = (categoryId: string) => {
    if (categoryId === primaryCategoryId) return;
    
    if (additionalCategoryIds.includes(categoryId)) {
      onAdditionalChange(additionalCategoryIds.filter(id => id !== categoryId));
    } else if (additionalCategoryIds.length < maxAdditional) {
      onAdditionalChange([...additionalCategoryIds, categoryId]);
    }
  };

  const removeAdditional = (categoryId: string) => {
    onAdditionalChange(additionalCategoryIds.filter(id => id !== categoryId));
  };

  const getCategoryLabel = (categoryId: string) => {
    if (categoryId === 'other') return 'Other (Custom)';
    return categories?.find(c => c.id === categoryId)?.label || categoryId;
  };

  const getCategoryIcon = (iconName: string | null) => {
    if (!iconName) return null;
    const IconComponent = ICON_MAP[iconName];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };

  const isOtherSelected = primaryCategoryId === 'other';

  const renderCategoryItem = (cat: { id: string; label: string; icon: string | null }, mode: 'primary' | 'secondary') => {
    const isPrimary = cat.id === primaryCategoryId;
    const isAdditional = additionalCategoryIds.includes(cat.id);
    const canAddMore = additionalCategoryIds.length < maxAdditional;
    const icon = getCategoryIcon(cat.icon);

    if (mode === 'primary') {
      return (
        <button
          key={cat.id}
          type="button"
          onClick={() => handleSelectPrimary(cat.id)}
          className={`flex items-center gap-2 w-full p-2.5 rounded-lg text-left transition-all ${
            isPrimary 
              ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary ring-offset-1' 
              : 'hover:bg-muted/70 border border-transparent hover:border-border'
          }`}
        >
          <span className={`${isPrimary ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
            {icon || <MapPin className="h-4 w-4" />}
          </span>
          <span className={`text-sm flex-1 ${isPrimary ? 'font-medium' : ''}`}>
            {cat.label}
          </span>
          {isPrimary && (
            <Check className="h-4 w-4" />
          )}
        </button>
      );
    }

    // Secondary mode
    if (isPrimary) return null; // Don't show primary in secondary list
    
    return (
      <button
        key={cat.id}
        type="button"
        onClick={() => toggleAdditional(cat.id)}
        disabled={!isAdditional && !canAddMore}
        className={`flex items-center gap-2 w-full p-2 rounded-md text-left transition-all ${
          isAdditional 
            ? 'bg-secondary/80 border border-secondary-foreground/20' 
            : canAddMore
            ? 'hover:bg-muted/50 border border-transparent'
            : 'opacity-50 cursor-not-allowed border border-transparent'
        }`}
      >
        <span className="text-muted-foreground">
          {icon || <MapPin className="h-4 w-4" />}
        </span>
        <span className="text-sm flex-1">{cat.label}</span>
        {isAdditional ? (
          <Check className="h-4 w-4 text-secondary-foreground" />
        ) : canAddMore ? (
          <Plus className="h-3 w-3 text-muted-foreground" />
        ) : null}
      </button>
    );
  };

  const renderCategoryGroup = (group: string, mode: 'primary' | 'secondary') => {
    const cats = filteredGroups[group];
    if (!cats || cats.length === 0) return null;
    
    const config = CATEGORY_GROUP_CONFIG[group];
    const isExpanded = expandedGroups.has(group);
    const GroupIcon = config?.icon || MoreHorizontal;

    // Filter out primary from secondary view
    const visibleCats = mode === 'secondary' 
      ? cats.filter(c => c.id !== primaryCategoryId)
      : cats;
    
    if (visibleCats.length === 0) return null;

    return (
      <div key={group} className="border-b border-border/50 last:border-0">
        <button
          type="button"
          onClick={() => toggleGroup(group)}
          className="flex items-center justify-between w-full px-3 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left sticky top-0 z-10"
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-md ${mode === 'primary' ? 'bg-primary/10' : 'bg-secondary/50'}`}>
              <GroupIcon className={`h-4 w-4 ${mode === 'primary' ? 'text-primary' : 'text-secondary-foreground'}`} />
            </div>
            <div>
              <span className="font-medium text-sm">{config?.label || group}</span>
              {config?.description && (
                <p className="text-xs text-muted-foreground">{config.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {visibleCats.length}
            </span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>
        
        {isExpanded && (
          <div className="p-2 space-y-1 bg-background">
            {visibleCats.map((cat) => renderCategoryItem(cat, mode))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* PRIMARY CATEGORY SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold">Primary Category</Label>
            <p className="text-xs text-muted-foreground">What is this place? (required)</p>
          </div>
          {primaryCategoryId && (
            <Badge variant="default" className="gap-1.5">
              {getCategoryLabel(primaryCategoryId)}
              <button
                type="button"
                onClick={() => onPrimaryChange('')}
                className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>

        {/* "Other" category custom text input */}
        {isOtherSelected && onCustomTextChange && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <Label htmlFor="custom-category" className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Describe this place type
            </Label>
            <Input
              id="custom-category"
              placeholder="e.g., Pet grooming for RVers, Solar panel installer..."
              value={customCategoryText}
              onChange={(e) => onCustomTextChange(e.target.value)}
              maxLength={100}
              className="mt-2"
            />
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1.5">
              ✓ Your custom category will be live immediately and visible on the place.
            </p>
          </div>
        )}

        {/* Primary Category List */}
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="h-[280px]" ref={scrollRef}>
            {GROUP_ORDER.filter(group => filteredGroups[group]).map((group) => 
              renderCategoryGroup(group, 'primary')
            )}
            {Object.keys(filteredGroups).length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No categories match "{searchQuery}"</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* SECONDARY CATEGORIES SECTION */}
      {primaryCategoryId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold">Also this place is... (optional)</Label>
              <p className="text-xs text-muted-foreground">
                Add up to {maxAdditional} additional identities
              </p>
            </div>
            <Badge variant="secondary" className="font-mono">
              {additionalCategoryIds.length}/{maxAdditional}
            </Badge>
          </div>

          {/* Selected Secondary Categories */}
          {additionalCategoryIds.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-secondary/20 rounded-lg">
              {additionalCategoryIds.map(catId => (
                <Badge key={catId} variant="secondary" className="gap-1 pr-1">
                  {getCategoryLabel(catId)}
                  <button
                    type="button"
                    onClick={() => removeAdditional(catId)}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Secondary Category List */}
          <div className="border rounded-lg overflow-hidden border-dashed">
            <ScrollArea className="h-[220px]">
              {GROUP_ORDER.filter(group => {
                const cats = filteredGroups[group];
                // Check if group has categories other than primary
                return cats && cats.some(c => c.id !== primaryCategoryId);
              }).map((group) => renderCategoryGroup(group, 'secondary'))}
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Helper text */}
      {!primaryCategoryId && (
        <p className="text-xs text-muted-foreground text-center py-2">
          👆 Select a primary category to continue
        </p>
      )}
    </div>
  );
}
