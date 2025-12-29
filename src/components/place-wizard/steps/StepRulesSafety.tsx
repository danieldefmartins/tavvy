import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlaceFormData } from '@/types/placeForm';

interface StepRulesSafetyProps {
  formData: PlaceFormData;
  updateField: <K extends keyof PlaceFormData>(field: K, value: PlaceFormData[K]) => void;
}

export function StepRulesSafety({ formData, updateField }: StepRulesSafetyProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-sm">Safety Level</Label>
          <Select value={formData.safetyLevel} onValueChange={(v) => updateField('safetyLevel', v as PlaceFormData['safetyLevel'])}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="safe">Safe</SelectItem>
              <SelectItem value="use_caution">Use Caution</SelectItem>
              <SelectItem value="avoid_at_night">Avoid at Night</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Noise Level</Label>
          <Select value={formData.noiseLevel} onValueChange={(v) => updateField('noiseLevel', v as PlaceFormData['noiseLevel'])}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="quiet">Quiet</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="loud">Loud</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Generators Allowed</Label>
          <Select value={formData.generatorsAllowed} onValueChange={(v) => updateField('generatorsAllowed', v as PlaceFormData['generatorsAllowed'])}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="restricted">Restricted Hours</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.generatorsAllowed === 'restricted' && (
          <div className="space-y-1">
            <Label className="text-sm">Generator Hours</Label>
            <Input value={formData.generatorHours} onChange={(e) => updateField('generatorHours', e.target.value)} placeholder="e.g., 8am-10pm" />
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-sm">Campfires Allowed</Label>
          <Select value={formData.campfiresAllowed} onValueChange={(v) => updateField('campfiresAllowed', v as PlaceFormData['campfiresAllowed'])}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="seasonal">Seasonal</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Pets Allowed</Label>
          <Select value={formData.petsAllowed} onValueChange={(v) => updateField('petsAllowed', v as PlaceFormData['petsAllowed'])}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="restricted">Restricted</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Rules Notes</Label>
        <Textarea value={formData.rulesNotes} onChange={(e) => updateField('rulesNotes', e.target.value)} placeholder="e.g., Quiet hours 10pm-7am, no ATVs..." rows={2} />
      </div>
      <div className="space-y-2">
        <Label>Full Description</Label>
        <Textarea value={formData.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Detailed description of the place..." rows={4} />
      </div>
    </div>
  );
}
