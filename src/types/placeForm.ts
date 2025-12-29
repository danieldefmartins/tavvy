// Types for the Add/Edit Place form wizard

export interface PlaceFormData {
  // Step 1: Basic Info
  name: string;
  primaryCategoryId: string;
  additionalCategoryIds: string[]; // Up to 4 additional categories
  customCategoryText: string; // For "Other" category - user-defined text
  secondaryTags: string[];
  shortSummary: string;
  
  // Step 2: Location
  latitude: number | null;
  longitude: number | null;
  entranceLatitude: number | null;
  entranceLongitude: number | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  county: string;
  country: string;
  noFormalAddress: boolean;
  pinAccuracy: 'exact' | 'approximate' | 'unknown';
  elevationFt: number | null;
  timezone: string;
  
  // Step 3: Contact & Hours
  phone: string;
  email: string;
  website: string;
  instagramUrl: string;
  facebookUrl: string;
  is24_7: boolean;
  hoursJson: Record<string, { open: string; close: string; closed?: boolean }> | null;
  seasonalOpenMonths: string[];
  seasonalNotes: string;
  
  // Step 4: Pricing
  priceLevel: 'Free' | '$' | '$$' | '$$$' | '$$$$';
  nightlyRateMin: number | null;
  nightlyRateMax: number | null;
  feesJson: {
    dumpFee?: number;
    waterFee?: number;
    petFee?: number;
    packageFee?: number;
    [key: string]: number | undefined;
  } | null;
  taxesIncluded: 'yes' | 'no' | 'unknown';
  paymentTypes: string[];
  
  // Step 5: RV Core & Hookups
  bigRigFriendly: 'yes' | 'no' | 'some' | 'unknown';
  maxRvLengthFt: number | null;
  maxHeightFt: number | null;
  roadType: 'paved' | 'gravel' | 'dirt' | 'sand' | 'mixed' | 'unknown';
  roadCondition: 'good' | 'ok' | 'rough' | 'muddy' | 'unknown';
  grade: 'flat' | 'moderate' | 'steep' | 'unknown';
  turnaroundAvailable: 'yes' | 'no' | 'unknown';
  towingFriendly: 'yes' | 'no' | 'unknown';
  electric: 'none' | '15a' | '30a' | '50a' | 'mix' | 'unknown';
  waterHookup: 'yes' | 'no' | 'some' | 'unknown';
  sewerHookup: 'yes' | 'no' | 'some' | 'unknown';
  fullHookups: 'yes' | 'no' | 'unknown';
  
  // Step 5 continued: Dump/Water
  dumpStation: 'yes' | 'no' | 'unknown';
  dumpFeeRequired: 'yes' | 'no' | 'unknown';
  dumpFeeAmount: number | null;
  freshWaterFill: 'yes' | 'no' | 'unknown';
  waterType: 'potable' | 'non_potable' | 'unknown';
  waterNotes: string;
  
  // Step 6: Amenities
  restrooms: 'yes' | 'no' | 'unknown';
  showers: 'yes' | 'no' | 'unknown';
  laundry: 'yes' | 'no' | 'unknown';
  wifi: 'yes' | 'no' | 'unknown';
  cellSignalNotes: string;
  trash: 'yes' | 'no' | 'unknown';
  recycling: 'yes' | 'no' | 'unknown';
  firePits: 'yes' | 'no' | 'unknown';
  picnicTables: 'yes' | 'no' | 'unknown';
  playground: 'yes' | 'no' | 'unknown';
  dogPark: 'yes' | 'no' | 'unknown';
  storeOnSite: 'yes' | 'no' | 'unknown';
  
  // Pool/Hot Tub
  swimmingPool: 'yes' | 'no' | 'unknown';
  hotTub: 'yes' | 'no' | 'unknown';
  poolOpenYearRound: 'yes' | 'no' | 'unknown';
  poolHeating: 'both_heated' | 'pool_only' | 'hot_tub_only' | 'not_heated' | 'unknown';
  
  // Step 7: Packages/Delivery
  packagesAccepted: 'Yes' | 'No' | 'Limited';
  packageFeeRequired: boolean;
  packageFeeAmount: string;
  deliveryNotes: string;
  
