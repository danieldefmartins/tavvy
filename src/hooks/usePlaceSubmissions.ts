import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';

type PlaceCategory = Database['public']['Enums']['place_category'];
type PlaceFeature = Database['public']['Enums']['place_feature'];
type PriceLevel = Database['public']['Enums']['price_level'];
type PackageAcceptance = Database['public']['Enums']['package_acceptance'];
type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface PlaceSubmission {
  id: string;
  submittedBy: string;
  submitterName?: string;
  status: SubmissionStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  name: string;
  primaryCategory: PlaceCategory;
  latitude: number;
  longitude: number;
  address: string | null;
  description: string | null;
  features: PlaceFeature[];
  rulesNotes: string | null;
  priceLevel: PriceLevel;
  packagesAccepted: PackageAcceptance;
  openYearRound: boolean;
}

interface SubmissionRow {
  id: string;
  submitted_by: string;
  status: SubmissionStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  name: string;
  primary_category: PlaceCategory;
  latitude: number;
  longitude: number;
  address: string | null;
  description: string | null;
  features: PlaceFeature[];
  rules_notes: string | null;
  price_level: PriceLevel;
  packages_accepted: PackageAcceptance;
  open_year_round: boolean;
  profiles?: { display_name: string | null } | null;
}

const transformSubmission = (row: SubmissionRow): PlaceSubmission => ({
  id: row.id,
  submittedBy: row.submitted_by,
  submitterName: row.profiles?.display_name || undefined,
  status: row.status,
  createdAt: row.created_at,
  reviewedAt: row.reviewed_at,
  reviewedBy: row.reviewed_by,
  rejectionReason: row.rejection_reason,
  name: row.name,
  primaryCategory: row.primary_category,
  latitude: row.latitude,
  longitude: row.longitude,
  address: row.address,
  description: row.description,
  features: row.features || [],
  rulesNotes: row.rules_notes,
  priceLevel: row.price_level,
  packagesAccepted: row.packages_accepted,
  openYearRound: row.open_year_round,
});

// Fetch all pending submissions (for admin)
export const usePendingSubmissions = () => {
  return useQuery({
    queryKey: ['place-submissions', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_submissions' as any)
        .select(`
          *,
          profiles:submitted_by (display_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return ((data || []) as unknown as SubmissionRow[]).map(transformSubmission);
    },
  });
};

// Fetch all submissions (for admin history)
export const useAllSubmissions = () => {
  return useQuery({
    queryKey: ['place-submissions', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_submissions' as any)
        .select(`
          *,
          profiles:submitted_by (display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return ((data || []) as unknown as SubmissionRow[]).map(transformSubmission);
    },
  });
};

// Fetch pending submissions for map display
export const usePendingPlacesForMap = () => {
  return useQuery({
    queryKey: ['place-submissions', 'pending-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_submissions' as any)
        .select('id, name, latitude, longitude, primary_category')
        .eq('status', 'pending');

      if (error) throw error;
      return (data || []) as unknown as { id: string; name: string; latitude: number; longitude: number; primary_category: PlaceCategory }[];
    },
  });
};

export interface CreateSubmissionData {
  name: string;
  primaryCategory: PlaceCategory;
  latitude: number;
  longitude: number;
  address?: string;
  description?: string;
  features?: PlaceFeature[];
  rulesNotes?: string;
  priceLevel?: PriceLevel;
  packagesAccepted?: PackageAcceptance;
  openYearRound?: boolean;
}

// Create a new submission
export const useCreateSubmission = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateSubmissionData) => {
      if (!user) throw new Error('Not authenticated');

      const { data: result, error } = await supabase
        .from('place_submissions' as any)
        .insert({
          submitted_by: user.id,
          name: data.name,
          primary_category: data.primaryCategory,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address || null,
          description: data.description || null,
          features: data.features || [],
          rules_notes: data.rulesNotes || null,
          price_level: data.priceLevel || '$$',
          packages_accepted: data.packagesAccepted || 'No',
          open_year_round: data.openYearRound ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place-submissions'] });
    },
  });
};

// Approve a submission (admin)
export const useApproveSubmission = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (submissionId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Get the submission data
      const { data: submission, error: fetchError } = await supabase
        .from('place_submissions' as any)
        .select('*')
        .eq('id', submissionId)
        .single();

      if (fetchError) throw fetchError;

      const sub = submission as unknown as SubmissionRow;

      // Create the place
      const { data: newPlace, error: createError } = await supabase
        .from('places')
        .insert({
          name: sub.name,
          primary_category: sub.primary_category,
          latitude: sub.latitude,
          longitude: sub.longitude,
          features: sub.features,
          price_level: sub.price_level,
          packages_accepted: sub.packages_accepted,
          open_year_round: sub.open_year_round,
          is_verified: false,
          current_status: 'open_accessible',
        })
        .select()
        .single();

      if (createError) throw createError;

      // Update submission status
      const { error: updateError } = await supabase
        .from('place_submissions' as any)
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', submissionId);

      if (updateError) throw updateError;

      // Trigger county enrichment in background (non-blocking)
      if (newPlace?.id && sub.latitude && sub.longitude) {
        supabase.functions.invoke('enrich-county', {
          body: { action: 'enrich_single', placeId: newPlace.id },
        }).catch(err => console.error('County enrichment failed:', err));
      }

      return newPlace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['places'] });
    },
  });
};

// Reject a submission (admin)
export const useRejectSubmission = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ submissionId, reason }: { submissionId: string; reason: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('place_submissions' as any)
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          rejection_reason: reason,
        })
        .eq('id', submissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place-submissions'] });
    },
  });
};

// Check for nearby places
export const useCheckNearbyPlaces = () => {
  return useMutation({
    mutationFn: async ({ lat, lng, name }: { lat: number; lng: number; name: string }) => {
      const { data, error } = await supabase
        .rpc('check_nearby_places', { _lat: lat, _lng: lng, _name: name });

      if (error) throw error;
      return data as { id: string; name: string; distance_meters: number }[];
    },
  });
};
