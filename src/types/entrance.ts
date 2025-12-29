// Types for entrance management

export interface EntranceData {
  name: string;
  latitude: number;
  longitude: number;
  road?: string;
  notes?: string;
  isPrimary?: boolean;
  // RV-specific fields
  maxRvLengthFt?: number | null;
  maxRvHeightFt?: number | null;
  roadType?: 'paved' | 'gravel' | 'dirt' | null;
  grade?: 'flat' | 'moderate' | 'steep' | null;
  tightTurns?: boolean | null;
  lowClearance?: boolean | null;
  seasonalAccess?: 'year_round' | 'seasonal' | null;
  seasonalNotes?: string;
}

export interface EntranceFormData {
  name: string;
  latitude: number | null;
  longitude: number | null;
  road: string;
  notes: string;
  isPrimary: boolean;
  maxRvLengthFt: number | null;
  maxRvHeightFt: number | null;
  roadType: 'paved' | 'gravel' | 'dirt' | '';
  grade: 'flat' | 'moderate' | 'steep' | '';
  tightTurns: boolean | null;
  lowClearance: boolean | null;
  seasonalAccess: 'year_round' | 'seasonal' | '';
  seasonalNotes: string;
}

export const DEFAULT_ENTRANCE_FORM: EntranceFormData = {
  name: '',
  latitude: null,
  longitude: null,
  road: '',
  notes: '',
  isPrimary: false,
  maxRvLengthFt: null,
  maxRvHeightFt: null,
  roadType: '',
  grade: '',
  tightTurns: null,
  lowClearance: null,
  seasonalAccess: '',
  seasonalNotes: '',
};

export const ROAD_TYPE_OPTIONS = [
  { value: 'paved', label: 'Paved' },
  { value: 'gravel', label: 'Gravel' },
  { value: 'dirt', label: 'Dirt' },
];

export const GRADE_OPTIONS = [
  { value: 'flat', label: 'Flat' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'steep', label: 'Steep' },
];

export const SEASONAL_ACCESS_OPTIONS = [
  { value: 'year_round', label: 'Year-round' },
  { value: 'seasonal', label: 'Seasonal' },
];
