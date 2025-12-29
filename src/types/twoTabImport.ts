// Types for two-tab bulk import (Places + Entrances)

import type { Database } from "@/integrations/supabase/types";

export type PlaceCategory = Database["public"]["Enums"]["place_category"];
export type PriceLevel = Database["public"]["Enums"]["price_level"];
export type ExternalSource = Database["public"]["Enums"]["external_source"];

// ========== PLACES TAB FIELDS ==========
export interface PlaceFieldDefinition {
  key: string;
  label: string; // Column name in template
  displayName: string; // Human-readable name for UI
  required: boolean;
  group: 'identifier' | 'basic' | 'location' | 'contact' | 'metadata';
  type: 'string' | 'number' | 'boolean' | 'array' | 'category' | 'price' | 'source';
}

export const PLACES_FIELDS: PlaceFieldDefinition[] = [
  // Identifier (required for upsert)
  { key: 'place_external_id', label: 'place_external_id', displayName: 'Place External ID', required: true, group: 'identifier', type: 'string' },
  
  // Basic Info (required)
  { key: 'name', label: 'place_name', displayName: 'Place Name', required: true, group: 'basic', type: 'string' },
  { key: 'primary_category', label: 'primary_category', displayName: 'Primary Category', required: true, group: 'basic', type: 'category' },
  { key: 'latitude', label: 'latitude', displayName: 'Latitude', required: true, group: 'basic', type: 'number' },
  { key: 'longitude', label: 'longitude', displayName: 'Longitude', required: true, group: 'basic', type: 'number' },
  { key: 'country', label: 'country', displayName: 'Country', required: true, group: 'location', type: 'string' },
  
  // Recommended optional
  { key: 'address', label: 'formatted_address', displayName: 'Formatted Address', required: false, group: 'location', type: 'string' },
  { key: 'city', label: 'city', displayName: 'City', required: false, group: 'location', type: 'string' },
  { key: 'state', label: 'state_province', displayName: 'State/Province', required: false, group: 'location', type: 'string' },
  { key: 'postal_code', label: 'postal_code', displayName: 'Postal Code', required: false, group: 'location', type: 'string' },
  { key: 'county', label: 'county', displayName: 'County', required: false, group: 'location', type: 'string' },
  
  // Contact
  { key: 'phone', label: 'phone', displayName: 'Phone', required: false, group: 'contact', type: 'string' },
  { key: 'website', label: 'website', displayName: 'Website', required: false, group: 'contact', type: 'string' },
  { key: 'hours_json', label: 'hours_text', displayName: 'Hours Text', required: false, group: 'contact', type: 'string' },
  
  // Metadata
  { key: 'is_verified', label: 'is_verified', displayName: 'Is Verified', required: false, group: 'metadata', type: 'boolean' },
  { key: 'import_source', label: 'source_platform', displayName: 'Source Platform', required: false, group: 'metadata', type: 'source' },
  { key: 'google_place_id', label: 'google_place_id', displayName: 'Google Place ID', required: false, group: 'metadata', type: 'string' },
  { key: 'yelp_business_id', label: 'yelp_business_id', displayName: 'Yelp Business ID', required: false, group: 'metadata', type: 'string' },
];

// ========== ENTRANCES TAB FIELDS ==========
export interface EntranceFieldDefinition {
  key: string;
  label: string; // Column name in template
  displayName: string; // Human-readable name for UI
  required: boolean;
  group: 'identifier' | 'basic' | 'rv_info';
  type: 'string' | 'number' | 'boolean' | 'enum';
  enumValues?: string[];
}

export const ENTRANCES_FIELDS: EntranceFieldDefinition[] = [
  // Identifiers (required)
  { key: 'place_external_id', label: 'place_external_id', displayName: 'Place External ID', required: true, group: 'identifier', type: 'string' },
  { key: 'entrance_external_id', label: 'entrance_external_id', displayName: 'Entrance External ID', required: true, group: 'identifier', type: 'string' },
  
  // Basic (required)
  { key: 'entrance_name', label: 'entrance_name', displayName: 'Entrance Name', required: true, group: 'basic', type: 'string' },
  { key: 'latitude', label: 'latitude', displayName: 'Latitude', required: true, group: 'basic', type: 'number' },
  { key: 'longitude', label: 'longitude', displayName: 'Longitude', required: true, group: 'basic', type: 'number' },
  
  // Optional RV Info
  { key: 'max_rv_length_ft', label: 'max_rv_length_ft', displayName: 'Max RV Length (ft)', required: false, group: 'rv_info', type: 'number' },
  { key: 'max_rv_height_ft', label: 'max_rv_height_ft', displayName: 'Max RV Height (ft)', required: false, group: 'rv_info', type: 'number' },
  { key: 'road_type', label: 'road_type', displayName: 'Road Type', required: false, group: 'rv_info', type: 'enum', enumValues: ['paved', 'gravel', 'dirt'] },
  { key: 'grade', label: 'grade', displayName: 'Grade', required: false, group: 'rv_info', type: 'enum', enumValues: ['flat', 'moderate', 'steep'] },
  { key: 'tight_turns', label: 'tight_turns', displayName: 'Tight Turns', required: false, group: 'rv_info', type: 'boolean' },
  { key: 'low_clearance_warning', label: 'low_clearance_warning', displayName: 'Low Clearance Warning', required: false, group: 'rv_info', type: 'boolean' },
  { key: 'seasonal_access', label: 'seasonal_access', displayName: 'Seasonal Access', required: false, group: 'rv_info', type: 'enum', enumValues: ['year_round', 'seasonal'] },
  { key: 'seasonal_notes', label: 'seasonal_notes', displayName: 'Seasonal Notes', required: false, group: 'rv_info', type: 'string' },
  { key: 'entrance_notes', label: 'entrance_notes', displayName: 'Entrance Notes', required: false, group: 'rv_info', type: 'string' },
];

