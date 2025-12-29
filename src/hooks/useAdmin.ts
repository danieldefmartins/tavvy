import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Suggestion } from './useSuggestions';

interface SuggestionWithPlace extends Suggestion {
  placeName: string;
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
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  profiles?: { display_name: string | null; is_pro: boolean };
  places?: { name: string };
}

function transformSuggestionWithPlace(row: SuggestionRow): SuggestionWithPlace {
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
    placeName: row.places?.name || 'Unknown Place',
  };
}

export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!user) return false;

      const { data, error } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      return data ?? false;
    },
    enabled: !!user,
  });
}

export function usePendingSuggestions() {
  return useQuery({
    queryKey: ['adminSuggestions', 'pending'],
    queryFn: async (): Promise<SuggestionWithPlace[]> => {
      const { data, error } = await supabase
        .from('place_suggestions')
        .select('*, profiles!place_suggestions_user_id_fkey(display_name, is_pro), places!place_suggestions_place_id_fkey(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as SuggestionRow[]).map(transformSuggestionWithPlace);
    },
  });
}

export function useApproveSuggestion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (suggestion: SuggestionWithPlace) => {
      if (!user) throw new Error('Must be logged in');

      // First, update the place with the suggested value
      const updateData: Record<string, unknown> = {};
      
      // Map field names to database columns
      const fieldMapping: Record<string, string> = {
        name: 'name',
        primary_category: 'primary_category',
        price_level: 'price_level',
        packages_accepted: 'packages_accepted',
        package_fee_required: 'package_fee_required',
        package_fee_amount: 'package_fee_amount',
        features: 'features',
        open_year_round: 'open_year_round',
        latitude: 'latitude',
        longitude: 'longitude',
      };

      const dbColumn = fieldMapping[suggestion.fieldName];
      if (!dbColumn) throw new Error(`Unknown field: ${suggestion.fieldName}`);

      // Parse the value appropriately
      let parsedValue: unknown = suggestion.suggestedValue;
      
      if (suggestion.fieldName === 'package_fee_required' || suggestion.fieldName === 'open_year_round') {
        parsedValue = suggestion.suggestedValue === 'true';
      } else if (suggestion.fieldName === 'features') {
        parsedValue = JSON.parse(suggestion.suggestedValue);
      } else if (suggestion.fieldName === 'latitude' || suggestion.fieldName === 'longitude') {
        parsedValue = parseFloat(suggestion.suggestedValue);
      }

      updateData[dbColumn] = parsedValue;

      // Update the place
      const { error: placeError } = await supabase
        .from('places')
        .update(updateData)
        .eq('id', suggestion.placeId);

      if (placeError) throw placeError;

      // Mark suggestion as approved
      const { error: suggestionError } = await supabase
        .from('place_suggestions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', suggestion.id);

      if (suggestionError) throw suggestionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSuggestions'] });
      queryClient.invalidateQueries({ queryKey: ['places'] });
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
}

export function useRejectSuggestion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ suggestionId, reason }: { suggestionId: string; reason?: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('place_suggestions')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          rejection_reason: reason || null,
        })
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSuggestions'] });
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
}

export function useToggleProStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isPro }: { userId: string; isPro: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_pro: isPro })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSuggestions'] });
    },
  });
}
