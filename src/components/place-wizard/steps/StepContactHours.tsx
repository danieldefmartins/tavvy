import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PlaceFormData } from '@/types/placeForm';

interface StepContactHoursProps {
  formData: PlaceFormData;
  updateField: <K extends keyof PlaceFormData>(field: K, value: PlaceFormData[K]) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function StepContactHours({ formData, updateField }: StepContactHoursProps) {
  const toggleMonth = (month: string) => {
    const current = formData.seasonalOpenMonths;
    if (current.includes(month)) {
      updateField('seasonalOpenMonths', current.filter(m => m !== month));
    } else {
      updateField('seasonalOpenMonths', [...current, month]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium">Contact Information</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="info@example.com"
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => updateField('website', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram URL</Label>
            <Input
              id="instagram"
              value={formData.instagramUrl}
              onChange={(e) => updateField('instagramUrl', e.target.value)}
              placeholder="https://instagram.com/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook URL</Label>
            <Input
              id="facebook"
              value={formData.facebookUrl}
              onChange={(e) => updateField('facebookUrl', e.target.value)}
              placeholder="https://facebook.com/..."
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Hours & Season</h3>

        <div className="flex items-center justify-between">
          <Label htmlFor="is24_7" className="cursor-pointer">Open 24/7</Label>
          <Switch
            id="is24_7"
            checked={formData.is24_7}
            onCheckedChange={(checked) => updateField('is24_7', checked)}
          />
        </div>

        <div className="space-y-2">
          <Label>Seasonal Availability</Label>
          <p className="text-xs text-muted-foreground">
            Select months when this place is open (leave empty if year-round)
          </p>
          <div className="flex flex-wrap gap-2">
            {MONTHS.map((month) => (
              <button
                key={month}
                type="button"
                onClick={() => toggleMonth(month)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  formData.seasonalOpenMonths.includes(month)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {month.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seasonalNotes">Seasonal Notes</Label>
          <Textarea
            id="seasonalNotes"
            value={formData.seasonalNotes}
            onChange={(e) => updateField('seasonalNotes', e.target.value)}
            placeholder="e.g., Closed during winter for maintenance..."
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}
