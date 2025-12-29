import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PlaceFormData } from '@/types/placeForm';
import { useSecondaryCategories } from '@/hooks/usePlaceForm';
import { CategorySelector } from '@/components/CategorySelector';
import { X } from 'lucide-react';

interface StepBasicInfoProps {
  formData: PlaceFormData;
  updateField: <K extends keyof PlaceFormData>(field: K, value: PlaceFormData[K]) => void;
}

const TAG_GROUP_LABELS: Record<string, string> = {
  rv_specific: 'RV-Specific',
  utilities: 'Utilities',
  environment: 'Environment',
  rules_policies: 'Rules & Policies',
  cost: 'Cost',
};

export function StepBasicInfo({ formData, updateField }: StepBasicInfoProps) {
  const { data: secondaryCategories } = useSecondaryCategories();

  // Group tags by tag_group
  const groupedTags = secondaryCategories?.reduce((acc, tag) => {
    const group = tag.tag_group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(tag);
    return acc;
  }, {} as Record<string, typeof secondaryCategories>);

  const toggleTag = (tagId: string) => {
    const current = formData.secondaryTags;
    if (current.includes(tagId)) {
      updateField('secondaryTags', current.filter(t => t !== tagId));
    } else if (current.length < 3) {
      updateField('secondaryTags', [...current, tagId]);
    }
  };

  const removeTag = (tagId: string) => {
    updateField('secondaryTags', formData.secondaryTags.filter(t => t !== tagId));
  };

  return (
    <div className="space-y-6">
      {/* Place Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Place Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="e.g., Sunset RV Park"
          className="text-base"
        />
      </div>

      {/* Category Selector */}
      <div className="space-y-2">
        <Label>Categories *</Label>
        <CategorySelector
          primaryCategoryId={formData.primaryCategoryId}
          additionalCategoryIds={formData.additionalCategoryIds}
          customCategoryText={formData.customCategoryText}
          onPrimaryChange={(categoryId) => updateField('primaryCategoryId', categoryId)}
          onAdditionalChange={(categoryIds) => updateField('additionalCategoryIds', categoryIds)}
          onCustomTextChange={(text) => updateField('customCategoryText', text)}
          maxAdditional={5}
        />
      </div>

      {/* Secondary Tags */}
      <div className="space-y-2">
        <Label>Secondary Tags (up to 3)</Label>
        <p className="text-xs text-muted-foreground">
          Tags describe features or conditions of the place.
        </p>
        
        {formData.secondaryTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.secondaryTags.map(tagId => {
              const tag = secondaryCategories?.find(t => t.id === tagId);
              return (
                <Badge key={tagId} variant="secondary" className="gap-1">
                  {tag?.label || tagId}
                  <button 
                    type="button"
                    onClick={() => removeTag(tagId)} 
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}

        <div className="border rounded-lg p-3 max-h-[200px] overflow-y-auto space-y-3">
          {groupedTags && Object.entries(groupedTags).map(([group, tags]) => (
            <div key={group}>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {TAG_GROUP_LABELS[group] || group}
              </p>
              <div className="flex flex-wrap gap-1">
                {tags?.map((tag) => {
                  const isSelected = formData.secondaryTags.includes(tag.id);
                  const isDisabled = !isSelected && formData.secondaryTags.length >= 3;
                  
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      disabled={isDisabled}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground' 
                          : isDisabled
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Short Summary */}
      <div className="space-y-2">
        <Label htmlFor="summary">Short Summary (optional)</Label>
        <Textarea
          id="summary"
          value={formData.shortSummary}
          onChange={(e) => updateField('shortSummary', e.target.value)}
          placeholder="Brief one-liner about this place..."
          rows={2}
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground text-right">
          {formData.shortSummary.length}/200
        </p>
      </div>
    </div>
  );
}