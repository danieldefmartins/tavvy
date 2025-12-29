import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlaceFormData } from '@/types/placeForm';

interface StepAmenitiesProps {
  formData: PlaceFormData;
  updateField: <K extends keyof PlaceFormData>(field: K, value: PlaceFormData[K]) => void;
}

type YesNoUnknown = 'yes' | 'no' | 'unknown';

function YesNoSelect({ value, onChange, label }: { value: YesNoUnknown; onChange: (v: YesNoUnknown) => void; label: string; }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="yes">Yes</SelectItem>
          <SelectItem value="no">No</SelectItem>
          <SelectItem value="unknown">Unknown</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function StepAmenities({ formData, updateField }: StepAmenitiesProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium">Basic Amenities</h3>
        <div className="grid grid-cols-2 gap-3">
          <YesNoSelect label="Restrooms" value={formData.restrooms} onChange={(v) => updateField('restrooms', v)} />
          <YesNoSelect label="Showers" value={formData.showers} onChange={(v) => updateField('showers', v)} />
          <YesNoSelect label="Laundry" value={formData.laundry} onChange={(v) => updateField('laundry', v)} />
          <YesNoSelect label="WiFi" value={formData.wifi} onChange={(v) => updateField('wifi', v)} />
          <YesNoSelect label="Trash" value={formData.trash} onChange={(v) => updateField('trash', v)} />
          <YesNoSelect label="Recycling" value={formData.recycling} onChange={(v) => updateField('recycling', v)} />
          <YesNoSelect label="Fire Pits" value={formData.firePits} onChange={(v) => updateField('firePits', v)} />
          <YesNoSelect label="Picnic Tables" value={formData.picnicTables} onChange={(v) => updateField('picnicTables', v)} />
          <YesNoSelect label="Playground" value={formData.playground} onChange={(v) => updateField('playground', v)} />
          <YesNoSelect label="Dog Park" value={formData.dogPark} onChange={(v) => updateField('dogPark', v)} />
          <YesNoSelect label="Store On Site" value={formData.storeOnSite} onChange={(v) => updateField('storeOnSite', v)} />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Cell Signal Notes</Label>
          <Input value={formData.cellSignalNotes} onChange={(e) => updateField('cellSignalNotes', e.target.value)} placeholder="e.g., Verizon good, AT&T weak..." />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Pool & Hot Tub</h3>
        <div className="grid grid-cols-2 gap-3">
          <YesNoSelect label="Swimming Pool" value={formData.swimmingPool} onChange={(v) => updateField('swimmingPool', v)} />
          <YesNoSelect label="Hot Tub" value={formData.hotTub} onChange={(v) => updateField('hotTub', v)} />
          <YesNoSelect label="Pool Open Year Round" value={formData.poolOpenYearRound} onChange={(v) => updateField('poolOpenYearRound', v)} />
          <div className="space-y-1">
            <Label className="text-sm">Heating</Label>
            <Select value={formData.poolHeating} onValueChange={(v) => updateField('poolHeating', v as PlaceFormData['poolHeating'])}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="both_heated">Both Heated</SelectItem>
                <SelectItem value="pool_only">Pool Only Heated</SelectItem>
                <SelectItem value="hot_tub_only">Hot Tub Only Heated</SelectItem>
                <SelectItem value="not_heated">Not Heated</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
