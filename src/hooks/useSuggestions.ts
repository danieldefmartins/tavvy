import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SuggestionStatus = 'pending' | 'approved' | 'rejected';

export interface Suggestion {
  id: string;
  placeId: string;
  userId: string;
  fieldName: string;
  currentValue: string | null;
  suggestedValue: string;
  notes: string | null;
  status: SuggestionStatus;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  // Joined data
  userDisplayName?: string;
  userIsPro?: boolean;
}

interface SuggestionRow {
  id: string;
  place_id: string;
  user_id: string;
  field_name: string;
  current_value: string | null;
  suggested_value: string;
  notes: string | null;
  status: SuggestionStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  profiles?: { display_name: string | null; is_pro: boolean };
}

function transformSuggestion(row: SuggestionRow): Suggestion {
  return {
    id: row.id,
    placeId: row.place_id,
    userId: row.user_id,
    fieldName: row.field_name,
    currentValue: row.current_value,
    suggestedValue: row.suggested_value,
    notes: row.notes,
    status: row.status,
    createdAt: new Date(row.created_at),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
    reviewedBy: row.reviewed_by,
    rejectionReason: row.rejection_reason,
    userDisplayName: row.profiles?.display_name || 'Anonymous',
    userIsPro: row.profiles?.is_pro || false,
  };
}

export function usePlaceSuggestions(placeId: string) {
  return useQuery({
    queryKey: ['suggestions', placeId],
    queryFn: async (): Promise<Suggestion[]> => {
      const { data, error } = await supabase
        .from('place_suggestions')
        .select('*, profiles!place_suggestions_user_id_fkey(display_name, is_pro)')
        .eq('place_id', placeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as SuggestionRow[]).map(transformSuggestion);
    },
    enabled: !!placeId,
  });
}

export interface CreateSuggestionData {
  placeId: string;
  fieldName: string;
  currentValue: string | null;
  suggestedValue: string;
  notes?: string;
}

export function useCreateSuggestion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateSuggestionData) => {
      if (!user) throw new Error('Must be logged in');

      const { data: result, error } = await supabase
        .from('place_suggestions')
        .insert({
          place_id: data.placeId,
          user_id: user.id,
          field_name: data.fieldName,
          current_value: data.currentValue,
          suggested_value: data.suggestedValue,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suggestions', variables.placeId] });
    },
  });
}

// Field display names for UI
export const FIELD_LABELS: Record<string, string> = {
  name: 'Place Name',
  primary_category: 'Category',
  price_level: 'Price Level',
  packages_accepted: 'Packages Accepted',
  package_fee_required: 'Package Fee Required',
  package_fee_amount: 'Package Fee Amount',
  features: 'Features',
  open_year_round: 'Open Year-Round',
  latitude: 'Latitude',
  longitude: 'Longitude',
};
