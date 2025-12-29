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

interface StepRVHookupsProps {
  formData: PlaceFormData;
  updateField: <K extends keyof PlaceFormData>(field: K, value: PlaceFormData[K]) => void;
}

type YesNoSome = 'yes' | 'no' | 'some' | 'unknown';
type YesNoUnknown = 'yes' | 'no' | 'unknown';

function YesNoSomeSelect({ 
  value, 
  onChange,
  label 
}: { 
  value: YesNoSome; 
  onChange: (v: YesNoSome) => void;
  label: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="yes">Yes</SelectItem>
          <SelectItem value="no">No</SelectItem>
          <SelectItem value="some">Some/Partial</SelectItem>
          <SelectItem value="unknown">Unknown</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function YesNoSelect({ 
  value, 
  onChange,
  label 
}: { 
  value: YesNoUnknown; 
  onChange: (v: YesNoUnknown) => void;
  label: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="yes">Yes</SelectItem>
          <SelectItem value="no">No</SelectItem>
          <SelectItem value="unknown">Unknown</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function StepRVHookups({ formData, updateField }: StepRVHookupsProps) {
  return (
    <div className="space-y-6">
      {/* RV Core */}
      <div className="space-y-4">
        <h3 className="font-medium">RV Accessibility</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <YesNoSomeSelect
            label="Big Rig Friendly"
            value={formData.bigRigFriendly}
            onChange={(v) => updateField('bigRigFriendly', v)}
          />

          <YesNoSelect
            label="Towing Friendly"
            value={formData.towingFriendly}
            onChange={(v) => updateField('towingFriendly', v)}
          />

          <div className="space-y-1">
            <Label className="text-sm">Max RV Length (ft)</Label>
            <Input
              type="number"
              min="0"
              className="h-9"
              value={formData.maxRvLengthFt ?? ''}
              onChange={(e) => updateField('maxRvLengthFt', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="e.g., 45"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Max Height (ft)</Label>
            <Input
              type="number"
              min="0"
              step="0.5"
              className="h-9"
              value={formData.maxHeightFt ?? ''}
              onChange={(e) => updateField('maxHeightFt', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="e.g., 12"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Road Type</Label>
            <Select value={formData.roadType} onValueChange={(v) => updateField('roadType', v as PlaceFormData['roadType'])}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paved">Paved</SelectItem>
                <SelectItem value="gravel">Gravel</SelectItem>
                <SelectItem value="dirt">Dirt</SelectItem>
                <SelectItem value="sand">Sand</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Road Condition</Label>
            <Select value={formData.roadCondition} onValueChange={(v) => updateField('roadCondition', v as PlaceFormData['roadCondition'])}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="ok">OK</SelectItem>
                <SelectItem value="rough">Rough</SelectItem>
                <SelectItem value="muddy">Muddy</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Grade/Terrain</Label>
            <Select value={formData.grade} onValueChange={(v) => updateField('grade', v as PlaceFormData['grade'])}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flat">Flat</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="steep">Steep</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <YesNoSelect
            label="Turnaround Available"
            value={formData.turnaroundAvailable}
            onChange={(v) => updateField('turnaroundAvailable', v)}
          />
        </div>
      </div>

      {/* Hookups */}
      <div className="space-y-4">
        <h3 className="font-medium">Hookups</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm">Electric</Label>
            <Select value={formData.electric} onValueChange={(v) => updateField('electric', v as PlaceFormData['electric'])}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="15a">15 Amp</SelectItem>
                <SelectItem value="30a">30 Amp</SelectItem>
                <SelectItem value="50a">50 Amp</SelectItem>
                <SelectItem value="mix">Mix</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <YesNoSomeSelect
            label="Water Hookup"
            value={formData.waterHookup}
            onChange={(v) => updateField('waterHookup', v)}
          />

          <YesNoSomeSelect
            label="Sewer Hookup"
            value={formData.sewerHookup}
            onChange={(v) => updateField('sewerHookup', v)}
          />

          <YesNoSelect
            label="Full Hookups"
            value={formData.fullHookups}
            onChange={(v) => updateField('fullHookups', v)}
          />
        </div>
      </div>

      {/* Dump/Water */}
      <div className="space-y-4">
        <h3 className="font-medium">Dump Station & Water Fill</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <YesNoSelect
            label="Dump Station"
            value={formData.dumpStation}
            onChange={(v) => updateField('dumpStation', v)}
          />

          <YesNoSelect
            label="Dump Fee Required"
            value={formData.dumpFeeRequired}
            onChange={(v) => updateField('dumpFeeRequired', v)}
          />

          <div className="space-y-1">
            <Label className="text-sm">Dump Fee Amount ($)</Label>
            <Input
              type="number"
              min="0"
              step="0.5"
              className="h-9"
              value={formData.dumpFeeAmount ?? ''}
              onChange={(e) => updateField('dumpFeeAmount', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="e.g., 10"
            />
          </div>

          <YesNoSelect
            label="Fresh Water Fill"
            value={formData.freshWaterFill}
            onChange={(v) => updateField('freshWaterFill', v)}
          />

          <div className="space-y-1 col-span-2">
            <Label className="text-sm">Water Type</Label>
            <Select value={formData.waterType} onValueChange={(v) => updateField('waterType', v as PlaceFormData['waterType'])}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="potable">Potable</SelectItem>
                <SelectItem value="non_potable">Non-Potable</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Water Notes</Label>
          <Textarea
            value={formData.waterNotes}
            onChange={(e) => updateField('waterNotes', e.target.value)}
            placeholder="e.g., Water spigot near entrance, bring long hose..."
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}