// Column aliases for auto-mapping
export const PLACES_COLUMN_ALIASES: Record<string, string[]> = {
  'place_external_id': ['place_external_id', 'external_id', 'place_id', 'id', 'unique_id'],
  'name': ['name', 'place_name', 'title', 'location_name'],
  'primary_category': ['category', 'primary_category', 'type'],
  'latitude': ['latitude', 'lat', 'y'],
  'longitude': ['longitude', 'lng', 'lon', 'long', 'x'],
  'country': ['country'],
  'address': ['formatted_address', 'address', 'address_line1', 'street'],
  'city': ['city', 'town'],
  'state': ['state', 'state_province', 'province'],
  'postal_code': ['postal_code', 'zip', 'zipcode'],
  'county': ['county'],
  'phone': ['phone', 'telephone'],
  'website': ['website', 'url'],
  'hours_json': ['hours_text', 'hours', 'hours_of_operation'],
  'is_verified': ['is_verified', 'verified'],
  'import_source': ['source_platform', 'source', 'platform'],
  'google_place_id': ['google_place_id', 'google_id'],
  'yelp_business_id': ['yelp_business_id', 'yelp_id'],
};

export const ENTRANCES_COLUMN_ALIASES: Record<string, string[]> = {
  'place_external_id': ['place_external_id', 'place_id', 'parent_id'],
  'entrance_external_id': ['entrance_external_id', 'entrance_id', 'id'],
  'entrance_name': ['entrance_name', 'name', 'gate_name'],
  'latitude': ['latitude', 'lat', 'entrance_lat'],
  'longitude': ['longitude', 'lng', 'lon', 'entrance_lng'],
  'max_rv_length_ft': ['max_rv_length_ft', 'max_rv_length', 'max_length', 'rv_length'],
  'max_rv_height_ft': ['max_rv_height_ft', 'max_rv_height', 'max_height', 'rv_height'],
  'road_type': ['road_type', 'road', 'surface'],
  'grade': ['grade', 'steepness', 'slope'],
  'tight_turns': ['tight_turns', 'sharp_turns'],
  'low_clearance_warning': ['low_clearance_warning', 'low_clearance', 'clearance_warning'],
  'seasonal_access': ['seasonal_access', 'access'],
  'seasonal_notes': ['seasonal_notes'],
  'entrance_notes': ['entrance_notes', 'notes', 'description'],
};

// Valid source platforms
export const VALID_SOURCE_PLATFORMS: ExternalSource[] = [
  'google_maps',
  'yelp',
  'ioverlander',
  'campendium',
  'freecampsites',
  'csv_import',
  'user_submission',
  'admin_entry',
  'other',
];

// Valid categories
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

// Parsed row for import
export interface ParsedPlaceRow {
  rowNumber: number;
  rawData: Record<string, string>;
  mappedData: Record<string, any>;
  isValid: boolean;
  errors: string[];
  isUpdate: boolean; // true if place_external_id already exists
}

export interface ParsedEntranceRow {
  rowNumber: number;
  rawData: Record<string, string>;
  mappedData: Record<string, any>;
  isValid: boolean;
  errors: string[];
  placeId?: string; // resolved place UUID
  isUpdate: boolean; // true if entrance_external_id already exists
}

export interface TwoTabImportResults {
  placesCreated: number;
  placesUpdated: number;
  placesErrored: number;
  entrancesCreated: number;
  entrancesUpdated: number;
  entrancesErrored: number;
  placeErrors: ParsedPlaceRow[];
  entranceErrors: ParsedEntranceRow[];
}

export interface TwoTabImportState {
  step: 'upload' | 'map_places' | 'map_entrances' | 'validate' | 'results';
  
  // Places sheet
  placesFileName: string;
  placesColumns: string[];
  placesRawRows: Record<string, string>[];
  placesMapping: Record<string, string | null>;
  placesParsed: ParsedPlaceRow[];
  
  // Entrances sheet
  entrancesFileName: string;
  entrancesColumns: string[];
  entrancesRawRows: Record<string, string>[];
  entrancesMapping: Record<string, string | null>;
  entrancesParsed: ParsedEntranceRow[];
  
  // Results
  results: TwoTabImportResults | null;
}

export const DEFAULT_TWO_TAB_STATE: TwoTabImportState = {
  step: 'upload',
  placesFileName: '',
  placesColumns: [],
  placesRawRows: [],
  placesMapping: {},
  placesParsed: [],
  entrancesFileName: '',
  entrancesColumns: [],
  entrancesRawRows: [],
  entrancesMapping: {},
  entrancesParsed: [],
  results: null,
};
