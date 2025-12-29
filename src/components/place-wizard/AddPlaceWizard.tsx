import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, X, AlertTriangle, CheckCircle, Loader2, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { useAuth } from '@/hooks/useAuth';
import { usePrimaryCategories, useSecondaryCategories } from '@/hooks/usePlaceForm';
import { useCheckNearbyPlaces } from '@/hooks/usePlaceSubmissions';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast as useToastHook } from '@/hooks/use-toast';

interface AddPlaceWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLocation?: { lat: number; lng: number };
  editPlaceId?: string;
}

// Wizard steps
const STEPS = [
  { id: 1, title: 'Location', subtitle: 'Pin the spot' },
  { id: 2, title: 'Basic Info', subtitle: 'Name & category' },
  { id: 3, title: 'Details', subtitle: 'Features & access' },
  { id: 4, title: 'Photos', subtitle: 'Add images' },
  { id: 5, title: 'Confirm', subtitle: 'Review & submit' },
];

// Category groups for display
const CATEGORY_GROUPS: Record<string, string> = {
  stay_sleep: 'Places to Stay',
  rv_services: 'RV Services',
  essential_stops: 'Essential Stops',
  food_drink: 'Food & Supplies',
  attractions: 'Attractions',
  health_safety: 'Health & Safety',
  retail: 'Retail',
  community_other: 'Other',
};

// Features list
const FEATURES = [
  { id: 'free', label: 'Free', group: 'cost' },
  { id: 'reservations_required', label: 'Reservations Required', group: 'access' },
  { id: 'pets_allowed', label: 'Pets Allowed', group: 'rules' },
  { id: 'big_rig_friendly', label: 'Big Rig Friendly', group: 'rv' },
  { id: 'quiet_area', label: 'Quiet Area', group: 'environment' },
  { id: 'generators_allowed', label: 'Generators Allowed', group: 'rules' },
  { id: 'restrooms', label: 'Restrooms', group: 'amenities' },
  { id: 'showers', label: 'Showers', group: 'amenities' },
  { id: 'dump_station', label: 'Dump Station', group: 'rv' },
  { id: 'fresh_water', label: 'Fresh Water', group: 'rv' },
  { id: 'electric_hookups', label: 'Electric Hookups', group: 'rv' },
  { id: 'wifi', label: 'Wi-Fi', group: 'amenities' },
  { id: 'picnic_tables', label: 'Picnic Tables', group: 'amenities' },
  { id: 'fire_pits', label: 'Fire Pits', group: 'amenities' },
];

