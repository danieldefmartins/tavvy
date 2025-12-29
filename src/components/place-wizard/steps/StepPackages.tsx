import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlaceFormData } from '@/types/placeForm';

interface StepPackagesProps {
  formData: PlaceFormData;
  updateField: <K extends keyof PlaceFormData>(field: K, value: PlaceFormData[K]) => void;
}

export function StepPackages({ formData, updateField }: StepPackagesProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium">Package / Delivery Acceptance</h3>
        <div className="space-y-2">
          <Label>Packages / Amazon Accepted?</Label>
          <div className="flex gap-2">
            {(['Yes', 'No', 'Limited'] as const).map((opt) => (
              <button key={opt} type="button" onClick={() => updateField('packagesAccepted', opt)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${formData.packagesAccepted === opt ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-border'}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>
        {formData.packagesAccepted !== 'No' && (
          <>
            <div className="flex items-center justify-between">
              <Label htmlFor="packageFee">Package Fee Required?</Label>
              <Switch id="packageFee" checked={formData.packageFeeRequired} onCheckedChange={(v) => updateField('packageFeeRequired', v)} />
            </div>
            {formData.packageFeeRequired && (
              <div className="space-y-2">
                <Label>Package Fee Amount</Label>
                <Input value={formData.packageFeeAmount} onChange={(e) => updateField('packageFeeAmount', e.target.value)} placeholder="e.g., $5 per package" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Delivery Notes</Label>
              <Textarea value={formData.deliveryNotes} onChange={(e) => updateField('deliveryNotes', e.target.value)} placeholder="e.g., Packages held at office, call when arriving..." rows={2} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
