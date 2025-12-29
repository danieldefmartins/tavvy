import type { Database } from "@/integrations/supabase/types";

export type PlaceCategory = Database["public"]["Enums"]["place_category"];
export type PriceLevel = Database["public"]["Enums"]["price_level"];

// MUVO fields that can be mapped
export interface MuvoFieldDefinition {
  key: string;
  label: string;
  required: boolean;
  group: 'basic' | 'location' | 'contact' | 'external' | 'entrance';
  entranceIndex?: number;
  entranceField?: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'category' | 'price';
}

export const MUVO_FIELDS: MuvoFieldDefinition[] = [
  // Basic Info (Required)
  { key: 'place_name', label: 'Place Name', required: true, group: 'basic', type: 'string' },
  { key: 'latitude', label: 'Latitude', required: true, group: 'basic', type: 'number' },
  { key: 'longitude', label: 'Longitude', required: true, group: 'basic', type: 'number' },
  
  // Basic Info (Optional)
  { key: 'primary_category', label: 'Primary Category', required: false, group: 'basic', type: 'category' },
  { key: 'additional_categories', label: 'Additional Categories', required: false, group: 'basic', type: 'array' },
  { key: 'secondary_tags', label: 'Secondary Tags', required: false, group: 'basic', type: 'array' },
  { key: 'price_tier', label: 'Price Tier', required: false, group: 'basic', type: 'price' },
  { key: 'short_description', label: 'Short Description', required: false, group: 'basic', type: 'string' },
  
  // Location
  { key: 'address_line1', label: 'Address Line 1', required: false, group: 'location', type: 'string' },
  { key: 'city', label: 'City', required: false, group: 'location', type: 'string' },
  { key: 'state', label: 'State', required: false, group: 'location', type: 'string' },
  { key: 'postal_code', label: 'Postal Code', required: false, group: 'location', type: 'string' },
  { key: 'country', label: 'Country', required: false, group: 'location', type: 'string' },
  
  // Contact
  { key: 'phone', label: 'Phone', required: false, group: 'contact', type: 'string' },
  { key: 'website_url', label: 'Website URL', required: false, group: 'contact', type: 'string' },
  { key: 'email', label: 'Email', required: false, group: 'contact', type: 'string' },
  { key: 'hours_text', label: 'Hours (Text)', required: false, group: 'contact', type: 'string' },
  
  // External References
  { key: 'google_place_id', label: 'Google Place ID', required: false, group: 'external', type: 'string' },
  { key: 'yelp_business_id', label: 'Yelp Business ID', required: false, group: 'external', type: 'string' },
  { key: 'external_source_name', label: 'External Source Name', required: false, group: 'external', type: 'string' },
  { key: 'external_source_url', label: 'External Source URL', required: false, group: 'external', type: 'string' },
  { key: 'external_rating_google', label: 'Google Rating', required: false, group: 'external', type: 'number' },
  { key: 'external_rating_yelp', label: 'Yelp Rating', required: false, group: 'external', type: 'number' },
  { key: 'featured_photo_url', label: 'Featured Photo URL', required: false, group: 'external', type: 'string' },
  { key: 'photo_urls', label: 'Photo URLs', required: false, group: 'external', type: 'array' },
];

// Generate entrance fields for entrances 1-5
export const ENTRANCE_FIELDS = ['name', 'lat', 'lng', 'road', 'notes', 'primary_flag'] as const;

for (let i = 1; i <= 5; i++) {
  MUVO_FIELDS.push(
    { key: `entrance${i}_name`, label: `Entrance ${i} Name`, required: false, group: 'entrance', entranceIndex: i, entranceField: 'name', type: 'string' },
    { key: `entrance${i}_lat`, label: `Entrance ${i} Latitude`, required: false, group: 'entrance', entranceIndex: i, entranceField: 'lat', type: 'number' },
    { key: `entrance${i}_lng`, label: `Entrance ${i} Longitude`, required: false, group: 'entrance', entranceIndex: i, entranceField: 'lng', type: 'number' },
    { key: `entrance${i}_road`, label: `Entrance ${i} Road`, required: false, group: 'entrance', entranceIndex: i, entranceField: 'road', type: 'string' },
    { key: `entrance${i}_notes`, label: `Entrance ${i} Notes`, required: false, group: 'entrance', entranceIndex: i, entranceField: 'notes', type: 'string' },
    { key: `entrance${i}_primary_flag`, label: `Entrance ${i} Primary`, required: false, group: 'entrance', entranceIndex: i, entranceField: 'primary_flag', type: 'boolean' },
  );
}

export interface ColumnMapping {
  [muvoFieldKey: string]: string | null; // maps MUVO field key to source column name
}

export interface MappingPreset {
  id: string;
  name: string;
  mapping: ColumnMapping;
  createdAt: string;
}

export interface ParsedRow {
  rowNumber: number;
  rawData: Record<string, string>;
  mappedData: Record<string, any>;
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
  duplicateOf?: string;
}

export interface ImportResults {
  importedCount: number;
  skippedDuplicates: number;
  errorRows: ParsedRow[];
}

export interface ImportWizardState {
  step: 1 | 2 | 3;
  fileName: string;
  fileType: 'csv' | 'xlsx';
  sourceColumns: string[];
  rawRows: Record<string, string>[];
  columnMapping: ColumnMapping;
  parsedRows: ParsedRow[];
  skipDuplicates: boolean;
  results: ImportResults | null;
}

// Valid categories list
export const VALID_CATEGORIES: PlaceCategory[] = [
  "National Park",
  "State Park",
  "County / Regional Park",
  "RV Campground",
  "Luxury RV Resort",
  "Overnight Parking",
  "Boondocking",
  "Business Allowing Overnight",
  "Rest Area / Travel Plaza",
  "Fairgrounds / Event Grounds"
];

export const VALID_PRICE_LEVELS: PriceLevel[] = ["$", "$$", "$$$"];

// Fuzzy matching aliases for auto-suggestion
export const COLUMN_ALIASES: Record<string, string[]> = {
  'place_name': ['name', 'place_name', 'placename', 'title', 'location_name', 'business_name', 'poi_name'],
  'latitude': ['latitude', 'lat', 'y', 'coord_lat', 'geo_lat'],
  'longitude': ['longitude', 'lng', 'lon', 'long', 'x', 'coord_lon', 'geo_lon', 'geo_lng'],
  'primary_category': ['category', 'primary_category', 'type', 'place_type', 'poi_type'],
  'price_tier': ['price', 'price_tier', 'price_level', 'cost', 'pricing'],
  'short_description': ['description', 'short_description', 'summary', 'about', 'info'],
  'address_line1': ['address', 'address_line1', 'street', 'street_address', 'addr'],
  'city': ['city', 'town', 'municipality', 'locality'],
  'state': ['state', 'province', 'region', 'state_code'],
  'postal_code': ['postal_code', 'zip', 'zip_code', 'zipcode', 'postcode'],
  'country': ['country', 'country_code', 'nation'],
  'phone': ['phone', 'telephone', 'phone_number', 'tel'],
  'website_url': ['website', 'website_url', 'url', 'web', 'site'],
  'email': ['email', 'email_address', 'contact_email'],
  'google_place_id': ['google_place_id', 'place_id', 'google_id'],
  'entrance1_name': ['entrance_1_name', 'entrance1_name', 'main_entrance'],
  'entrance1_lat': ['entrance_1_latitude', 'entrance1_lat', 'entrance_1_lat'],
  'entrance1_lng': ['entrance_1_longitude', 'entrance1_lng', 'entrance_1_lng', 'entrance_1_lon'],
};
