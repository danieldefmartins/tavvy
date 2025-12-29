import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EntranceData } from '@/types/entrance';

// Maximum number of entrances per place
const MAX_ENTRANCES = 6;

// Entrance fields in database (for building dynamic queries)
const ENTRANCE_FIELDS = [
  'name', 'latitude', 'longitude', 'road', 'notes', 'is_primary',
  'max_rv_length_ft', 'max_rv_height_ft', 'road_type', 'grade',
  'tight_turns', 'low_clearance', 'seasonal_access', 'seasonal_notes'
];

function getEntranceSelectFields(): string {
  const fields: string[] = [];
  for (let i = 1; i <= MAX_ENTRANCES; i++) {
    ENTRANCE_FIELDS.forEach(field => {
      fields.push(`entrance_${i}_${field}`);
    });
  }
  return fields.join(', ');
}

export function extractEntrancesWithRVData(place: Record<string, unknown>): EntranceData[] {
  const entrances: EntranceData[] = [];

  for (let i = 1; i <= MAX_ENTRANCES; i++) {
    const name = place[`entrance_${i}_name`] as string | undefined;
    const lat = place[`entrance_${i}_latitude`] as number | undefined;
    const lng = place[`entrance_${i}_longitude`] as number | undefined;

    if (name && lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      entrances.push({
        name,
        latitude: lat,
        longitude: lng,
        road: (place[`entrance_${i}_road`] as string) || undefined,
        notes: (place[`entrance_${i}_notes`] as string) || undefined,
        isPrimary: (place[`entrance_${i}_is_primary`] as boolean) || false,
        maxRvLengthFt: (place[`entrance_${i}_max_rv_length_ft`] as number) || null,
        maxRvHeightFt: (place[`entrance_${i}_max_rv_height_ft`] as number) || null,
        roadType: (place[`entrance_${i}_road_type`] as 'paved' | 'gravel' | 'dirt') || null,
        grade: (place[`entrance_${i}_grade`] as 'flat' | 'moderate' | 'steep') || null,
        tightTurns: place[`entrance_${i}_tight_turns`] as boolean | null,
        lowClearance: place[`entrance_${i}_low_clearance`] as boolean | null,
        seasonalAccess: (place[`entrance_${i}_seasonal_access`] as 'year_round' | 'seasonal') || null,
        seasonalNotes: (place[`entrance_${i}_seasonal_notes`] as string) || undefined,
      });
    }
  }

  return entrances;
}

export function usePlaceEntrances(placeId: string | undefined) {
  const [entrances, setEntrances] = useState<EntranceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useState(() => {
    if (!placeId) {
      setIsLoading(false);
      return;
    }

    supabase
      .from('places')
      .select(getEntranceSelectFields())
      .eq('id', placeId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) {
          const extracted = extractEntrancesWithRVData(data as unknown as Record<string, unknown>);
          setEntrances(extracted);
        }
        setIsLoading(false);
      });
  });

  return { entrances, isLoading, setEntrances };
}

export function useAddEntrance(placeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entrance: EntranceData) => {
      // First, get current entrances to find next available slot
      const { data: place, error: fetchError } = await supabase
        .from('places')
        .select(getEntranceSelectFields())
        .eq('id', placeId)
        .single();

      if (fetchError) throw fetchError;

      // Find next available slot (1-6)
      let nextSlot = 0;
      const placeData = place as unknown as Record<string, unknown>;
      for (let i = 1; i <= MAX_ENTRANCES; i++) {
        const name = placeData[`entrance_${i}_name`];
        if (!name) {
          nextSlot = i;
          break;
        }
      }

      if (nextSlot === 0) {
        throw new Error('Maximum number of entrances (6) reached');
      }

      // Build update object for this slot
      const updateData: Record<string, unknown> = {
        [`entrance_${nextSlot}_name`]: entrance.name,
        [`entrance_${nextSlot}_latitude`]: entrance.latitude,
        [`entrance_${nextSlot}_longitude`]: entrance.longitude,
        [`entrance_${nextSlot}_road`]: entrance.road || null,
        [`entrance_${nextSlot}_notes`]: entrance.notes || null,
        [`entrance_${nextSlot}_is_primary`]: entrance.isPrimary || false,
        [`entrance_${nextSlot}_max_rv_length_ft`]: entrance.maxRvLengthFt || null,
        [`entrance_${nextSlot}_max_rv_height_ft`]: entrance.maxRvHeightFt || null,
        [`entrance_${nextSlot}_road_type`]: entrance.roadType || null,
        [`entrance_${nextSlot}_grade`]: entrance.grade || null,
        [`entrance_${nextSlot}_tight_turns`]: entrance.tightTurns ?? null,
        [`entrance_${nextSlot}_low_clearance`]: entrance.lowClearance ?? null,
        [`entrance_${nextSlot}_seasonal_access`]: entrance.seasonalAccess || null,
        [`entrance_${nextSlot}_seasonal_notes`]: entrance.seasonalNotes || null,
      };

      const { error: updateError } = await supabase
        .from('places')
        .update(updateData)
        .eq('id', placeId);

      if (updateError) throw updateError;

      return { slot: nextSlot };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place', placeId] });
      queryClient.invalidateQueries({ queryKey: ['places'] });
      toast.success('Entrance added successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add entrance');
    },
  });
}

