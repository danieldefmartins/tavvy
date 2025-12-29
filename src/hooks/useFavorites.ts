import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Place, PlaceCategory, PlaceFeature, PlaceStatus, PlaceHours } from './usePlaces';

interface PlaceRow {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  price_level: '$' | '$$' | '$$$';
  packages_accepted: 'Yes' | 'No' | 'Limited';
  package_fee_required: boolean;
  package_fee_amount: string | null;
  is_verified: boolean;
  has_conflict: boolean;
  last_updated: string;
  created_at: string;
  primary_category: PlaceCategory;
  features: PlaceFeature[];
  open_year_round: boolean;
  cover_image_url: string | null;
  current_status: PlaceStatus | null;
  status_updated_at: string | null;
  is_24_7: boolean | null;
  hours_json: PlaceHours | null;
  // Contact fields
  address: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
}

function calculateDistance(lat: number, lng: number, userLat = 33.4484, userLng = -112.0740): number {
  const R = 3959;
  const dLat = (lat - userLat) * Math.PI / 180;
  const dLng = (lng - userLng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(userLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function generateSummary(place: PlaceRow): string {
  const parts: string[] = [];
  if (place.packages_accepted === 'Yes') {
    parts.push(place.package_fee_required ? 'Package fee' : 'Free packages');
  } else if (place.packages_accepted === 'Limited') {
    parts.push('Limited packages');
  } else {
    parts.push('No packages');
  }
  if (place.price_level === '$') parts.push('Budget-friendly');
  else if (place.price_level === '$$$') parts.push('Premium');
  if (!place.open_year_round) parts.push('Seasonal');
  return parts.slice(0, 3).join(' • ');
}

function transformPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    priceLevel: row.price_level,
    packagesAccepted: row.packages_accepted,
    packageFeeRequired: row.package_fee_required,
    packageFeeAmount: row.package_fee_amount,
    isVerified: row.is_verified,
    hasConflict: row.has_conflict,
    lastUpdated: new Date(row.last_updated),
    primaryCategory: row.primary_category,
    features: row.features || [],
    openYearRound: row.open_year_round,
    coverImageUrl: row.cover_image_url,
    currentStatus: row.current_status || 'open_accessible',
    statusUpdatedAt: row.status_updated_at ? new Date(row.status_updated_at) : null,
    is24_7: row.is_24_7 ?? false,
    hoursJson: row.hours_json,
    // Contact & Info fields
    address: row.address,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    state: row.state,
    zipCode: row.zip_code || row.postal_code,
    country: row.country,
    phone: row.phone,
    email: row.email,
    website: row.website,
    facebookUrl: row.facebook_url,
    instagramUrl: row.instagram_url,
    distance: calculateDistance(row.latitude, row.longitude),
    summary: generateSummary(row),
    isProRecommended: row.is_verified && row.price_level !== '$',
  };
}

export function useFavorites() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async (): Promise<string[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('favorites')
        .select('place_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map((f) => f.place_id);
    },
    enabled: !!user,
  });
}

export function useSavedPlaces() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['saved-places', user?.id],
    queryFn: async (): Promise<Place[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('favorites')
        .select('place_id, places(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data
        .filter((f) => f.places)
        .map((f) => transformPlace(f.places as unknown as PlaceRow));
    },
    enabled: !!user,
  });
}

export function useIsFavorite(placeId: string) {
  const { data: favorites = [] } = useFavorites();
  return favorites.includes(placeId);
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ placeId, isFavorite }: { placeId: string; isFavorite: boolean }) => {
      if (!user) throw new Error('Must be logged in');

      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('place_id', placeId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, place_id: placeId });

        if (error) throw error;
      }
    },
    onMutate: async ({ placeId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: ['favorites', user?.id] });
      const previousFavorites = queryClient.getQueryData<string[]>(['favorites', user?.id]) || [];

      queryClient.setQueryData<string[]>(['favorites', user?.id], (old = []) => {
        if (isFavorite) {
          return old.filter((id) => id !== placeId);
        } else {
          return [...old, placeId];
        }
      });

      return { previousFavorites };
    },
    onError: (_, __, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites', user?.id], context.previousFavorites);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['saved-places', user?.id] });
    },
  });
}