  // Step 8: Rules & Safety
  safetyLevel: 'safe' | 'use_caution' | 'avoid_at_night' | 'unknown';
  noiseLevel: 'quiet' | 'moderate' | 'loud' | 'unknown';
  generatorsAllowed: 'yes' | 'no' | 'restricted' | 'unknown';
  generatorHours: string;
  campfiresAllowed: 'yes' | 'no' | 'seasonal' | 'unknown';
  petsAllowed: 'yes' | 'no' | 'restricted' | 'unknown';
  rulesNotes: string;
  description: string;
  
  // Step 9: Photos (handled separately)
  photoIds: string[];
}

export const DEFAULT_PLACE_FORM_DATA: PlaceFormData = {
  name: '',
  primaryCategoryId: '',
  additionalCategoryIds: [],
  customCategoryText: '',
  secondaryTags: [],
  shortSummary: '',
  
  latitude: null,
  longitude: null,
  entranceLatitude: null,
  entranceLongitude: null,
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  county: '',
  country: 'USA',
  noFormalAddress: false,
  pinAccuracy: 'unknown',
  elevationFt: null,
  timezone: '',
  
  phone: '',
  email: '',
  website: '',
  instagramUrl: '',
  facebookUrl: '',
  is24_7: false,
  hoursJson: null,
  seasonalOpenMonths: [],
  seasonalNotes: '',
  
  priceLevel: '$$',
  nightlyRateMin: null,
  nightlyRateMax: null,
  feesJson: null,
  taxesIncluded: 'unknown',
  paymentTypes: [],
  
  bigRigFriendly: 'unknown',
  maxRvLengthFt: null,
  maxHeightFt: null,
  roadType: 'unknown',
  roadCondition: 'unknown',
  grade: 'unknown',
  turnaroundAvailable: 'unknown',
  towingFriendly: 'unknown',
  electric: 'unknown',
  waterHookup: 'unknown',
  sewerHookup: 'unknown',
  fullHookups: 'unknown',
  
  dumpStation: 'unknown',
  dumpFeeRequired: 'unknown',
  dumpFeeAmount: null,
  freshWaterFill: 'unknown',
  waterType: 'unknown',
  waterNotes: '',
  
  restrooms: 'unknown',
  showers: 'unknown',
  laundry: 'unknown',
  wifi: 'unknown',
  cellSignalNotes: '',
  trash: 'unknown',
  recycling: 'unknown',
  firePits: 'unknown',
  picnicTables: 'unknown',
  playground: 'unknown',
  dogPark: 'unknown',
  storeOnSite: 'unknown',
  
  swimmingPool: 'unknown',
  hotTub: 'unknown',
  poolOpenYearRound: 'unknown',
  poolHeating: 'unknown',
  
  packagesAccepted: 'No',
  packageFeeRequired: false,
  packageFeeAmount: '',
  deliveryNotes: '',
  
  safetyLevel: 'unknown',
  noiseLevel: 'unknown',
  generatorsAllowed: 'unknown',
  generatorHours: '',
  campfiresAllowed: 'unknown',
  petsAllowed: 'unknown',
  rulesNotes: '',
  description: '',
  
  photoIds: [],
};

export const WIZARD_STEPS = [
  { id: 1, label: 'Basic Info', shortLabel: 'Basic' },
  { id: 2, label: 'Location', shortLabel: 'Location' },
  { id: 3, label: 'Contact & Hours', shortLabel: 'Contact' },
  { id: 4, label: 'Pricing', shortLabel: 'Pricing' },
  { id: 5, label: 'RV & Hookups', shortLabel: 'RV' },
  { id: 6, label: 'Amenities', shortLabel: 'Amenities' },
  { id: 7, label: 'Packages', shortLabel: 'Packages' },
  { id: 8, label: 'Rules & Safety', shortLabel: 'Rules' },
  { id: 9, label: 'Photos', shortLabel: 'Photos' },
  { id: 10, label: 'Review', shortLabel: 'Review' },
];

// Categories that need RV-specific fields
export const RV_STAY_CATEGORIES = [
  'rv_park',
  'campground',
  'boondocking',
  'overnight_parking',
  'rest_area',
  'county_city_park',
  'state_park',
  'national_park',
  'fairgrounds',
  'military_camp',
];

// Categories that need dump/water fields
export const DUMP_WATER_CATEGORIES = [
  'dump_station',
  'water_fill',
  ...RV_STAY_CATEGORIES,
];
