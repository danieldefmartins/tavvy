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

interface StepPricingProps {
  formData: PlaceFormData;
  updateField: <K extends keyof PlaceFormData>(field: K, value: PlaceFormData[K]) => void;
}

const PAYMENT_TYPES = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Apple Pay',
  'Google Pay',
  'Online Only',
  'Check',
];

export function StepPricing({ formData, updateField }: StepPricingProps) {
  const togglePayment = (type: string) => {
    const current = formData.paymentTypes;
    if (current.includes(type)) {
      updateField('paymentTypes', current.filter(t => t !== type));
    } else {
      updateField('paymentTypes', [...current, type]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Price Level</Label>
        <div className="flex gap-2">
          {(['Free', '$', '$$', '$$$', '$$$$'] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => updateField('priceLevel', level)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                formData.priceLevel === level
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-border'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Free = No cost • $ = Budget • $$ = Moderate • $$$ = Premium • $$$$ = Luxury
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rateMin">Nightly Rate Min ($)</Label>
          <Input
            id="rateMin"
            type="number"
            min="0"
            value={formData.nightlyRateMin ?? ''}
            onChange={(e) => updateField('nightlyRateMin', e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="Optional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rateMax">Nightly Rate Max ($)</Label>
          <Input
            id="rateMax"
            type="number"
            min="0"
            value={formData.nightlyRateMax ?? ''}
            onChange={(e) => updateField('nightlyRateMax', e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Taxes Included?</Label>
        <Select 
          value={formData.taxesIncluded} 
          onValueChange={(v) => updateField('taxesIncluded', v as PlaceFormData['taxesIncluded'])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Payment Types Accepted</Label>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_TYPES.map((type) => (
            <div key={type} className="flex items-center gap-2">
              <Checkbox
                id={`payment-${type}`}
                checked={formData.paymentTypes.includes(type)}
                onCheckedChange={() => togglePayment(type)}
              />
              <label
                htmlFor={`payment-${type}`}
                className="text-sm cursor-pointer"
              >
                {type}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
