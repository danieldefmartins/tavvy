import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Membership {
  id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  affiliate_url: string | null;
  icon: string | null;
  sort_order: number;
}

export interface UserMembership {
  id: string;
  user_id: string;
  membership_id: string;
  created_at: string;
}

export interface PlaceMembership {
  id: string;
  place_id: string;
  membership_id: string;
  is_verified: boolean;
  notes: string | null;
}

// Fetch all available memberships
export function useMembershipsList() {
  return useQuery({
    queryKey: ['memberships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Membership[];
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

// Fetch current user's memberships
export function useUserMemberships() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-memberships', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_memberships')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as UserMembership[];
    },
    enabled: !!user?.id,
  });
}

// Toggle a membership on/off for the current user
export function useToggleMembership() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ membershipId, isAdding }: { membershipId: string; isAdding: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (isAdding) {
        const { error } = await supabase
          .from('user_memberships')
          .insert({ user_id: user.id, membership_id: membershipId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_memberships')
          .delete()
          .eq('user_id', user.id)
          .eq('membership_id', membershipId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-memberships', user?.id] });
    },
  });
}

// Fetch memberships for a specific place
export function usePlaceMemberships(placeId: string | undefined) {
  return useQuery({
    queryKey: ['place-memberships', placeId],
    queryFn: async () => {
      if (!placeId) return [];

      const { data, error } = await supabase
        .from('place_memberships')
        .select(`
          *,
          membership:memberships(id, name, icon)
        `)
        .eq('place_id', placeId);

      if (error) throw error;
      return data as (PlaceMembership & { membership: Pick<Membership, 'id' | 'name' | 'icon'> })[];
    },
    enabled: !!placeId,
  });
}

// Fetch all place memberships for batch sorting/filtering
export function useAllPlaceMemberships() {
  return useQuery({
    queryKey: ['all-place-memberships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_memberships')
        .select('place_id, membership_id');

      if (error) throw error;
      
      // Create a map of place_id -> set of membership_ids
      const placeMembershipMap = new Map<string, Set<string>>();
      for (const pm of data || []) {
        if (!placeMembershipMap.has(pm.place_id)) {
          placeMembershipMap.set(pm.place_id, new Set());
        }
        placeMembershipMap.get(pm.place_id)!.add(pm.membership_id);
      }
      
      return placeMembershipMap;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// Check if a place matches any of the user's memberships (batch version)
export function getPlaceMembershipMatches(
  placeId: string,
  userMembershipIds: Set<string>,
  placeMembershipMap: Map<string, Set<string>> | undefined
): string[] {
  if (!placeMembershipMap) return [];
  const placeMemberships = placeMembershipMap.get(placeId);
  if (!placeMemberships) return [];
  
  const matches: string[] = [];
  for (const membershipId of placeMemberships) {
    if (userMembershipIds.has(membershipId)) {
      matches.push(membershipId);
    }
  }
  return matches;
}

// Check if a place matches any of the user's memberships
export function useUserPlaceMembershipMatch(placeId: string | undefined) {
  const { data: userMemberships } = useUserMemberships();
  const { data: placeMemberships } = usePlaceMemberships(placeId);

  if (!userMemberships || !placeMemberships) {
    return { matches: [], hasMatch: false };
  }

  const userMembershipIds = new Set(userMemberships.map(um => um.membership_id));
  const matches = placeMemberships.filter(pm => userMembershipIds.has(pm.membership_id));

  return {
    matches,
    hasMatch: matches.length > 0,
  };
}

// Update membership prompt shown flag
export function useMarkMembershipPromptShown() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ membership_prompt_shown: true })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
