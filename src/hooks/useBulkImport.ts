import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { 
  ImportWizardState, 
  ColumnMapping, 
  ParsedRow, 
  MappingPreset,
  MUVO_FIELDS,
  COLUMN_ALIASES,
  VALID_CATEGORIES,
  VALID_PRICE_LEVELS,
  ImportResults
} from '@/types/bulkImport';
import { supabase } from '@/integrations/supabase/client';

const PRESETS_STORAGE_KEY = 'muvo_import_mapping_presets';

export function useBulkImport() {
  const [state, setState] = useState<ImportWizardState>({
    step: 1,
    fileName: '',
    fileType: 'csv',
    sourceColumns: [],
    rawRows: [],
    columnMapping: {},
    parsedRows: [],
    skipDuplicates: true,
    results: null,
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Parse file (CSV or XLSX)
  const parseFile = useCallback(async (file: File): Promise<{ columns: string[]; rows: Record<string, string>[] }> => {
    return new Promise((resolve, reject) => {
      const fileName = file.name.toLowerCase();
      const isXlsx = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

      if (isXlsx) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet, { header: 1 });
            
            if (jsonData.length < 2) {
              reject(new Error('File must have at least 2 rows (header + data)'));
              return;
            }

            const headers = (jsonData[0] as any[]).map(h => String(h || '').trim());
            const rows = jsonData.slice(1).map(row => {
              const rowObj: Record<string, string> = {};
              headers.forEach((header, idx) => {
                rowObj[header] = String((row as any[])[idx] ?? '').trim();
              });
              return rowObj;
            }).filter(row => Object.values(row).some(v => v !== ''));

            resolve({ columns: headers.filter(h => h), rows });
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
      } else {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const columns = results.meta.fields || [];
            const rows = results.data as Record<string, string>[];
            resolve({ columns, rows });
          },
          error: (err) => reject(err),
        });
      }
    });
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const { columns, rows } = await parseFile(file);
      const isXlsx = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
      
      // Auto-suggest mappings
      const autoMapping: ColumnMapping = {};
      MUVO_FIELDS.forEach(field => {
        const aliases = COLUMN_ALIASES[field.key] || [field.key.toLowerCase()];
        const matchedColumn = columns.find(col => 
          aliases.some(alias => col.toLowerCase().replace(/[_\s-]/g, '') === alias.replace(/[_\s-]/g, ''))
        );
        if (matchedColumn) {
          autoMapping[field.key] = matchedColumn;
        }
      });

      setState(prev => ({
        ...prev,
        step: 2,
        fileName: file.name,
        fileType: isXlsx ? 'xlsx' : 'csv',
        sourceColumns: columns,
        rawRows: rows,
        columnMapping: autoMapping,
      }));
    } catch (error) {
      console.error('File parse error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [parseFile]);

  // Update column mapping
  const updateMapping = useCallback((muvoField: string, sourceColumn: string | null) => {
    setState(prev => ({
      ...prev,
      columnMapping: {
        ...prev.columnMapping,
        [muvoField]: sourceColumn,
      },
    }));
  }, []);

  // Load mapping preset
  const loadPreset = useCallback((preset: MappingPreset) => {
    setState(prev => ({
      ...prev,
      columnMapping: { ...preset.mapping },
    }));
  }, []);

  // Save mapping preset
  const savePreset = useCallback((name: string): MappingPreset => {
    const preset: MappingPreset = {
      id: crypto.randomUUID(),
      name,
      mapping: { ...state.columnMapping },
      createdAt: new Date().toISOString(),
    };

    const existingPresets = getPresets();
    const updatedPresets = [...existingPresets, preset];
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
    
    return preset;
  }, [state.columnMapping]);

  // Get saved presets
  const getPresets = useCallback((): MappingPreset[] => {
    try {
      const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  // Delete preset
  const deletePreset = useCallback((presetId: string) => {
    const presets = getPresets().filter(p => p.id !== presetId);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  }, [getPresets]);

  // Transform value based on field type
  const transformValue = useCallback((value: string, fieldKey: string, fieldType: string): any => {
    if (!value || value.trim() === '') return null;

    switch (fieldType) {
      case 'number':
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      
      case 'boolean':
        const lower = value.toLowerCase();
        if (['true', 'yes', '1', 'y'].includes(lower)) return true;
        if (['false', 'no', '0', 'n'].includes(lower)) return false;
        return null;
      
      case 'array':
        // Support comma, pipe, semicolon separation
        return value.split(/[,|;]/).map(s => s.trim()).filter(s => s);
      
      case 'category':
        const matchedCategory = VALID_CATEGORIES.find(
          c => c.toLowerCase() === value.toLowerCase()
        );
        return matchedCategory || 'Other';
      
      case 'price':
        // Handle numeric 1/2/3 or $/$$/$$$ 
        if (['1', '$'].includes(value)) return '$';
        if (['2', '$$'].includes(value)) return '$$';
        if (['3', '$$$'].includes(value)) return '$$$';
        return '$$'; // default
      
      default:
        return value.trim();
    }
  }, []);

  // Validate and process rows
  const processRows = useCallback(async () => {
    setIsProcessing(true);
    try {
      const { rawRows, columnMapping } = state;
      
      // Get existing places for duplicate detection
      const { data: existingPlaces } = await supabase
        .from('places')
        .select('id, name, latitude, longitude');

      const parsedRows: ParsedRow[] = rawRows.map((rawRow, idx) => {
        const mappedData: Record<string, any> = {};
        const errors: string[] = [];

        // Apply mapping and transformations
        MUVO_FIELDS.forEach(field => {
          const sourceColumn = columnMapping[field.key];
          if (sourceColumn && rawRow[sourceColumn] !== undefined) {
            mappedData[field.key] = transformValue(rawRow[sourceColumn], field.key, field.type);
          }
        });

        // Validate required fields
        if (!mappedData.place_name) {
          errors.push('Missing place name');
        }
        
        const lat = mappedData.latitude;
        const lng = mappedData.longitude;
        
        if (lat === null || lat === undefined || isNaN(lat) || lat < -90 || lat > 90) {
          errors.push('Invalid latitude');
        }
        if (lng === null || lng === undefined || isNaN(lng) || lng < -180 || lng > 180) {
          errors.push('Invalid longitude');
        }

        // Check for duplicates
        let isDuplicate = false;
        let duplicateOf: string | undefined;

        if (existingPlaces && mappedData.place_name && lat && lng) {
          const duplicate = existingPlaces.find(p => {
            // Check by google_place_id first if available
            if (mappedData.google_place_id) {
              // Would need to check external refs - simplified for now
            }
            
            // Check by name + location (within ~100m)
            const nameLower = mappedData.place_name.toLowerCase();
            const placeName = p.name.toLowerCase();
            const latDiff = Math.abs(Number(p.latitude) - lat);
            const lngDiff = Math.abs(Number(p.longitude) - lng);
            
            return nameLower === placeName && latDiff < 0.001 && lngDiff < 0.001;
          });

          if (duplicate) {
            isDuplicate = true;
            duplicateOf = duplicate.name;
          }
        }

        return {
          rowNumber: idx + 2, // +2 for 1-indexed and header row
          rawData: rawRow,
          mappedData,
          isValid: errors.length === 0,
          errors,
          isDuplicate,
          duplicateOf,
        };
      });

      setState(prev => ({
        ...prev,
        step: 3,
        parsedRows,
      }));
    } catch (error) {
      console.error('Process rows error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [state, transformValue]);

  // Execute import
  const executeImport = useCallback(async (): Promise<ImportResults> => {
    setIsProcessing(true);
    try {
      const { parsedRows, skipDuplicates } = state;
      
      const rowsToImport = parsedRows.filter(row => {
        if (!row.isValid) return false;
        if (skipDuplicates && row.isDuplicate) return false;
        return true;
      });

      const placesToInsert = rowsToImport.map(row => {
        const d = row.mappedData;
        
        // Build the place object
        const place: Record<string, any> = {
          name: d.place_name,
          latitude: d.latitude,
          longitude: d.longitude,
          primary_category: VALID_CATEGORIES.includes(d.primary_category) 
            ? d.primary_category 
            : 'RV Campground',
          price_level: VALID_PRICE_LEVELS.includes(d.price_tier) ? d.price_tier : '$$',
          description: d.short_description || null,
          address_line1: d.address_line1 || null,
          city: d.city || null,
          state: d.state || null,
          postal_code: d.postal_code || null,
          country: d.country || 'USA',
          phone: d.phone || null,
          website: d.website_url || null,
          email: d.email || null,
          custom_category_text: !VALID_CATEGORIES.includes(d.primary_category) ? d.primary_category : null,
        };

        // Add entrance data (1-5)
        for (let i = 1; i <= 5; i++) {
          const eName = d[`entrance${i}_name`];
          const eLat = d[`entrance${i}_lat`];
          const eLng = d[`entrance${i}_lng`];
          
          if (eName && !isNaN(eLat) && !isNaN(eLng)) {
            place[`entrance_${i}_name`] = eName;
            place[`entrance_${i}_latitude`] = eLat;
            place[`entrance_${i}_longitude`] = eLng;
            place[`entrance_${i}_road`] = d[`entrance${i}_road`] || null;
            place[`entrance_${i}_notes`] = d[`entrance${i}_notes`] || null;
            place[`entrance_${i}_is_primary`] = d[`entrance${i}_primary_flag`] || false;
          }
        }

        return place;
      });

      // Import in batches to avoid timeout
      const BATCH_SIZE = 50;
      let importedCount = 0;
      const errorRows: ParsedRow[] = [];

      for (let i = 0; i < placesToInsert.length; i += BATCH_SIZE) {
        const batch = placesToInsert.slice(i, i + BATCH_SIZE) as any[];
        const { data, error } = await supabase
          .from('places')
          .insert(batch)
          .select('id');

        if (error) {
          // Mark rows in this batch as errors
          const batchRowNumbers = rowsToImport.slice(i, i + BATCH_SIZE).map(r => r.rowNumber);
          batchRowNumbers.forEach(rowNum => {
            const row = parsedRows.find(r => r.rowNumber === rowNum);
            if (row) {
              row.errors.push(error.message);
              errorRows.push(row);
            }
          });
        } else {
          importedCount += data?.length || 0;
        }
      }

      const skippedDuplicates = parsedRows.filter(r => r.isDuplicate && skipDuplicates).length;
      const invalidRows = parsedRows.filter(r => !r.isValid);

      const results: ImportResults = {
        importedCount,
        skippedDuplicates,
        errorRows: [...invalidRows, ...errorRows],
      };

      setState(prev => ({ ...prev, results }));
      return results;
    } finally {
      setIsProcessing(false);
    }
  }, [state]);

  // Toggle skip duplicates
  const setSkipDuplicates = useCallback((skip: boolean) => {
    setState(prev => ({ ...prev, skipDuplicates: skip }));
  }, []);

  // Go to step
  const goToStep = useCallback((step: 1 | 2 | 3) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  // Reset wizard
  const reset = useCallback(() => {
    setState({
      step: 1,
      fileName: '',
      fileType: 'csv',
      sourceColumns: [],
      rawRows: [],
      columnMapping: {},
      parsedRows: [],
      skipDuplicates: true,
      results: null,
    });
  }, []);

  // Download errors CSV
  const downloadErrorsCsv = useCallback(() => {
    if (!state.results?.errorRows.length) return;

    const headers = ['Row Number', 'Errors', ...Object.keys(state.results.errorRows[0]?.rawData || {})];
    const rows = state.results.errorRows.map(row => [
      row.rowNumber,
      row.errors.join('; '),
      ...Object.values(row.rawData),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-errors.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [state.results]);

  return {
    state,
    isProcessing,
    handleFileUpload,
    updateMapping,
    loadPreset,
    savePreset,
    getPresets,
    deletePreset,
    processRows,
    executeImport,
    setSkipDuplicates,
    goToStep,
    reset,
    downloadErrorsCsv,
  };
}
