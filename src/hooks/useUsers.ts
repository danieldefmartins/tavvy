import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  isVerified: boolean;
  isPro: boolean;
  contributionCount: number;
  trustedContributor: boolean;
  trustedSince: Date | null;
  createdAt: Date;
}

interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  is_verified: boolean;
  is_pro: boolean;
  contribution_count: number;
  trusted_contributor: boolean;
  trusted_since: string | null;
  created_at: string;
}

function transformProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    isVerified: row.is_verified,
    isPro: row.is_pro,
    contributionCount: row.contribution_count,
    trustedContributor: row.trusted_contributor,
    trustedSince: row.trusted_since ? new Date(row.trusted_since) : null,
    createdAt: new Date(row.created_at),
  };
}

// Fetch all users (admin only)
export function useAllUsers(searchQuery?: string) {
  return useQuery({
    queryKey: ['all-users', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('contribution_count', { ascending: false });

      if (searchQuery && searchQuery.trim()) {
        query = query.or(`email.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return (data as ProfileRow[]).map(transformProfile);
    },
  });
}

// Toggle trusted status (admin only)
export function useToggleTrusted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, trusted }: { userId: string; trusted: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          trusted_contributor: trusted,
          trusted_since: trusted ? new Date().toISOString() : null,
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
  });
}

// Check if current user just became trusted (for congrats modal)
export function useCheckNewTrusted() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['check-new-trusted', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('trusted_contributor, trusted_since, contribution_count')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Check if trusted_since is within last 5 minutes (just became trusted)
      if (data.trusted_contributor && data.trusted_since) {
        const trustedDate = new Date(data.trusted_since);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (trustedDate > fiveMinutesAgo) {
          return { isNewlyTrusted: true, contributionCount: data.contribution_count };
        }
      }

      return { isNewlyTrusted: false, contributionCount: data.contribution_count };
    },
    enabled: !!user,
    staleTime: 30000, // Check every 30 seconds
  });
}

// Get current user's contribution stats
export function useMyContributions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-contributions', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('contribution_count, trusted_contributor, trusted_since')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data ? {
        contributionCount: data.contribution_count,
        trustedContributor: data.trusted_contributor,
        trustedSince: data.trusted_since ? new Date(data.trusted_since) : null,
      } : null;
    },
    enabled: !!user,
  });
}