export function AddPlaceWizard({ open, onOpenChange, initialLocation, editPlaceId }: AddPlaceWizardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: mapboxToken } = useMapboxToken();
  const { user } = useAuth();
  const { data: primaryCategories } = usePrimaryCategories();
  const { data: secondaryCategories } = useSecondaryCategories();
  const checkNearby = useCheckNearbyPlaces();

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [nearbyWarning, setNearbyWarning] = useState<{ id: string; name: string; distance_meters: number }[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    // Location
    latitude: initialLocation?.lat || 39.8283,
    longitude: initialLocation?.lng || -98.5795,
    address: '',
    city: '',
    state: '',
    country: 'USA',
    
    // Basic Info
    name: '',
    primaryCategoryId: '',
    additionalCategoryIds: [] as string[],
    secondaryTags: [] as string[],
    shortSummary: '',
    
    // Details
    features: [] as string[],
    accessType: 'public' as 'public' | 'private' | 'permit_required' | 'restricted',
    openYearRound: true,
    accessNotes: '',
    
    // Photos
    photoFiles: [] as File[],
    photoPreviews: [] as string[],
    
    // Confirmation
    confirmed: false,
  });

  // Update form field
  const updateField = useCallback(<K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Initialize map for location step
  useEffect(() => {
    if (!open || !mapboxToken || currentStep !== 1) return;

    // Small delay to ensure the container is mounted after Sheet animation
    const initTimer = setTimeout(() => {
      if (!mapContainer.current) return;
      
      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [formData.longitude, formData.latitude],
        zoom: 10,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      marker.current = new mapboxgl.Marker({
        draggable: true,
        color: '#10b981',
      })
        .setLngLat([formData.longitude, formData.latitude])
        .addTo(map.current);

      marker.current.on('dragend', () => {
        const lngLat = marker.current?.getLngLat();
        if (lngLat) {
          updateField('latitude', lngLat.lat);
          updateField('longitude', lngLat.lng);
          reverseGeocode(lngLat.lat, lngLat.lng);
        }
      });

      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        marker.current?.setLngLat([lng, lat]);
        updateField('latitude', lat);
        updateField('longitude', lng);
        reverseGeocode(lat, lng);
      });

      // Try to get user's location
      if (navigator.geolocation && !initialLocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map.current?.flyTo({ center: [longitude, latitude], zoom: 12 });
            marker.current?.setLngLat([longitude, latitude]);
            updateField('latitude', latitude);
            updateField('longitude', longitude);
            reverseGeocode(latitude, longitude);
          },
          () => {
            // Geolocation denied - keep default
          }
        );
      }
    }, 100);

    return () => {
      clearTimeout(initTimer);
      map.current?.remove();
    };
  }, [open, mapboxToken, currentStep]);

  // Reverse geocode to get address
  const reverseGeocode = async (lat: number, lng: number) => {
    if (!mapboxToken) return;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=address,place,region,country`
      );
      const data = await response.json();
      
      if (data.features?.length > 0) {
        const place = data.features[0];
        const context = place.context || [];
        
        // Extract city, state, country from context
        const city = context.find((c: any) => c.id.startsWith('place'))?.text || '';
        const state = context.find((c: any) => c.id.startsWith('region'))?.short_code?.replace('US-', '') || '';
        const country = context.find((c: any) => c.id.startsWith('country'))?.short_code?.toUpperCase() || 'USA';
        
        updateField('address', place.place_name?.split(',')[0] || '');
        updateField('city', city);
        updateField('state', state);
        updateField('country', country);
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
  };

  // Check for nearby places
  const checkForNearby = useCallback(async () => {
    if (!formData.name.trim()) return;
    
    try {
      const nearby = await checkNearby.mutateAsync({
        lat: formData.latitude,
        lng: formData.longitude,
        name: formData.name.trim(),
      });
      setNearbyWarning(nearby.filter(p => p.distance_meters < 200));
    } catch (error) {
      console.error('Error checking nearby places:', error);
    }
  }, [formData.latitude, formData.longitude, formData.name, checkNearby]);

  // Handle step navigation
  const goToStep = (step: number) => {
    if (step < 1 || step > STEPS.length) return;
    
    // Validate current step before proceeding
    if (step > currentStep) {
      if (currentStep === 2 && (!formData.name.trim() || !formData.primaryCategoryId)) {
        toast({
          title: 'Required fields',
          description: 'Please enter the place name and select a category.',
          variant: 'destructive',
        });
        return;
      }
    }
    
    setCurrentStep(step);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add a place.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!formData.confirmed) {
      toast({
        title: 'Confirmation required',
        description: 'Please confirm the information is accurate.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare raw_data without File objects (can't be serialized)
      const rawData = {
        ...formData,
        photoFiles: undefined, // Remove File objects
        photoPreviews: undefined, // Remove blob URLs
        photoCount: formData.photoFiles.length,
        submittedBy: user.id,
        submittedAt: new Date().toISOString(),
      };

      // Submit to import_queue for admin review
      const { error } = await supabase
        .from('import_queue')
        .insert({
          source: 'user_submission' as const,
          name: formData.name.trim(),
          latitude: formData.latitude,
          longitude: formData.longitude,
          suggested_primary_category: formData.primaryCategoryId || null,
          suggested_tags: formData.secondaryTags,
          raw_data: rawData,
          status: 'pending' as const,
        });

      if (error) throw error;

      if (error) throw error;

      setSubmitSuccess(true);
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error.message || 'Failed to submit place. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    setCurrentStep(1);
    setSubmitSuccess(false);
    setNearbyWarning([]);
    // Clean up photo previews
    formData.photoPreviews.forEach(url => URL.revokeObjectURL(url));
    setFormData({
      latitude: initialLocation?.lat || 39.8283,
      longitude: initialLocation?.lng || -98.5795,
      address: '',
      city: '',
      state: '',
      country: 'USA',
      name: '',
      primaryCategoryId: '',
      additionalCategoryIds: [],
      secondaryTags: [],
      shortSummary: '',
      features: [],
      accessType: 'public',
      openYearRound: true,
      accessNotes: '',
      photoFiles: [],
      photoPreviews: [],
      confirmed: false,
    });
    onOpenChange(false);
  };

  // Group categories
  const groupedCategories = primaryCategories?.reduce((acc, cat) => {
    const group = cat.category_group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(cat);
    return acc;
  }, {} as Record<string, typeof primaryCategories>) || {};

  // Toggle feature
  const toggleFeature = (featureId: string) => {
    const current = formData.features;
    if (current.includes(featureId)) {
      updateField('features', current.filter(f => f !== featureId));
    } else {
      updateField('features', [...current, featureId]);
    }
  };

  // Toggle secondary tag
  const toggleTag = (tagId: string) => {
    const current = formData.secondaryTags;
    if (current.includes(tagId)) {
      updateField('secondaryTags', current.filter(t => t !== tagId));
    } else if (current.length < 3) {
      updateField('secondaryTags', [...current, tagId]);
    }
  };

  // Toggle additional category
  const toggleAdditionalCategory = (catId: string) => {
    const current = formData.additionalCategoryIds;
    if (current.includes(catId)) {
      updateField('additionalCategoryIds', current.filter(c => c !== catId));
    } else if (current.length < 4) {
      updateField('additionalCategoryIds', [...current, catId]);
    }
  };

  // Handle primary category change
  const handlePrimaryCategoryChange = (value: string) => {
    updateField('primaryCategoryId', value);
    // Remove from additional if it was selected there
    if (formData.additionalCategoryIds.includes(value)) {
      updateField('additionalCategoryIds', formData.additionalCategoryIds.filter(c => c !== value));
    }
  };

  // Get available additional categories (exclude primary)
  const availableAdditionalCategories = primaryCategories?.filter(
    cat => cat.id !== formData.primaryCategoryId
  );

  // Photo handling
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < files.length && formData.photoFiles.length + newFiles.length < 5; i++) {
      const file = files[i];
      if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
        newFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }
    }

    setFormData(prev => ({
      ...prev,
      photoFiles: [...prev.photoFiles, ...newFiles],
      photoPreviews: [...prev.photoPreviews, ...newPreviews],
    }));
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(formData.photoPreviews[index]);
    setFormData(prev => ({
      ...prev,
      photoFiles: prev.photoFiles.filter((_, i) => i !== index),
      photoPreviews: prev.photoPreviews.filter((_, i) => i !== index),
    }));
  };

  const photoInputRef = useRef<HTMLInputElement>(null);

  // Get category label
  const getCategoryLabel = (id: string) => {
    return primaryCategories?.find(c => c.id === id)?.label || id;
  };

  // Success screen
  if (submitSuccess) {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-[85dvh] rounded-t-3xl">
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Submitted!</h2>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Thank you for contributing to MUVO! Your place is now pending review and will appear on the map once approved.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  handleClose();
                  navigate('/map');
                }}
                className="w-full"
              >
                View Map
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[92dvh] rounded-t-3xl p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleClose}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <SheetTitle className="text-base font-semibold">
              {editPlaceId ? 'Edit Place' : 'Add Place'}
            </SheetTitle>
            <div className="w-9" /> {/* Spacer */}
          </div>
          
          {/* Step indicator */}
          <div className="flex items-center gap-1 mt-3">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex-1 h-1 rounded-full transition-colors',
                  currentStep >= step.id 
                    ? 'bg-primary' 
                    : 'bg-muted'
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Step {currentStep}: {STEPS[currentStep - 1].title} — {STEPS[currentStep - 1].subtitle}
          </p>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Location */}
          {currentStep === 1 && (
            <div className="h-full flex flex-col">
              <div className="p-4 shrink-0">
                <p className="text-sm text-muted-foreground">
                  Tap or drag the marker to set the exact location.
                </p>
              </div>
              <div 
                ref={mapContainer} 
                className="flex-1 min-h-[300px]"
              />
              <div className="p-4 bg-background border-t shrink-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formData.city && formData.state 
                      ? `${formData.city}, ${formData.state}` 
                      : `${formData.latitude.toFixed(4)}, ${formData.longitude.toFixed(4)}`
                    }
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {formData.country}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {currentStep === 2 && (
            <div className="p-4 space-y-6">
              {nearbyWarning.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Similar places nearby: {nearbyWarning.map(p => p.name).join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Place Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  onBlur={checkForNearby}
                  placeholder="e.g., Sunset RV Park"
                  className="text-base h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>Primary Category *</Label>
                <Select 
                  value={formData.primaryCategoryId} 
                  onValueChange={handlePrimaryCategoryChange}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] z-[9999]">
                    {Object.entries(groupedCategories).map(([group, cats]) => (
                      <SelectGroup key={group}>
                        <SelectLabel className="text-xs uppercase tracking-wider">
                          {CATEGORY_GROUPS[group] || group}
                        </SelectLabel>
                        {cats?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Categories */}
              {formData.primaryCategoryId && (
                <div className="space-y-2">
                  <Label>Additional Categories (optional, up to 4)</Label>
                  <p className="text-xs text-muted-foreground">
                    Add more categories that describe what this place is.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableAdditionalCategories?.map((cat) => {
                      const isSelected = formData.additionalCategoryIds.includes(cat.id);
                      const isDisabled = !isSelected && formData.additionalCategoryIds.length >= 4;
                      
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleAdditionalCategory(cat.id)}
                          disabled={isDisabled}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-sm transition-colors',
                            isSelected 
                              ? 'bg-primary text-primary-foreground' 
                              : isDisabled
                              ? 'bg-muted text-muted-foreground cursor-not-allowed'
                              : 'bg-muted hover:bg-muted/80'
                          )}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formData.additionalCategoryIds.length}/4 selected
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Secondary Tags (optional, up to 3)</Label>
                <p className="text-xs text-muted-foreground">
                  Tags describe features or conditions.
                </p>
                <div className="flex flex-wrap gap-2">
                  {secondaryCategories?.slice(0, 12).map((tag) => {
                    const isSelected = formData.secondaryTags.includes(tag.id);
                    const isDisabled = !isSelected && formData.secondaryTags.length >= 3;
                    
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        disabled={isDisabled}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm transition-colors',
                          isSelected 
                            ? 'bg-primary text-primary-foreground' 
                            : isDisabled
                            ? 'bg-muted text-muted-foreground cursor-not-allowed'
                            : 'bg-muted hover:bg-muted/80'
                        )}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Short Description</Label>
                <Textarea
                  id="summary"
                  value={formData.shortSummary}
                  onChange={(e) => updateField('shortSummary', e.target.value)}
                  placeholder="What is this place? One or two sentences..."
                  rows={3}
                  maxLength={200}
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.shortSummary.length}/200
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 3 && (
            <div className="p-4 space-y-6">
              <div className="space-y-3">
                <Label>Features & Amenities</Label>
                <div className="grid grid-cols-2 gap-2">
                  {FEATURES.map((feature) => {
                    const isSelected = formData.features.includes(feature.id);
                    return (
                      <button
                        key={feature.id}
                        type="button"
                        onClick={() => toggleFeature(feature.id)}
                        className={cn(
                          'p-3 rounded-lg text-left text-sm transition-colors border',
                          isSelected 
                            ? 'bg-primary/10 border-primary text-foreground' 
                            : 'bg-muted/50 border-transparent hover:bg-muted'
                        )}
                      >
                        {feature.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Access Type</Label>
                <Select 
                  value={formData.accessType} 
                  onValueChange={(value: typeof formData.accessType) => updateField('accessType', value)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="permit_required">Permit Required</SelectItem>
                    <SelectItem value="restricted">Restricted Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>Open Year-Round</Label>
                  <p className="text-xs text-muted-foreground">Is this place accessible all year?</p>
                </div>
                <Switch
                  checked={formData.openYearRound}
                  onCheckedChange={(checked) => updateField('openYearRound', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessNotes">Access Notes (optional)</Label>
                <Textarea
                  id="accessNotes"
                  value={formData.accessNotes}
                  onChange={(e) => updateField('accessNotes', e.target.value)}
                  placeholder="Any special access instructions, hours, or restrictions..."
                  rows={3}
                  className="text-base"
                />
              </div>
            </div>
          )}

          {/* Step 4: Photos */}
          {currentStep === 4 && (
            <div className="p-4 space-y-6">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
              />
              
              <div>
                <Label className="mb-2 block">Add Photos (optional, up to 5)</Label>
                <p className="text-xs text-muted-foreground mb-4">
                  Photos help other travelers know what to expect.
                </p>
                
                {formData.photoPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {formData.photoPreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                        <img
                          src={preview}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {formData.photoFiles.length < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full py-8"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    {formData.photoFiles.length === 0 ? 'Add Photos' : 'Add More Photos'}
                  </Button>
                )}
                
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {formData.photoFiles.length}/5 photos added
                </p>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Photos will be reviewed before appearing on the place listing. You can skip this step and add photos later.
              </p>
            </div>
          )}

          {/* Step 5: Confirm */}
          {currentStep === 5 && (
            <div className="p-4 space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Review Your Submission</h3>
                
                <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{formData.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium">{getCategoryLabel(formData.primaryCategoryId) || '—'}</span>
                  </div>
                  {formData.additionalCategoryIds.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Additional Categories</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {formData.additionalCategoryIds.map(catId => (
                          <Badge key={catId} variant="outline" className="text-xs">
                            {getCategoryLabel(catId)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium text-right">
                      {formData.city && formData.state 
                        ? `${formData.city}, ${formData.state}` 
                        : `${formData.latitude.toFixed(4)}, ${formData.longitude.toFixed(4)}`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Access</span>
                    <span className="font-medium capitalize">{formData.accessType.replace('_', ' ')}</span>
                  </div>
                  {formData.photoFiles.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Photos</span>
                      <span className="font-medium">{formData.photoFiles.length} added</span>
                    </div>
                  )}
                  {formData.features.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Features</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {formData.features.map(f => (
                          <Badge key={f} variant="secondary" className="text-xs">
                            {FEATURES.find(feat => feat.id === f)?.label || f}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                <Checkbox
                  id="confirm"
                  checked={formData.confirmed}
                  onCheckedChange={(checked) => updateField('confirmed', checked as boolean)}
                />
                <label htmlFor="confirm" className="text-sm cursor-pointer">
                  I confirm this information is accurate to the best of my knowledge and I am not submitting spam or duplicate content.
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t bg-background p-4 flex gap-3">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={() => goToStep(currentStep - 1)}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          
          {currentStep < STEPS.length ? (
            <Button
              onClick={() => goToStep(currentStep + 1)}
              className="flex-1"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.confirmed}
              className="flex-1"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit for Review
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}