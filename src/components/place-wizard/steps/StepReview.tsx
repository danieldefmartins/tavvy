import { PlaceFormData } from '@/types/placeForm';
import { usePrimaryCategories, useSecondaryCategories } from '@/hooks/usePlaceForm';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface StepReviewProps {
  formData: PlaceFormData;
}

export function StepReview({ formData }: StepReviewProps) {
  const { data: primaryCategories } = usePrimaryCategories();
  const { data: secondaryCategories } = useSecondaryCategories();

  const category = primaryCategories?.find(c => c.id === formData.primaryCategoryId);
  const tags = formData.secondaryTags.map(id => secondaryCategories?.find(t => t.id === id)?.label || id);

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Place Name</p>
          <p className="font-semibold text-lg">{formData.name || '(Not set)'}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Category</p>
            <p className="font-medium">{category?.label || formData.primaryCategoryId || '(Not set)'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tags</p>
            <div className="flex flex-wrap gap-1">{tags.length > 0 ? tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>) : <span className="text-muted-foreground text-sm">None</span>}</div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Location</p>
            <p className="font-medium">{formData.latitude && formData.longitude ? `${formData.latitude.toFixed(4)}, ${formData.longitude.toFixed(4)}` : '(Not set)'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Price Level</p>
            <p className="font-medium">{formData.priceLevel}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Big Rig Friendly</p>
            <p className="font-medium capitalize">{formData.bigRigFriendly}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Packages Accepted</p>
            <p className="font-medium">{formData.packagesAccepted}</p>
          </div>
        </div>
        {formData.description && (
          <div>
            <p className="text-sm text-muted-foreground">Description</p>
            <p className="text-sm">{formData.description}</p>
          </div>
        )}
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Checkbox id="disclaimer" className="mt-0.5" />
          <Label htmlFor="disclaimer" className="text-sm cursor-pointer">
            I understand that information is user-provided and may not be accurate. Always verify local laws, signs, and regulations before visiting.
          </Label>
        </div>
      </div>
    </div>
  );
}
