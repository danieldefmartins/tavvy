import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { useCreateSubmission, useCheckNearbyPlaces } from '@/hooks/usePlaceSubmissions';
import { Constants } from '@/integrations/supabase/types';

const PLACE_CATEGORIES = Constants.public.Enums.place_category;
const PLACE_FEATURES = Constants.public.Enums.place_feature;

interface AddPlaceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLocation?: { lat: number; lng: number };
}

export function AddPlaceForm({ open, onOpenChange, initialLocation }: AddPlaceFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: mapboxToken } = useMapboxToken();
  const createSubmission = useCreateSubmission();
  const checkNearby = useCheckNearbyPlaces();

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  const [step, setStep] = useState<'location' | 'details' | 'success'>('location');
  const [location, setLocation] = useState(initialLocation || { lat: 39.8283, lng: -98.5795 });
  const [nearbyWarning, setNearbyWarning] = useState<{ id: string; name: string; distance_meters: number }[]>([]);

  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Initialize map
  useEffect(() => {
    if (!open || !mapboxToken || !mapContainer.current || step !== 'location') return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [location.lng, location.lat],
      zoom: 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add draggable marker
    marker.current = new mapboxgl.Marker({
      draggable: true,
      color: '#10b981',
    })
      .setLngLat([location.lng, location.lat])
      .addTo(map.current);

    marker.current.on('dragend', () => {
      const lngLat = marker.current?.getLngLat();
      if (lngLat) {
        setLocation({ lat: lngLat.lat, lng: lngLat.lng });
      }
    });

    // Click to place marker
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      marker.current?.setLngLat([lng, lat]);
      setLocation({ lat, lng });
    });

    return () => {
      map.current?.remove();
    };
  }, [open, mapboxToken, step]);

  // Check for nearby places when location changes
  const checkForNearbyPlaces = useCallback(async () => {
    if (!name.trim()) return;
    
    try {
      const nearby = await checkNearby.mutateAsync({
        lat: location.lat,
        lng: location.lng,
        name: name.trim(),
      });
      setNearbyWarning(nearby.filter(p => p.distance_meters < 200));
    } catch (error) {
      console.error('Error checking nearby places:', error);
    }
  }, [location, name, checkNearby]);

  const handleNextStep = async () => {
    if (step === 'location') {
      setStep('details');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !category) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in the place name and category.',
        variant: 'destructive',
      });
      return;
    }

    // Check for nearby duplicates
    await checkForNearbyPlaces();

    try {
      await createSubmission.mutateAsync({
        name: name.trim(),
        primaryCategory: category as typeof PLACE_CATEGORIES[number],
        latitude: location.lat,
        longitude: location.lng,
        description: description.trim() || undefined,
        features: selectedFeatures as typeof PLACE_FEATURES[number][],
      });

      setStep('success');
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error.message || 'Failed to submit place. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setStep('location');
    setName('');
    setCategory('');
    setDescription('');
    setSelectedFeatures([]);
    setNearbyWarning([]);
    onOpenChange(false);
  };

  const handleViewSubmissions = () => {
    handleClose();
    navigate('/places?filter=pending');
  };

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {step === 'location' && 'Choose Location'}
            {step === 'details' && 'Place Details'}
            {step === 'success' && 'Submitted!'}
          </DialogTitle>
        </DialogHeader>

        {step === 'location' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click on the map or drag the marker to set the exact location of the place.
            </p>

            <div
              ref={mapContainer}
              className="w-full h-[300px] rounded-lg overflow-hidden border"
            />

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
              </span>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleNextStep}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            {nearbyWarning.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Similar places nearby</AlertTitle>
                <AlertDescription>
                  Found {nearbyWarning.length} similar place(s) within 200m:
                  <ul className="mt-1 list-disc list-inside">
                    {nearbyWarning.map(p => (
                      <li key={p.id}>
                        {p.name} ({Math.round(p.distance_meters)}m away)
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Place Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sunset RV Park"
                onBlur={checkForNearbyPlaces}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {PLACE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the place..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Features (optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                {PLACE_FEATURES.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Checkbox
                      id={feature}
                      checked={selectedFeatures.includes(feature)}
                      onCheckedChange={() => toggleFeature(feature)}
                    />
                    <label
                      htmlFor={feature}
                      className="text-sm cursor-pointer"
                    >
                      {feature}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('location')}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createSubmission.isPending}
              >
                {createSubmission.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Submit for Review
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Submitted for Review</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Thank you! Your place submission is now pending admin review.
                It will appear on the map once approved.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleViewSubmissions}>
                View Pending Places
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
