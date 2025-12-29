import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PlaceCategory =
  | 'National Park'
  | 'State Park'
  | 'County / Regional Park'
  | 'RV Campground'
  | 'Luxury RV Resort'
  | 'Overnight Parking'
  | 'Boondocking'
  | 'Business Allowing Overnight'
  | 'Rest Area / Travel Plaza'
  | 'Fairgrounds / Event Grounds'
  | 'Dog Park'
  | 'RV Parking'
  | 'RV Storage';

export type PlaceFeature =
  | 'Dump Station'
  | 'Fresh Water'
  | 'Electric Hookups'
  | 'Sewer Hookups'
  | 'Showers'
  | 'Laundry'
  | 'Wi-Fi'
  | 'Pet Friendly'
  | 'Dog Friendly'
  | 'Big Rig Friendly'
  | 'Swimming Pool'
  | 'Hot Tub'
  | 'Heated Pool'
  | 'Heated Hot Tub';

export const PLACE_CATEGORIES: PlaceCategory[] = [
  'National Park',
  'State Park',
  'County / Regional Park',
  'RV Campground',
  'Luxury RV Resort',
  'Overnight Parking',
  'Boondocking',
  'Business Allowing Overnight',
  'Rest Area / Travel Plaza',
  'Fairgrounds / Event Grounds',
  'Dog Park',
  'RV Parking',
  'RV Storage',
];

export const PLACE_FEATURES: PlaceFeature[] = [
  'Dump Station',
  'Fresh Water',
  'Electric Hookups',
  'Sewer Hookups',
  'Showers',
  'Laundry',
  'Wi-Fi',
  'Pet Friendly',
  'Dog Friendly',
  'Big Rig Friendly',
  'Swimming Pool',
  'Hot Tub',
  'Heated Pool',
  'Heated Hot Tub',
];

export type PlaceStatus = 'open_accessible' | 'access_questionable' | 'temporarily_closed' | 'restrictions_reported';

export interface PlaceHours {
  [day: string]: { open: string; close: string; closed?: boolean };
}

export interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  priceLevel: '$' | '$$' | '$$$';
  packagesAccepted: 'Yes' | 'No' | 'Limited';
  packageFeeRequired: boolean;
  packageFeeAmount: string | null;
  isVerified: boolean;
  hasConflict: boolean;
  lastUpdated: Date;
  primaryCategory: PlaceCategory;
  features: PlaceFeature[];
  openYearRound: boolean;
  coverImageUrl: string | null;
  currentStatus: PlaceStatus;
  statusUpdatedAt: Date | null;
  // Hours fields
  is24_7: boolean;
  hoursJson: PlaceHours | null;
  // Contact & Info fields
  address: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  // Computed/derived fields
  distance: number;
  summary: string;
  isProRecommended: boolean;
}

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

// Generate a summary sentence based on place data
function generateSummary(place: PlaceRow): string {
  const parts: string[] = [];
  
  // Package info
  if (place.packages_accepted === 'Yes') {
    if (place.package_fee_required) {
      parts.push('Package fee');
    } else {
      parts.push('Free packages');
    }
  } else if (place.packages_accepted === 'Limited') {
    parts.push('Limited packages');
  } else {
    parts.push('No packages');
  }
  
  // Price context
  if (place.price_level === '$') {
    parts.push('Budget-friendly');
  } else if (place.price_level === '$$$') {
    parts.push('Premium');
  }
  
  // Year round
  if (!place.open_year_round) {
    parts.push('Seasonal');
  }
  
  return parts.slice(0, 3).join(' • ');
}

// Calculate distance from user (placeholder - uses fixed point for now)
function calculateDistance(lat: number, lng: number, userLat = 33.4484, userLng = -112.0740): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat - userLat) * Math.PI / 180;
  const dLng = (lng - userLng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(userLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
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

export function usePlaces() {
  return useQuery({
    queryKey: ['places'],
    queryFn: async (): Promise<Place[]> => {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .order('last_updated', { ascending: false });
      
      if (error) throw error;
      
      return (data as unknown as PlaceRow[]).map(transformPlace);
    },
  });
}

export function usePlace(id: string) {
  return useQuery({
    queryKey: ['place', id],
    queryFn: async (): Promise<Place | null> => {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      return transformPlace(data as unknown as PlaceRow);
    },
    enabled: !!id,
  });
}

export function formatLastUpdated(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}
