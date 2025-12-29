import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlaceFormData, DEFAULT_PLACE_FORM_DATA } from '@/types/placeForm';
import { useToast } from '@/hooks/use-toast';

// Fetch primary categories
export function usePrimaryCategories() {
  return useQuery({
    queryKey: ['primary-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('primary_categories')
        .select('*')
        .order('category_group')
        .order('sort_order');
      
      if (error) throw error;
      return data;
    },
  });
}

// Fetch secondary categories (tags)
export function useSecondaryCategories() {
  return useQuery({
    queryKey: ['secondary-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('secondary_categories')
        .select('*')
        .order('tag_group')
        .order('sort_order');
      
      if (error) throw error;
      return data;
    },
  });
}

// Save draft
export function useSaveDraft() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      draftData, 
      currentStep, 
      placeId, 
      isEdit 
    }: { 
      draftData: PlaceFormData; 
      currentStep: number; 
      placeId?: string;
      isEdit?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in to save draft');

      // Check if draft exists
      const { data: existing } = await supabase
        .from('place_drafts')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_edit', isEdit || false)
        .maybeSingle();

      const draftJson = JSON.parse(JSON.stringify(draftData));

      if (existing) {
        const { error } = await supabase
          .from('place_drafts')
          .update({
            draft_data: draftJson,
            current_step: currentStep,
            place_id: placeId || null,
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('place_drafts')
          .insert([{
            user_id: user.id,
            draft_data: draftJson,
            current_step: currentStep,
            place_id: placeId || null,
            is_edit: isEdit || false,
          }]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place-draft'] });
      toast({
        title: 'Draft saved',
        description: 'Your progress has been saved.',
      });
    },
    onError: (error) => {
      console.error('Error saving draft:', error);
    },
  });
}

// Load draft
export function usePlaceDraft(isEdit: boolean = false) {
  return useQuery({
    queryKey: ['place-draft', isEdit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('place_drafts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_edit', isEdit)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });
}

// Delete draft
export function useDeleteDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isEdit: boolean = false) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('place_drafts')
        .delete()
        .eq('user_id', user.id)
        .eq('is_edit', isEdit);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place-draft'] });
    },
  });
}

// Submit new place
export function useSubmitPlace() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (formData: PlaceFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in to submit a place');

      // Queue the place for import review
      const formDataJson = JSON.parse(JSON.stringify(formData));
      
      const { data, error } = await supabase
        .from('import_queue')
        .insert([{
          source: 'user_submission',
          name: formData.name,
          latitude: formData.latitude || 0,
          longitude: formData.longitude || 0,
          suggested_primary_category: formData.primaryCategoryId || null,
          suggested_tags: formData.secondaryTags,
          raw_data: formDataJson,
          status: 'pending',
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['place-draft'] });
      toast({
        title: 'Place submitted',
        description: 'Your place has been submitted for review.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Submission failed',
        description: error.message || 'Failed to submit place.',
        variant: 'destructive',
      });
    },
  });
}

// Submit edit suggestion
export function useSubmitEditSuggestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      placeId, 
      formData, 
      notes 
    }: { 
      placeId: string; 
      formData: Partial<PlaceFormData>; 
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in to suggest edits');

      const { data, error } = await supabase
        .from('place_suggestions')
        .insert({
          place_id: placeId,
          user_id: user.id,
          field_name: 'bulk_update',
          current_value: null,
          suggested_value: JSON.stringify(formData),
          notes: notes || null,
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['place-draft'] });
      toast({
        title: 'Edit suggestion submitted',
        description: 'Your suggested changes are pending admin review.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Submission failed',
        description: error.message || 'Failed to submit suggestion.',
        variant: 'destructive',
      });
    },
  });
}

// Form state hook
export function usePlaceFormState(initialData?: Partial<PlaceFormData>) {
  const [formData, setFormData] = useState<PlaceFormData>({
    ...DEFAULT_PLACE_FORM_DATA,
    ...initialData,
  });
  const [currentStep, setCurrentStep] = useState(1);

  const updateField = useCallback(<K extends keyof PlaceFormData>(
    field: K,
    value: PlaceFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateFields = useCallback((updates: Partial<PlaceFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({ ...DEFAULT_PLACE_FORM_DATA, ...initialData });
    setCurrentStep(1);
  }, [initialData]);

  return {
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    updateField,
    updateFields,
    resetForm,
  };
}
