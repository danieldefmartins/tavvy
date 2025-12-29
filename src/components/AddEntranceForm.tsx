import { useState, useEffect, useRef } from 'react';
import { MapPin, X, AlertTriangle, Ruler, Mountain, RotateCcw, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  EntranceFormData, 
  DEFAULT_ENTRANCE_FORM, 
  ROAD_TYPE_OPTIONS, 
  GRADE_OPTIONS, 
  SEASONAL_ACCESS_OPTIONS,
  EntranceData
} from '@/types/entrance';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface AddEntranceFormProps {
  onSubmit: (entrance: EntranceData) => void;
  onCancel: () => void;
  initialData?: EntranceData;
  placeLatitude?: number;
  placeLongitude?: number;
  isSubmitting?: boolean;
}

export function AddEntranceForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  placeLatitude, 
  placeLongitude,
  isSubmitting = false
}: AddEntranceFormProps) {
  const { data: mapboxToken } = useMapboxToken();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const [formData, setFormData] = useState<EntranceFormData>(() => {
    if (initialData) {
      return {
        name: initialData.name,
        latitude: initialData.latitude,
        longitude: initialData.longitude,
        road: initialData.road || '',
        notes: initialData.notes || '',
        isPrimary: initialData.isPrimary || false,
        maxRvLengthFt: initialData.maxRvLengthFt || null,
        maxRvHeightFt: initialData.maxRvHeightFt || null,
        roadType: initialData.roadType || '',
        grade: initialData.grade || '',
        tightTurns: initialData.tightTurns ?? null,
        lowClearance: initialData.lowClearance ?? null,
        seasonalAccess: initialData.seasonalAccess || '',
        seasonalNotes: initialData.seasonalNotes || '',
      };
    }
    return {
      ...DEFAULT_ENTRANCE_FORM,
      latitude: placeLatitude || null,
      longitude: placeLongitude || null,
    };
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    const initialCenter: [number, number] = [
      formData.longitude || placeLongitude || -98.5795,
      formData.latitude || placeLatitude || 39.8283
    ];

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: initialCenter,
      zoom: formData.latitude ? 15 : 10,
    });

    mapRef.current = map;

    map.on('load', () => {
      // Add marker
      const el = document.createElement('div');
      el.className = 'entrance-marker';
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background: hsl(142, 76%, 36%);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: grab;
      `;

      const marker = new mapboxgl.Marker({ element: el, draggable: true })
        .setLngLat(initialCenter)
        .addTo(map);

      markerRef.current = marker;

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(lngLat.lat.toFixed(6)),
          longitude: parseFloat(lngLat.lng.toFixed(6)),
        }));
      });

      // Click to place marker
      map.on('click', (e) => {
        marker.setLngLat(e.lngLat);
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(e.lngLat.lat.toFixed(6)),
          longitude: parseFloat(e.lngLat.lng.toFixed(6)),
        }));
      });
    });

    return () => {
      map.remove();
    };
  }, [mapboxToken]);

  const updateField = <K extends keyof EntranceFormData>(field: K, value: EntranceFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }
    if (formData.latitude === null || formData.longitude === null) {
      return;
    }

    const entrance: EntranceData = {
      name: formData.name.trim(),
      latitude: formData.latitude,
      longitude: formData.longitude,
      road: formData.road || undefined,
      notes: formData.notes || undefined,
      isPrimary: formData.isPrimary,
      maxRvLengthFt: formData.maxRvLengthFt,
      maxRvHeightFt: formData.maxRvHeightFt,
      roadType: formData.roadType || null,
      grade: formData.grade || null,
      tightTurns: formData.tightTurns,
      lowClearance: formData.lowClearance,
      seasonalAccess: formData.seasonalAccess || null,
      seasonalNotes: formData.seasonalNotes || undefined,
    };

    onSubmit(entrance);
  };

  const isValid = formData.name.trim() && formData.latitude !== null && formData.longitude !== null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          {initialData ? 'Edit Entrance' : 'Add Entrance'}
        </h3>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Map for location selection */}
      <div className="space-y-2">
        <Label>Entrance Location</Label>
        <p className="text-xs text-muted-foreground">Tap or drag the marker to set the entrance location</p>
        <div 
          ref={mapContainerRef} 
          className="h-48 rounded-lg border border-border overflow-hidden"
        />
        {formData.latitude && formData.longitude && (
          <p className="text-xs text-muted-foreground text-center">
            {formData.latitude.toFixed(5)}°, {formData.longitude.toFixed(5)}°
          </p>
        )}
      </div>

      {/* Basic Info */}
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="entrance-name">Entrance Name *</Label>
          <Input
            id="entrance-name"
            placeholder="e.g., West Entrance, Main Gate, Highway 89 Access"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="entrance-road">Access Road</Label>
          <Input
            id="entrance-road"
            placeholder="e.g., Highway 89, Forest Road 123"
            value={formData.road}
            onChange={(e) => updateField('road', e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Primary Entrance</Label>
            <p className="text-xs text-muted-foreground">Mark as the main entrance</p>
          </div>
          <Switch
            checked={formData.isPrimary}
            onCheckedChange={(checked) => updateField('isPrimary', checked)}
          />
        </div>
      </div>

      {/* RV-Specific Fields */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground flex items-center gap-2 text-sm">
          <Ruler className="w-4 h-4 text-primary" />
          RV Accessibility (Optional)
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="max-rv-length">Max RV Length (ft)</Label>
            <Input
              id="max-rv-length"
              type="number"
              placeholder="e.g., 40"
              value={formData.maxRvLengthFt || ''}
              onChange={(e) => updateField('maxRvLengthFt', e.target.value ? parseInt(e.target.value) : null)}
              min={0}
              max={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-rv-height">Max Height (ft)</Label>
            <Input
              id="max-rv-height"
              type="number"
              step="0.1"
              placeholder="e.g., 12"
              value={formData.maxRvHeightFt || ''}
              onChange={(e) => updateField('maxRvHeightFt', e.target.value ? parseFloat(e.target.value) : null)}
              min={0}
              max={20}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Road Type</Label>
            <Select 
              value={formData.roadType} 
              onValueChange={(value) => updateField('roadType', value as typeof formData.roadType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {ROAD_TYPE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Grade / Steepness</Label>
            <Select 
              value={formData.grade} 
              onValueChange={(value) => updateField('grade', value as typeof formData.grade)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {GRADE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-warning" />
              <span className="text-sm">Tight Turns</span>
            </div>
            <Select 
              value={formData.tightTurns === null ? '' : formData.tightTurns ? 'yes' : 'no'} 
              onValueChange={(value) => updateField('tightTurns', value === '' ? null : value === 'yes')}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm">Low Clearance</span>
            </div>
            <Select 
              value={formData.lowClearance === null ? '' : formData.lowClearance ? 'yes' : 'no'} 
              onValueChange={(value) => updateField('lowClearance', value === '' ? null : value === 'yes')}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Seasonal Access
          </Label>
          <Select 
            value={formData.seasonalAccess} 
            onValueChange={(value) => updateField('seasonalAccess', value as typeof formData.seasonalAccess)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select access type..." />
            </SelectTrigger>
            <SelectContent>
              {SEASONAL_ACCESS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.seasonalAccess === 'seasonal' && (
          <div className="space-y-2">
            <Label htmlFor="seasonal-notes">Seasonal Notes</Label>
            <Input
              id="seasonal-notes"
              placeholder="e.g., Closed Nov-Apr due to snow"
              value={formData.seasonalNotes}
              onChange={(e) => updateField('seasonalNotes', e.target.value)}
              maxLength={200}
            />
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="entrance-notes">Additional Notes</Label>
        <Textarea
          id="entrance-notes"
          placeholder="Any helpful info about this entrance..."
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          maxLength={500}
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid || isSubmitting} className="flex-1">
          {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Add Entrance'}
        </Button>
      </div>
    </form>
  );
}
