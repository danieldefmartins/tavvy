import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useCreateSuggestion, FIELD_LABELS } from '@/hooks/useSuggestions';
import { PLACE_CATEGORIES, type Place, type PlaceCategory } from '@/hooks/usePlaces';

interface SuggestUpdateFormProps {
  place: Place;
  isVerified: boolean;
}

export function SuggestUpdateForm({ place, isVerified }: SuggestUpdateFormProps) {
  const [open, setOpen] = useState(false);
  const [fieldName, setFieldName] = useState<string>('');
  const [suggestedValue, setSuggestedValue] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const createSuggestion = useCreateSuggestion();

  function getCurrentValue(field: string): string | null {
    switch (field) {
      case 'name':
        return place.name;
      case 'primary_category':
        return place.primaryCategory;
      case 'price_level':
        return place.priceLevel;
      case 'packages_accepted':
        return place.packagesAccepted;
      case 'package_fee_required':
        return place.packageFeeRequired ? 'Yes' : 'No';
      case 'package_fee_amount':
        return place.packageFeeAmount;
      case 'features':
        return place.features.join(', ');
      case 'open_year_round':
        return place.openYearRound ? 'Yes' : 'No';
      case 'latitude':
        return String(place.latitude);
      case 'longitude':
        return String(place.longitude);
      default:
        return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!fieldName || !suggestedValue.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please select a field and provide a suggested value.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createSuggestion.mutateAsync({
        placeId: place.id,
        fieldName,
        currentValue: getCurrentValue(fieldName),
        suggestedValue: suggestedValue.trim(),
        notes: notes.trim() || undefined,
      });

      toast({
        title: 'Suggestion submitted',
        description: 'Your update suggestion is now pending review.',
      });

      setOpen(false);
      setFieldName('');
      setSuggestedValue('');
      setNotes('');
    } catch (error) {
      toast({
        title: 'Failed to submit',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  }

  function renderValueInput() {
    if (!fieldName) return null;

    switch (fieldName) {
      case 'primary_category':
        return (
          <Select value={suggestedValue} onValueChange={setSuggestedValue}>
            <SelectTrigger className="bg-card border-border">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50 max-h-60">
              {PLACE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'price_level':
        return (
          <Select value={suggestedValue} onValueChange={setSuggestedValue}>
            <SelectTrigger className="bg-card border-border">
              <SelectValue placeholder="Select price level" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              <SelectItem value="$">$ - Budget</SelectItem>
              <SelectItem value="$$">$$ - Moderate</SelectItem>
              <SelectItem value="$$$">$$$ - Premium</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'packages_accepted':
        return (
          <Select value={suggestedValue} onValueChange={setSuggestedValue}>
            <SelectTrigger className="bg-card border-border">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
              <SelectItem value="Limited">Limited</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'package_fee_required':
        return (
          <Select value={suggestedValue} onValueChange={setSuggestedValue}>
            <SelectTrigger className="bg-card border-border">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'open_year_round':
        return (
          <Select value={suggestedValue} onValueChange={setSuggestedValue}>
            <SelectTrigger className="bg-card border-border">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              <SelectItem value="Yes">Yes - Open Year-Round</SelectItem>
              <SelectItem value="No">No - Seasonal</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'longitude':
        return (
          <Input
            type="number"
            step="0.0001"
            value={suggestedValue}
            onChange={(e) => setSuggestedValue(e.target.value)}
            placeholder={`Enter ${fieldName}`}
            className="bg-card border-border"
          />
        );

      default:
        return (
          <Input
            value={suggestedValue}
            onChange={(e) => setSuggestedValue(e.target.value)}
            placeholder={`Enter new ${FIELD_LABELS[fieldName] || fieldName}`}
            className="bg-card border-border"
          />
        );
    }
  }

  if (!isVerified) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Send className="w-4 h-4 mr-2" />
          Suggest an Update
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Suggest an Update</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Field selector */}
          <div className="space-y-2">
            <Label>What needs updating?</Label>
            <Select value={fieldName} onValueChange={(v) => { setFieldName(v); setSuggestedValue(''); }}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Select a field" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                {Object.entries(FIELD_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current value display */}
          {fieldName && (
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Current value</p>
              <p className="text-sm text-foreground">
                {getCurrentValue(fieldName) || <span className="italic text-muted-foreground">Not set</span>}
              </p>
            </div>
          )}

          {/* Suggested value input */}
          {fieldName && (
            <div className="space-y-2">
              <Label>Suggested value</Label>
              {renderValueInput()}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Additional notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why is this change needed?"
              className="bg-card border-border resize-none"
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={createSuggestion.isPending || !fieldName || !suggestedValue.trim()}
          >
            {createSuggestion.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Suggestion'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
