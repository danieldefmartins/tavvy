import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  MapPin,
  Building2,
  ArrowRight,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useTwoTabImport, generateTemplateXLSX, generatePlacesCSV, generateEntrancesCSV } from '@/hooks/useTwoTabImport';
import { PLACES_FIELDS, ENTRANCES_FIELDS } from '@/types/twoTabImport';

export default function BulkImport() {
  const navigate = useNavigate();
  const { data: isAdmin } = useIsAdmin();
  const {
    state,
    isProcessing,
    handleFileUpload,
    updatePlacesMapping,
    updateEntrancesMapping,
    validateAll,
    executeImport,
    goToStep,
    reset,
  } = useTwoTabImport();

  const [dragOver, setDragOver] = useState(false);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Admin access required</AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      handleFileUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const stepProgress = {
    'upload': 0,
    'map_places': 25,
    'map_entrances': 50,
    'validate': 75,
    'results': 100,
  }[state.step];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Bulk Import (Two-Tab)</h1>
            <p className="text-sm text-muted-foreground">
              Import places and entrances from a single XLSX file with two sheets
            </p>
          </div>
          {state.step !== 'upload' && (
            <Button variant="outline" onClick={reset}>Start Over</Button>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={state.step === 'upload' ? 'text-primary font-medium' : 'text-muted-foreground'}>
              1. Upload
            </span>
            <span className={state.step === 'map_places' ? 'text-primary font-medium' : 'text-muted-foreground'}>
              2. Map Places
            </span>
            <span className={state.step === 'map_entrances' ? 'text-primary font-medium' : 'text-muted-foreground'}>
              3. Map Entrances
            </span>
            <span className={state.step === 'validate' ? 'text-primary font-medium' : 'text-muted-foreground'}>
              4. Validate
            </span>
            <span className={state.step === 'results' ? 'text-primary font-medium' : 'text-muted-foreground'}>
              5. Results
            </span>
          </div>
          <Progress value={stepProgress} className="h-2" />
        </div>

        {/* Upload Step */}
        {state.step === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Upload Workbook
              </CardTitle>
              <CardDescription>
                Upload an XLSX file with two sheets: "Places" and "Entrances"
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Template Downloads */}
              <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Templates
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={generateTemplateXLSX}>
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    XLSX Template (Both Tabs)
                  </Button>
                  <Button variant="outline" size="sm" onClick={generatePlacesCSV}>
                    <Building2 className="w-4 h-4 mr-1" />
                    Places CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={generateEntrancesCSV}>
                    <MapPin className="w-4 h-4 mr-1" />
                    Entrances CSV
                  </Button>
                </div>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragOver ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Drop your XLSX file here</p>
                <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Choose File
                  </label>
                </Button>
              </div>

              <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
                <h4 className="font-medium mb-2">Required Columns:</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-primary flex items-center gap-1">
                      <Building2 className="w-4 h-4" /> Sheet 1: Places
                    </p>
                    <ul className="mt-1 space-y-0.5 text-muted-foreground">
                      <li>• place_external_id <span className="text-destructive">*</span></li>
                      <li>• place_name <span className="text-destructive">*</span></li>
                      <li>• primary_category <span className="text-destructive">*</span></li>
                      <li>• latitude, longitude <span className="text-destructive">*</span></li>
                      <li>• country <span className="text-destructive">*</span></li>
                      <li className="text-xs mt-1">Optional: formatted_address, city, state_province, postal_code, county, phone, website, hours_text, is_verified, source_platform</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-primary flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> Sheet 2: Entrances (optional)
                    </p>
                    <ul className="mt-1 space-y-0.5 text-muted-foreground">
                      <li>• place_external_id <span className="text-destructive">*</span></li>
                      <li>• entrance_external_id <span className="text-destructive">*</span></li>
                      <li>• entrance_name <span className="text-destructive">*</span></li>
                      <li>• latitude, longitude <span className="text-destructive">*</span></li>
                      <li className="text-xs mt-1">Optional: max_rv_length_ft, max_rv_height_ft, road_type, grade, tight_turns, low_clearance_warning, seasonal_access, seasonal_notes, entrance_notes</li>
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  <span className="text-destructive">*</span> = Required. If hours are unknown, leave blank. Display will show "Please check hours of operation."
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map Places Step */}
        {state.step === 'map_places' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Map Places Columns
              </CardTitle>
              <CardDescription>
                Found {state.placesRawRows.length} rows in Places sheet. Map your columns to MUVO fields.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {PLACES_FIELDS.map(field => (
                  <div key={field.key} className="flex items-center gap-3">
                    <Label className="w-40 text-sm">
                      {field.displayName}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Select
                      value={state.placesMapping[field.key] || ''}
                      onValueChange={(val) => updatePlacesMapping(field.key, val || null)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">— Not mapped —</SelectItem>
                        {state.placesColumns.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => goToStep('upload')}>
                  Back
                </Button>
                <Button onClick={() => goToStep('map_entrances')}>
                  Next: Map Entrances <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map Entrances Step */}
        {state.step === 'map_entrances' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Map Entrances Columns
              </CardTitle>
              <CardDescription>
                Found {state.entrancesRawRows.length} rows in Entrances sheet.
                {state.entrancesRawRows.length === 0 && (
                  <span className="text-warning ml-1">(No entrances sheet found - you can skip this step)</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {state.entrancesColumns.length > 0 ? (
                <div className="grid gap-3">
                  {ENTRANCES_FIELDS.map(field => (
                    <div key={field.key} className="flex items-center gap-3">
                      <Label className="w-48 text-sm">
                        {field.displayName}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      <Select
                        value={state.entrancesMapping[field.key] || ''}
                        onValueChange={(val) => updateEntrancesMapping(field.key, val || null)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select column..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">— Not mapped —</SelectItem>
                          {state.entrancesColumns.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No Entrances sheet found. You can proceed without entrances.</p>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => goToStep('map_places')}>
                  Back
                </Button>
                <Button onClick={validateAll} disabled={isProcessing}>
                  {isProcessing ? 'Validating...' : 'Validate Data'}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Validate Step */}
        {state.step === 'validate' && (
          <div className="space-y-4">
            <Tabs defaultValue="places">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="places" className="gap-2">
                  <Building2 className="w-4 h-4" />
                  Places ({state.placesParsed.length})
                </TabsTrigger>
                <TabsTrigger value="entrances" className="gap-2">
                  <MapPin className="w-4 h-4" />
                  Entrances ({state.entrancesParsed.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="places">
                <Card>
                  <CardHeader>
                    <CardTitle>Places Validation</CardTitle>
                    <CardDescription>
                      {state.placesParsed.filter(p => p.isValid).length} valid,{' '}
                      {state.placesParsed.filter(p => !p.isValid).length} with errors,{' '}
                      {state.placesParsed.filter(p => p.isUpdate).length} updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-64 overflow-auto space-y-2">
                      {state.placesParsed.slice(0, 50).map(row => (
                        <div 
                          key={row.rowNumber} 
                          className={`p-2 rounded text-sm flex items-center gap-2 ${
                            row.isValid ? 'bg-primary/5' : 'bg-destructive/10'
                          }`}
                        >
                          {row.isValid ? (
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive shrink-0" />
                          )}
                          <span className="font-mono text-xs text-muted-foreground">
                            Row {row.rowNumber}
                          </span>
                          <span className="truncate">{row.mappedData.name || '—'}</span>
                          {row.isUpdate && <Badge variant="secondary" className="text-xs">Update</Badge>}
                          {row.errors.length > 0 && (
                            <span className="text-destructive text-xs ml-auto">{row.errors.join(', ')}</span>
                          )}
                        </div>
                      ))}
                      {state.placesParsed.length > 50 && (
                        <p className="text-center text-sm text-muted-foreground py-2">
                          + {state.placesParsed.length - 50} more rows
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="entrances">
                <Card>
                  <CardHeader>
                    <CardTitle>Entrances Validation</CardTitle>
                    <CardDescription>
                      {state.entrancesParsed.filter(e => e.isValid).length} valid,{' '}
                      {state.entrancesParsed.filter(e => !e.isValid).length} with errors,{' '}
                      {state.entrancesParsed.filter(e => e.isUpdate).length} updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-64 overflow-auto space-y-2">
                      {state.entrancesParsed.slice(0, 50).map(row => (
                        <div 
                          key={row.rowNumber} 
                          className={`p-2 rounded text-sm flex items-center gap-2 ${
                            row.isValid ? 'bg-primary/5' : 'bg-destructive/10'
                          }`}
                        >
                          {row.isValid ? (
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive shrink-0" />
                          )}
                          <span className="font-mono text-xs text-muted-foreground">
                            Row {row.rowNumber}
                          </span>
                          <span className="truncate">{row.mappedData.entrance_name || '—'}</span>
                          {row.isUpdate && <Badge variant="secondary" className="text-xs">Update</Badge>}
                          {row.errors.length > 0 && (
                            <span className="text-destructive text-xs ml-auto truncate max-w-[200px]">
                              {row.errors.join(', ')}
                            </span>
                          )}
                        </div>
                      ))}
                      {state.entrancesParsed.length > 50 && (
                        <p className="text-center text-sm text-muted-foreground py-2">
                          + {state.entrancesParsed.length - 50} more rows
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => goToStep('map_entrances')}>
                Back
              </Button>
              <Button onClick={executeImport} disabled={isProcessing}>
                {isProcessing ? 'Importing...' : 'Execute Import'}
              </Button>
            </div>
          </div>
        )}

        {/* Results Step */}
        {state.step === 'results' && state.results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Import Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4" /> Places
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="flex justify-between">
                      <span>Created:</span>
                      <span className="font-medium text-primary">{state.results.placesCreated}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Updated:</span>
                      <span className="font-medium">{state.results.placesUpdated}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Errors:</span>
                      <span className="font-medium text-destructive">{state.results.placesErrored}</span>
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4" /> Entrances
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="flex justify-between">
                      <span>Created:</span>
                      <span className="font-medium text-primary">{state.results.entrancesCreated}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Updated:</span>
                      <span className="font-medium">{state.results.entrancesUpdated}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Errors:</span>
                      <span className="font-medium text-destructive">{state.results.entrancesErrored}</span>
                    </p>
                  </div>
                </div>
              </div>

              {(state.results.placeErrors.length > 0 || state.results.entranceErrors.length > 0) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {state.results.placeErrors.length + state.results.entranceErrors.length} rows had errors and were skipped.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={reset}>
                  Import More
                </Button>
                <Button onClick={() => navigate('/map')}>
                  View Map
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
