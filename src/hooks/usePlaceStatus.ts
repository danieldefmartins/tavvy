import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PlaceStatus } from '@/hooks/usePlaces';

export interface StatusUpdate {
  id: string;
  placeId: string;
  userId: string;
  status: PlaceStatus;
  note: string | null;
  createdAt: Date;
  approvedAt: Date | null;
  approvedBy: string | null;
  expiresAt: Date | null;
  isApproved: boolean;
  isRejected: boolean;
  profile?: {
    displayName: string | null;
  };
}

interface StatusUpdateRow {
  id: string;
  place_id: string;
  user_id: string;
  status: string;
  note: string | null;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
  expires_at: string | null;
  is_approved: boolean;
  is_rejected: boolean;
  profiles?: {
    display_name: string | null;
  };
}

function transformStatusUpdate(row: StatusUpdateRow): StatusUpdate {
  return {
    id: row.id,
    placeId: row.place_id,
    userId: row.user_id,
    status: row.status as PlaceStatus,
    note: row.note,
    createdAt: new Date(row.created_at),
    approvedAt: row.approved_at ? new Date(row.approved_at) : null,
    approvedBy: row.approved_by,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    isApproved: row.is_approved,
    isRejected: row.is_rejected,
    profile: row.profiles ? {
      displayName: row.profiles.display_name,
    } : undefined,
  };
}

// Fetch pending status updates for a place
export function usePendingStatusUpdates(placeId: string) {
  return useQuery({
    queryKey: ['status-updates', placeId, 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_status_updates')
        .select(`
          *,
          profiles!place_status_updates_user_id_fkey (
            display_name
          )
        `)
        .eq('place_id', placeId)
        .eq('is_approved', false)
        .eq('is_rejected', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as StatusUpdateRow[]).map(transformStatusUpdate);
    },
    enabled: !!placeId,
  });
}

// Fetch all pending status updates (for admin)
export function useAllPendingStatusUpdates() {
  return useQuery({
    queryKey: ['status-updates', 'all-pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_status_updates')
        .select(`
          *,
          profiles!place_status_updates_user_id_fkey (
            display_name
          ),
          places!place_status_updates_place_id_fkey (
            name
          )
        `)
        .eq('is_approved', false)
        .eq('is_rejected', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map((row: any) => ({
        ...transformStatusUpdate(row),
        placeName: row.places?.name,
      }));
    },
  });
}

// Create a status update suggestion
export function useCreateStatusUpdate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      placeId, 
      status, 
      note 
    }: { 
      placeId: string; 
      status: PlaceStatus; 
      note?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('place_status_updates')
        .insert({
          place_id: placeId,
          user_id: user.id,
          status,
          note: note || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['status-updates', variables.placeId] });
    },
  });
}

// Approve a status update (admin only)
export function useApproveStatusUpdate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ updateId, placeId, status }: { 
      updateId: string; 
      placeId: string; 
      status: PlaceStatus;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 60); // 60 days from now

      // Update the status update record
      const { error: updateError } = await supabase
        .from('place_status_updates')
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', updateId);

      if (updateError) throw updateError;

      // Update the place's current status
      const { error: placeError } = await supabase
        .from('places')
        .update({
          current_status: status,
          status_updated_at: new Date().toISOString(),
        })
        .eq('id', placeId);

      if (placeError) throw placeError;

      return { placeId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['status-updates'] });
      queryClient.invalidateQueries({ queryKey: ['place', data.placeId] });
      queryClient.invalidateQueries({ queryKey: ['places'] });
    },
  });
}

// Reject a status update (admin only)
export function useRejectStatusUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ updateId, placeId }: { updateId: string; placeId: string }) => {
      const { error } = await supabase
        .from('place_status_updates')
        .update({ is_rejected: true })
        .eq('id', updateId);

      if (error) throw error;
      return { placeId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['status-updates'] });
    },
  });
}

// Status display helpers
export const STATUS_CONFIG: Record<PlaceStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
  description: string;
}> = {
  open_accessible: {
    label: 'Open & Accessible',
    color: 'text-success',
    bgColor: 'bg-success/10',
    description: 'Place is open and accessible to RVs',
  },
  access_questionable: {
    label: 'Access Questionable',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    description: 'Access may be limited or unclear',
  },
  temporarily_closed: {
    label: 'Temporarily Closed',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    description: 'Currently closed or unavailable',
  },
  restrictions_reported: {
    label: 'Restrictions Reported',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    description: 'Users have reported restrictions',
  },
};
