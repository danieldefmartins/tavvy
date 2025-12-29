import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type CheckinType = 'stayed_here' | 'used_dump_water' | 'passed_by';

export interface Checkin {
  id: string;
  placeId: string;
  userId: string;
  type: CheckinType;
  note: string | null;
  createdAt: Date;
  profile?: {
    displayName: string | null;
    isPro: boolean;
    trustedContributor: boolean;
  };
}

interface CheckinRow {
  id: string;
  place_id: string;
  user_id: string;
  type: string;
  note: string | null;
  created_at: string;
  profiles?: {
    display_name: string | null;
    is_pro: boolean;
    trusted_contributor: boolean;
  };
}

function transformCheckin(row: CheckinRow): Checkin {
  return {
    id: row.id,
    placeId: row.place_id,
    userId: row.user_id,
    type: row.type as CheckinType,
    note: row.note,
    createdAt: new Date(row.created_at),
    profile: row.profiles ? {
      displayName: row.profiles.display_name,
      isPro: row.profiles.is_pro,
      trustedContributor: row.profiles.trusted_contributor,
    } : undefined,
  };
}

export function usePlaceCheckins(placeId: string) {
  return useQuery({
    queryKey: ['checkins', placeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_checkins')
        .select(`
          id,
          place_id,
          user_id,
          type,
          note,
          created_at,
          profiles!place_checkins_user_id_fkey (
            display_name,
            is_pro,
            trusted_contributor
          )
        `)
        .eq('place_id', placeId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data as CheckinRow[]).map(transformCheckin);
    },
    enabled: !!placeId,
  });
}

export function useCreateCheckin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      placeId, 
      type, 
      note 
    }: { 
      placeId: string; 
      type: CheckinType; 
      note?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('place_checkins')
        .insert({
          place_id: placeId,
          user_id: user.id,
          type,
          note: note || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['checkins', variables.placeId] });
    },
  });
}

export function useDeleteCheckin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ checkinId, placeId }: { checkinId: string; placeId: string }) => {
      const { error } = await supabase
        .from('place_checkins')
        .delete()
        .eq('id', checkinId);

      if (error) throw error;
      return { placeId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['checkins', data.placeId] });
    },
  });
}

// Get count stats for a place
export function useCheckinStats(placeId: string) {
  return useQuery({
    queryKey: ['checkin-stats', placeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_checkins')
        .select('type')
        .eq('place_id', placeId);

      if (error) throw error;

      const stats = {
        stayed_here: 0,
        used_dump_water: 0,
        passed_by: 0,
        total: data.length,
      };

      data.forEach((row) => {
        const type = row.type as CheckinType;
        if (type in stats) {
          stats[type]++;
        }
      });

      return stats;
    },
    enabled: !!placeId,
  });
}
