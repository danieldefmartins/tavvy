import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  TwoTabImportState,
  DEFAULT_TWO_TAB_STATE,
  ParsedPlaceRow,
  ParsedEntranceRow,
  TwoTabImportResults,
  PLACES_FIELDS,
  ENTRANCES_FIELDS,
  PLACES_COLUMN_ALIASES,
  ENTRANCES_COLUMN_ALIASES,
  VALID_CATEGORIES,
  VALID_SOURCE_PLATFORMS,
} from '@/types/twoTabImport';
import { supabase } from '@/integrations/supabase/client';

// Generate template XLSX with both sheets
export function generateTemplateXLSX() {
  const wb = XLSX.utils.book_new();
  
  // Places sheet with headers
  const placesHeaders = PLACES_FIELDS.map(f => f.label);
  const placesSheet = XLSX.utils.aoa_to_sheet([placesHeaders]);
  XLSX.utils.book_append_sheet(wb, placesSheet, 'Places');
  
  // Entrances sheet with headers
  const entrancesHeaders = ENTRANCES_FIELDS.map(f => f.label);
  const entrancesSheet = XLSX.utils.aoa_to_sheet([entrancesHeaders]);
  XLSX.utils.book_append_sheet(wb, entrancesSheet, 'Entrances');
  
  // Generate and download
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'muvo_bulk_import_template.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

// Generate CSV for a single tab
export function generatePlacesCSV() {
  const headers = PLACES_FIELDS.map(f => f.label);
  const csvContent = headers.join(',') + '\n';
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'muvo_places_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function generateEntrancesCSV() {
  const headers = ENTRANCES_FIELDS.map(f => f.label);
  const csvContent = headers.join(',') + '\n';
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'muvo_entrances_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function useTwoTabImport() {
  const [state, setState] = useState<TwoTabImportState>(DEFAULT_TWO_TAB_STATE);
  const [isProcessing, setIsProcessing] = useState(false);

  // Parse XLSX file with two sheets
  const parseWorkbook = useCallback(async (file: File): Promise<{
    placesSheet: { columns: string[]; rows: Record<string, string>[] };
    entrancesSheet: { columns: string[]; rows: Record<string, string>[] };
  }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Find Places and Entrances sheets (case-insensitive)
          const sheetNames = workbook.SheetNames;
          const placesSheetName = sheetNames.find(n => n.toLowerCase().includes('place')) || sheetNames[0];
          const entrancesSheetName = sheetNames.find(n => n.toLowerCase().includes('entrance')) || sheetNames[1];

          const parseSheet = (sheetName: string) => {
            const sheet = workbook.Sheets[sheetName];
            if (!sheet) return { columns: [], rows: [] };
            
            const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { header: 1 });
            if (jsonData.length < 1) return { columns: [], rows: [] };

            const headers = (jsonData[0] as any[]).map(h => String(h || '').trim());
            const rows = jsonData.slice(1).map(row => {
              const rowObj: Record<string, string> = {};
              headers.forEach((header, idx) => {
                rowObj[header] = String((row as any[])[idx] ?? '').trim();
              });
              return rowObj;
            }).filter(row => Object.values(row).some(v => v !== ''));

            return { columns: headers.filter(h => h), rows };
          };

          resolve({
            placesSheet: parseSheet(placesSheetName),
            entrancesSheet: entrancesSheetName ? parseSheet(entrancesSheetName) : { columns: [], rows: [] },
          });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }, []);

  // Auto-suggest column mappings
  const autoMapColumns = useCallback((
    sourceColumns: string[],
    aliases: Record<string, string[]>
  ): Record<string, string | null> => {
    const mapping: Record<string, string | null> = {};
    
    Object.entries(aliases).forEach(([fieldKey, fieldAliases]) => {
      const matchedColumn = sourceColumns.find(col =>
        fieldAliases.some(alias => 
          col.toLowerCase().replace(/[_\s-]/g, '') === alias.toLowerCase().replace(/[_\s-]/g, '')
        )
      );
      mapping[fieldKey] = matchedColumn || null;
    });
    
    return mapping;
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const { placesSheet, entrancesSheet } = await parseWorkbook(file);
      
      const placesMapping = autoMapColumns(placesSheet.columns, PLACES_COLUMN_ALIASES);
      const entrancesMapping = autoMapColumns(entrancesSheet.columns, ENTRANCES_COLUMN_ALIASES);

      setState(prev => ({
        ...prev,
        step: 'map_places',
        placesFileName: file.name,
        placesColumns: placesSheet.columns,
        placesRawRows: placesSheet.rows,
        placesMapping,
        entrancesFileName: file.name,
        entrancesColumns: entrancesSheet.columns,
        entrancesRawRows: entrancesSheet.rows,
        entrancesMapping,
      }));
    } finally {
      setIsProcessing(false);
    }
  }, [parseWorkbook, autoMapColumns]);

  // Update places mapping
  const updatePlacesMapping = useCallback((field: string, column: string | null) => {
    setState(prev => ({
      ...prev,
      placesMapping: { ...prev.placesMapping, [field]: column },
    }));
  }, []);

  // Update entrances mapping
  const updateEntrancesMapping = useCallback((field: string, column: string | null) => {
    setState(prev => ({
      ...prev,
      entrancesMapping: { ...prev.entrancesMapping, [field]: column },
    }));
  }, []);

  // Transform value based on type
  const transformValue = useCallback((value: string, type: string, enumValues?: string[]): any => {
    if (!value || value.trim() === '') return null;

    switch (type) {
      case 'number':
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      case 'boolean':
        const lower = value.toLowerCase();
        if (['true', 'yes', '1', 'y'].includes(lower)) return true;
        if (['false', 'no', '0', 'n'].includes(lower)) return false;
        return null;
      case 'category':
        return VALID_CATEGORIES.find(c => c.toLowerCase() === value.toLowerCase()) || 'RV Campground';
      case 'source':
        const normalizedSource = value.toLowerCase().replace(/\s+/g, '_');
        const matchedSource = VALID_SOURCE_PLATFORMS.find(s => s === normalizedSource);
        return matchedSource || 'csv_import';
      case 'enum':
        if (enumValues?.includes(value.toLowerCase())) return value.toLowerCase();
        return null;
      default:
        return value.trim();
    }
  }, []);

  // Process and validate places
  const processPlaces = useCallback(async () => {
    const { placesRawRows, placesMapping } = state;
    
    // Get existing places by external_id for update detection
    const { data: existingPlaces } = await supabase
      .from('places')
      .select('id, place_external_id')
      .not('place_external_id', 'is', null);

    const existingMap = new Map(existingPlaces?.map(p => [p.place_external_id, p.id]) || []);

    const parsedRows: ParsedPlaceRow[] = placesRawRows.map((rawRow, idx) => {
      const mappedData: Record<string, any> = {};
      const errors: string[] = [];

      PLACES_FIELDS.forEach(field => {
        const sourceColumn = placesMapping[field.key];
        if (sourceColumn && rawRow[sourceColumn] !== undefined) {
          mappedData[field.key] = transformValue(rawRow[sourceColumn], field.type);
        }
      });

      // Validate required fields
      if (!mappedData.place_external_id) errors.push('Missing place_external_id');
      if (!mappedData.name) errors.push('Missing place_name');
      if (!mappedData.primary_category) errors.push('Missing primary_category');
      if (!mappedData.country) errors.push('Missing country');
      
      const lat = mappedData.latitude;
      const lng = mappedData.longitude;
      if (lat === null || lat === undefined || isNaN(lat) || lat < -90 || lat > 90) {
        errors.push('Invalid latitude');
      }
      if (lng === null || lng === undefined || isNaN(lng) || lng < -180 || lng > 180) {
        errors.push('Invalid longitude');
      }

      const isUpdate = existingMap.has(mappedData.place_external_id);

      return {
        rowNumber: idx + 2,
        rawData: rawRow,
        mappedData,
        isValid: errors.length === 0,
        errors,
        isUpdate,
      };
    });

    return parsedRows;
  }, [state, transformValue]);

  // Process and validate entrances
  const processEntrances = useCallback(async (placeExternalIdMap: Map<string, string>) => {
    const { entrancesRawRows, entrancesMapping } = state;
    
    // Get existing entrances for update detection
    const { data: existingEntrances } = await supabase
      .from('entrances')
      .select('id, entrance_external_id')
      .not('entrance_external_id', 'is', null);

    const existingMap = new Map(existingEntrances?.map(e => [e.entrance_external_id, e.id]) || []);

    const parsedRows: ParsedEntranceRow[] = entrancesRawRows.map((rawRow, idx) => {
      const mappedData: Record<string, any> = {};
      const errors: string[] = [];

      ENTRANCES_FIELDS.forEach(field => {
        const sourceColumn = entrancesMapping[field.key];
        if (sourceColumn && rawRow[sourceColumn] !== undefined) {
          mappedData[field.key] = transformValue(
            rawRow[sourceColumn], 
            field.type, 
            'enumValues' in field ? field.enumValues : undefined
          );
        }
      });

      // Validate required fields
      if (!mappedData.place_external_id) errors.push('Missing place_external_id');
      if (!mappedData.entrance_external_id) errors.push('Missing entrance_external_id');
      if (!mappedData.entrance_name) errors.push('Missing entrance_name');
      
      const lat = mappedData.latitude;
      const lng = mappedData.longitude;
      if (lat === null || lat === undefined || isNaN(lat) || lat < -90 || lat > 90) {
        errors.push('Invalid latitude');
      }
      if (lng === null || lng === undefined || isNaN(lng) || lng < -180 || lng > 180) {
        errors.push('Invalid longitude');
      }

      // Check if parent place exists
      const placeId = placeExternalIdMap.get(mappedData.place_external_id);
      if (!placeId) {
        errors.push(`Place with external_id "${mappedData.place_external_id}" not found`);
      }

      const isUpdate = existingMap.has(mappedData.entrance_external_id);

      return {
        rowNumber: idx + 2,
        rawData: rawRow,
        mappedData,
        isValid: errors.length === 0,
        errors,
        placeId,
        isUpdate,
      };
    });

    return parsedRows;
  }, [state, transformValue]);

  // Process all data for validation step
  const validateAll = useCallback(async () => {
    setIsProcessing(true);
    try {
      // Process places first
      const placesParsed = await processPlaces();
      
      // Build map of place_external_id -> place_id (including existing and new)
      const { data: existingPlaces } = await supabase
        .from('places')
        .select('id, place_external_id')
        .not('place_external_id', 'is', null);

      const placeExternalIdMap = new Map<string, string>();
      existingPlaces?.forEach(p => {
        if (p.place_external_id) placeExternalIdMap.set(p.place_external_id, p.id);
      });
      
      // Add valid new places (they'll get IDs after import)
      placesParsed.filter(p => p.isValid && !p.isUpdate).forEach(p => {
        placeExternalIdMap.set(p.mappedData.place_external_id, 'pending');
      });

      // Process entrances
      const entrancesParsed = await processEntrances(placeExternalIdMap);

      setState(prev => ({
        ...prev,
        step: 'validate',
        placesParsed,
        entrancesParsed,
      }));
    } finally {
      setIsProcessing(false);
    }
  }, [processPlaces, processEntrances]);

  // Execute the import
  const executeImport = useCallback(async (): Promise<TwoTabImportResults> => {
    setIsProcessing(true);
    try {
      const { placesParsed, entrancesParsed } = state;
      const results: TwoTabImportResults = {
        placesCreated: 0,
        placesUpdated: 0,
        placesErrored: 0,
        entrancesCreated: 0,
        entrancesUpdated: 0,
        entrancesErrored: 0,
        placeErrors: [],
        entranceErrors: [],
      };

      // Import places first
      const validPlaces = placesParsed.filter(p => p.isValid);
      const placesToCreate = validPlaces.filter(p => !p.isUpdate);
      const placesToUpdate = validPlaces.filter(p => p.isUpdate);

      // Create new places
      for (const place of placesToCreate) {
        const d = place.mappedData;
        const insertData = {
          place_external_id: d.place_external_id,
          name: d.name,
          latitude: d.latitude,
          longitude: d.longitude,
          primary_category: d.primary_category || 'RV Campground',
          address: d.address || null,
          city: d.city || null,
          state: d.state || null,
          postal_code: d.postal_code || null,
          county: d.county || null,
          country: d.country || 'USA',
          phone: d.phone || null,
          website: d.website || null,
          hours_json: d.hours_json ? { text: d.hours_json } : null,
          is_verified: d.is_verified || false,
          import_source: d.import_source || 'csv_import',
        };

        const { error } = await supabase.from('places').insert(insertData as any);
        if (error) {
          place.errors.push(error.message);
          results.placeErrors.push(place);
          results.placesErrored++;
        } else {
          results.placesCreated++;
        }
      }

      // Update existing places
      for (const place of placesToUpdate) {
        const d = place.mappedData;
        const updateData: Record<string, any> = {};
        
        // Only update non-null fields
        if (d.name) updateData.name = d.name;
        if (d.latitude != null) updateData.latitude = d.latitude;
        if (d.longitude != null) updateData.longitude = d.longitude;
        if (d.primary_category) updateData.primary_category = d.primary_category;
        if (d.address) updateData.address = d.address;
        if (d.city) updateData.city = d.city;
        if (d.state) updateData.state = d.state;
        if (d.postal_code) updateData.postal_code = d.postal_code;
        if (d.county) updateData.county = d.county;
        if (d.country) updateData.country = d.country;
        if (d.phone) updateData.phone = d.phone;
        if (d.website) updateData.website = d.website;
        if (d.hours_json) updateData.hours_json = { text: d.hours_json };
        if (d.is_verified !== null) updateData.is_verified = d.is_verified;
        if (d.import_source) updateData.import_source = d.import_source;

        const { error } = await supabase
          .from('places')
          .update(updateData)
          .eq('place_external_id', d.place_external_id);

        if (error) {
          place.errors.push(error.message);
          results.placeErrors.push(place);
          results.placesErrored++;
        } else {
          results.placesUpdated++;
        }
      }

      // Refresh place ID map after inserts
      const { data: allPlaces } = await supabase
        .from('places')
        .select('id, place_external_id')
        .not('place_external_id', 'is', null);

      const placeIdMap = new Map<string, string>();
      allPlaces?.forEach(p => {
        if (p.place_external_id) placeIdMap.set(p.place_external_id, p.id);
      });

      // Import entrances
      const validEntrances = entrancesParsed.filter(e => e.isValid);
      
      for (const entrance of validEntrances) {
        const d = entrance.mappedData;
        const placeId = placeIdMap.get(d.place_external_id);
        
        if (!placeId) {
          entrance.errors.push(`Place "${d.place_external_id}" not found after import`);
          results.entranceErrors.push(entrance);
          results.entrancesErrored++;
          continue;
        }

        const entranceData = {
          place_id: placeId,
          entrance_external_id: d.entrance_external_id,
          entrance_name: d.entrance_name,
          latitude: d.latitude,
          longitude: d.longitude,
          is_primary: d.is_primary || false,
          entrance_notes: d.entrance_notes || null,
          max_rv_length_ft: d.max_rv_length_ft || null,
          max_rv_height_ft: d.max_rv_height_ft || null,
          road_type: d.road_type || null,
          grade: d.grade || null,
          tight_turns: d.tight_turns ?? null,
          low_clearance_warning: d.low_clearance_warning ?? null,
          seasonal_access: d.seasonal_access || null,
          seasonal_notes: d.seasonal_notes || null,
        };

        if (entrance.isUpdate) {
          const { error } = await supabase
            .from('entrances')
            .update(entranceData)
            .eq('entrance_external_id', d.entrance_external_id);

          if (error) {
            entrance.errors.push(error.message);
            results.entranceErrors.push(entrance);
            results.entrancesErrored++;
          } else {
            results.entrancesUpdated++;
          }
        } else {
          const { error } = await supabase.from('entrances').insert(entranceData);

          if (error) {
            entrance.errors.push(error.message);
            results.entranceErrors.push(entrance);
            results.entrancesErrored++;
          } else {
            results.entrancesCreated++;
          }
        }
      }

      // Add invalid rows to errors
      results.placeErrors.push(...placesParsed.filter(p => !p.isValid));
      results.entranceErrors.push(...entrancesParsed.filter(e => !e.isValid));

      setState(prev => ({ ...prev, step: 'results', results }));
      return results;
    } finally {
      setIsProcessing(false);
    }
  }, [state]);

  // Navigation
  const goToStep = useCallback((step: TwoTabImportState['step']) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_TWO_TAB_STATE);
  }, []);

  return {
    state,
    isProcessing,
    handleFileUpload,
    updatePlacesMapping,
    updateEntrancesMapping,
    validateAll,
    executeImport,
    goToStep,
    reset,
  };
}
