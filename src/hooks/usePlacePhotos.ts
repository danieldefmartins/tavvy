import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type PhotoCategory = 
  | 'entrance' 
  | 'site_parking' 
  | 'hookups' 
  | 'dump_water' 
  | 'bathrooms_showers' 
  | 'surroundings' 
  | 'rules_signs';

export interface PlacePhoto {
  id: string;
  placeId: string;
  userId: string;
  url: string;
  category: PhotoCategory;
  createdAt: Date;
  isApproved: boolean;
  flagged: boolean;
  profile?: {
    displayName: string | null;
    trustedContributor: boolean;
  };
}

interface PhotoRow {
  id: string;
  place_id: string;
  user_id: string;
  url: string;
  category: string;
  created_at: string;
  is_approved: boolean;
  flagged: boolean;
  profiles?: {
    display_name: string | null;
    trusted_contributor: boolean;
  };
}

function transformPhoto(row: PhotoRow): PlacePhoto {
  return {
    id: row.id,
    placeId: row.place_id,
    userId: row.user_id,
    url: row.url,
    category: row.category as PhotoCategory,
    createdAt: new Date(row.created_at),
    isApproved: row.is_approved,
    flagged: row.flagged,
    profile: row.profiles ? {
      displayName: row.profiles.display_name,
      trustedContributor: row.profiles.trusted_contributor,
    } : undefined,
  };
}

export const PHOTO_CATEGORIES: { value: PhotoCategory; label: string }[] = [
  { value: 'entrance', label: 'Entrance' },
  { value: 'site_parking', label: 'Site/Parking' },
  { value: 'hookups', label: 'Hookups' },
  { value: 'dump_water', label: 'Dump/Water' },
  { value: 'bathrooms_showers', label: 'Bathrooms/Showers' },
  { value: 'surroundings', label: 'Surroundings' },
  { value: 'rules_signs', label: 'Rules/Signs' },
];

// Fetch photos for a place
export function usePlacePhotos(placeId: string) {
  return useQuery({
    queryKey: ['place-photos', placeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_photos')
        .select(`
          *,
          profiles!place_photos_user_id_fkey (
            display_name,
            trusted_contributor
          )
        `)
        .eq('place_id', placeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as PhotoRow[]).map(transformPhoto);
    },
    enabled: !!placeId,
  });
}

// Upload a photo
export function useUploadPhoto() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      placeId, 
      file, 
      category,
      onProgress,
    }: { 
      placeId: string; 
      file: File; 
      category: PhotoCategory;
      onProgress?: (progress: number) => void;
    }) => {
      if (!user) throw new Error('Must be logged in');

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${placeId}/${Date.now()}.${fileExt}`;

      // Upload to storage
      onProgress?.(10);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('place-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;
      onProgress?.(60);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('place-photos')
        .getPublicUrl(uploadData.path);

      onProgress?.(80);

      // Create photo record
      const { data, error } = await supabase
        .from('place_photos')
        .insert({
          place_id: placeId,
          user_id: user.id,
          url: publicUrl,
          category,
        })
        .select()
        .single();

      if (error) throw error;
      onProgress?.(100);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['place-photos', variables.placeId] });
    },
  });
}

// Delete a photo
export function useDeletePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, placeId, url }: { photoId: string; placeId: string; url: string }) => {
      // Extract file path from URL
      const urlParts = url.split('/place-photos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        // Try to delete from storage (may fail if already deleted)
        await supabase.storage.from('place-photos').remove([filePath]).catch(() => {});
      }

      // Delete record
      const { error } = await supabase
        .from('place_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;
      return { placeId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['place-photos', data.placeId] });
      queryClient.invalidateQueries({ queryKey: ['flagged-photos'] });
    },
  });
}

// Flag a photo
export function useFlagPhoto() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ photoId, placeId, reason }: { photoId: string; placeId: string; reason?: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('place_photos')
        .update({
          flagged: true,
          flagged_by: user.id,
          flagged_at: new Date().toISOString(),
          flag_reason: reason || null,
        })
        .eq('id', photoId);

      if (error) throw error;
      return { placeId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['place-photos', data.placeId] });
    },
  });
}

// Fetch flagged photos (admin)
export function useFlaggedPhotos() {
  return useQuery({
    queryKey: ['flagged-photos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_photos')
        .select(`
          *,
          profiles!place_photos_user_id_fkey (
            display_name
          ),
          places!place_photos_place_id_fkey (
            name
          )
        `)
        .eq('flagged', true)
        .order('flagged_at', { ascending: false });

      if (error) throw error;
      return data.map((row: any) => ({
        ...transformPhoto(row),
        placeName: row.places?.name,
        flagReason: row.flag_reason,
      }));
    },
  });
}

// Unflag a photo (admin)
export function useUnflagPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId }: { photoId: string }) => {
      const { error } = await supabase
        .from('place_photos')
        .update({
          flagged: false,
          flagged_by: null,
          flagged_at: null,
          flag_reason: null,
        })
        .eq('id', photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flagged-photos'] });
      queryClient.invalidateQueries({ queryKey: ['place-photos'] });
    },
  });
}