export function useUpdateEntrance(placeId: string, entranceIndex: number) {
  const queryClient = useQueryClient();
  const slot = entranceIndex + 1; // Convert 0-indexed to 1-indexed

  return useMutation({
    mutationFn: async (entrance: EntranceData) => {
      const updateData: Record<string, unknown> = {
        [`entrance_${slot}_name`]: entrance.name,
        [`entrance_${slot}_latitude`]: entrance.latitude,
        [`entrance_${slot}_longitude`]: entrance.longitude,
        [`entrance_${slot}_road`]: entrance.road || null,
        [`entrance_${slot}_notes`]: entrance.notes || null,
        [`entrance_${slot}_is_primary`]: entrance.isPrimary || false,
        [`entrance_${slot}_max_rv_length_ft`]: entrance.maxRvLengthFt || null,
        [`entrance_${slot}_max_rv_height_ft`]: entrance.maxRvHeightFt || null,
        [`entrance_${slot}_road_type`]: entrance.roadType || null,
        [`entrance_${slot}_grade`]: entrance.grade || null,
        [`entrance_${slot}_tight_turns`]: entrance.tightTurns ?? null,
        [`entrance_${slot}_low_clearance`]: entrance.lowClearance ?? null,
        [`entrance_${slot}_seasonal_access`]: entrance.seasonalAccess || null,
        [`entrance_${slot}_seasonal_notes`]: entrance.seasonalNotes || null,
      };

      const { error } = await supabase
        .from('places')
        .update(updateData)
        .eq('id', placeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place', placeId] });
      queryClient.invalidateQueries({ queryKey: ['places'] });
      toast.success('Entrance updated successfully');
    },
    onError: () => {
      toast.error('Failed to update entrance');
    },
  });
}

export function useDeleteEntrance(placeId: string, entranceIndex: number) {
  const queryClient = useQueryClient();
  const slot = entranceIndex + 1;

  return useMutation({
    mutationFn: async () => {
      // Clear all fields for this entrance slot
      const updateData: Record<string, unknown> = {
        [`entrance_${slot}_name`]: null,
        [`entrance_${slot}_latitude`]: null,
        [`entrance_${slot}_longitude`]: null,
        [`entrance_${slot}_road`]: null,
        [`entrance_${slot}_notes`]: null,
        [`entrance_${slot}_is_primary`]: false,
        [`entrance_${slot}_max_rv_length_ft`]: null,
        [`entrance_${slot}_max_rv_height_ft`]: null,
        [`entrance_${slot}_road_type`]: null,
        [`entrance_${slot}_grade`]: null,
        [`entrance_${slot}_tight_turns`]: null,
        [`entrance_${slot}_low_clearance`]: null,
        [`entrance_${slot}_seasonal_access`]: null,
        [`entrance_${slot}_seasonal_notes`]: null,
      };

      const { error } = await supabase
        .from('places')
        .update(updateData)
        .eq('id', placeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place', placeId] });
      queryClient.invalidateQueries({ queryKey: ['places'] });
      toast.success('Entrance removed');
    },
    onError: () => {
      toast.error('Failed to remove entrance');
    },
  });
}
