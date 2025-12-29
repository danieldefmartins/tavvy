import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Download, Loader2, Upload, Copy } from 'lucide-react';
import { ParsedRow, ImportResults } from '@/types/bulkImport';

interface ImportValidateStepProps {
  parsedRows: ParsedRow[];
  skipDuplicates: boolean;
  onSetSkipDuplicates: (skip: boolean) => void;
  onImport: () => Promise<ImportResults>;
  onBack: () => void;
  onReset: () => void;
  onDownloadErrors: () => void;
  results: ImportResults | null;
  isProcessing: boolean;
}

export function ImportValidateStep({
  parsedRows,
  skipDuplicates,
  onSetSkipDuplicates,
  onImport,
  onBack,
  onReset,
  onDownloadErrors,
  results,
  isProcessing,
}: ImportValidateStepProps) {
  const validRows = parsedRows.filter(r => r.isValid);
  const invalidRows = parsedRows.filter(r => !r.isValid);
  const duplicateRows = parsedRows.filter(r => r.isDuplicate);
  
  const rowsToImport = validRows.filter(r => !skipDuplicates || !r.isDuplicate);
  const previewRows = parsedRows.slice(0, 20);

  if (results) {
    return (
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <CheckCircle className="h-6 w-6" />
            Import Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{results.importedCount}</p>
              <p className="text-sm text-muted-foreground">Imported</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{results.skippedDuplicates}</p>
              <p className="text-sm text-muted-foreground">Skipped (Duplicates)</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{results.errorRows.length}</p>
              <p className="text-sm text-muted-foreground">Errors</p>
            </div>
          </div>

          {results.errorRows.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{results.errorRows.length} rows had errors and were not imported.</span>
                <Button variant="outline" size="sm" onClick={onDownloadErrors}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Errors CSV
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onReset}>
              <Upload className="h-4 w-4 mr-2" />
              Import More
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: Validate & Import</CardTitle>
        <CardDescription>
          Review the data before importing. Showing first 20 rows.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{parsedRows.length}</p>
            <p className="text-xs text-muted-foreground">Total Rows</p>
          </div>
          <div className="bg-green-500/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{validRows.length}</p>
            <p className="text-xs text-muted-foreground">Valid</p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{invalidRows.length}</p>
            <p className="text-xs text-muted-foreground">Invalid</p>
          </div>
          <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{duplicateRows.length}</p>
            <p className="text-xs text-muted-foreground">Duplicates</p>
          </div>
        </div>

        {/* Skip Duplicates Toggle */}
        {duplicateRows.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Copy className="h-4 w-4 text-yellow-600" />
              <div>
                <Label className="font-medium">Skip Duplicates</Label>
                <p className="text-xs text-muted-foreground">
                  {duplicateRows.length} places already exist in the database
                </p>
              </div>
            </div>
            <Switch
              checked={skipDuplicates}
              onCheckedChange={onSetSkipDuplicates}
            />
          </div>
        )}

        {/* Preview Table */}
        <div className="border rounded-lg">
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-16">Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map(row => (
                  <TableRow key={row.rowNumber} className={!row.isValid ? 'bg-red-500/5' : row.isDuplicate ? 'bg-yellow-500/5' : ''}>
                    <TableCell className="font-mono text-xs">{row.rowNumber}</TableCell>
                    <TableCell>
                      {!row.isValid ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : row.isDuplicate ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {row.mappedData.place_name || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.mappedData.latitude?.toFixed(4)}, {row.mappedData.longitude?.toFixed(4)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {row.mappedData.primary_category || 'RV Campground'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.errors.length > 0 && (
                        <span className="text-xs text-red-500">{row.errors.join(', ')}</span>
                      )}
                      {row.isDuplicate && (
                        <span className="text-xs text-yellow-600">Duplicate of "{row.duplicateOf}"</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {parsedRows.length > 20 && (
          <p className="text-xs text-center text-muted-foreground">
            Showing 20 of {parsedRows.length} rows
          </p>
        )}

        <Separator />

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={onBack}>
            Back to Mapping
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Will import <strong>{rowsToImport.length}</strong> places
            </span>
            <Button 
              onClick={onImport} 
              disabled={rowsToImport.length === 0 || isProcessing}
              className="min-w-32"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  Import {rowsToImport.length} Places
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
