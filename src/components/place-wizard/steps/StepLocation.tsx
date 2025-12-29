import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlaceFormData } from '@/types/placeForm';
import { useMapboxToken } from '@/hooks/useMapboxToken';

interface StepLocationProps {
  formData: PlaceFormData;
  updateField: <K extends keyof PlaceFormData>(field: K, value: PlaceFormData[K]) => void;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export function StepLocation({ formData, updateField }: StepLocationProps) {
  const { data: mapboxToken } = useMapboxToken();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    const initialLat = formData.latitude || 39.8283;
    const initialLng = formData.longitude || -98.5795;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [initialLng, initialLat],
      zoom: formData.latitude ? 14 : 4,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapReady(true);
      
      // Add marker if we have coordinates
      if (formData.latitude && formData.longitude) {
        marker.current = new mapboxgl.Marker({
          draggable: true,
          color: '#10b981',
        })
          .setLngLat([formData.longitude, formData.latitude])
          .addTo(map.current!);

        marker.current.on('dragend', () => {
          const lngLat = marker.current?.getLngLat();
          if (lngLat) {
            updateField('latitude', lngLat.lat);
            updateField('longitude', lngLat.lng);
          }
        });
      }
    });

    // Click to place marker
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      } else {
        marker.current = new mapboxgl.Marker({
          draggable: true,
          color: '#10b981',
        })
          .setLngLat([lng, lat])
          .addTo(map.current!);

        marker.current.on('dragend', () => {
          const lngLat = marker.current?.getLngLat();
          if (lngLat) {
            updateField('latitude', lngLat.lat);
            updateField('longitude', lngLat.lng);
          }
        });
      }
      
      updateField('latitude', lat);
      updateField('longitude', lng);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Pin Location *</Label>
        <p className="text-sm text-muted-foreground">
          Click on the map or drag the marker to set the exact location.
        </p>
        <div
          ref={mapContainer}
          className="w-full h-[250px] rounded-lg overflow-hidden border"
        />
        {formData.latitude && formData.longitude && (
          <p className="text-xs text-muted-foreground">
            Lat: {formData.latitude.toFixed(6)}, Lng: {formData.longitude.toFixed(6)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="noAddress"
          checked={formData.noFormalAddress}
          onCheckedChange={(checked) => updateField('noFormalAddress', !!checked)}
        />
        <Label htmlFor="noAddress" className="text-sm font-normal cursor-pointer">
          No formal address (boondocking, remote location, etc.)
        </Label>
      </div>

      {!formData.noFormalAddress && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="address1">Address Line 1</Label>
            <Input
              id="address1"
              value={formData.addressLine1}
              onChange={(e) => updateField('addressLine1', e.target.value)}
              placeholder="123 Main Street"
            />
          </div>
          
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="address2">Address Line 2</Label>
            <Input
              id="address2"
              value={formData.addressLine2}
              onChange={(e) => updateField('addressLine2', e.target.value)}
              placeholder="Suite, unit, building..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => updateField('city', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select value={formData.state} onValueChange={(v) => updateField('state', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zip">ZIP Code</Label>
            <Input
              id="zip"
              value={formData.postalCode}
              onChange={(e) => updateField('postalCode', e.target.value)}
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="county">County</Label>
            <Input
              id="county"
              value={formData.county}
              onChange={(e) => updateField('county', e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="elevation">Elevation (ft)</Label>
          <Input
            id="elevation"
            type="number"
            value={formData.elevationFt ?? ''}
            onChange={(e) => updateField('elevationFt', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="Optional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accuracy">Pin Accuracy</Label>
          <Select 
            value={formData.pinAccuracy} 
            onValueChange={(v) => updateField('pinAccuracy', v as PlaceFormData['pinAccuracy'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exact">Exact</SelectItem>
              <SelectItem value="approximate">Approximate</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
