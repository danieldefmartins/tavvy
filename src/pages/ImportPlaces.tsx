import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useBulkImport } from '@/hooks/useBulkImport';
import { ImportUploadStep } from '@/components/import/ImportUploadStep';
import { ImportMappingStep } from '@/components/import/ImportMappingStep';
import { ImportValidateStep } from '@/components/import/ImportValidateStep';
import { useToast } from '@/hooks/use-toast';

export default function ImportPlaces() {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  
  const {
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
  } = useBulkImport();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Admin access required to import places</AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleImport = async () => {
    try {
      const results = await executeImport();
      toast({
        title: 'Import complete',
        description: `Imported ${results.importedCount} places${results.skippedDuplicates > 0 ? `, skipped ${results.skippedDuplicates} duplicates` : ''}`,
      });
      return results;
    } catch (error: any) {
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const stepProgress = state.step === 1 ? 0 : state.step === 2 ? 33 : state.step === 3 ? 66 : 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Bulk Import Places</h1>
            <p className="text-sm text-muted-foreground">
              Import places from CSV or Excel files with flexible column mapping
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={state.step >= 1 ? 'text-primary font-medium' : 'text-muted-foreground'}>
              1. Upload
            </span>
            <span className={state.step >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'}>
              2. Map Columns
            </span>
            <span className={state.step >= 3 ? 'text-primary font-medium' : 'text-muted-foreground'}>
              3. Validate & Import
            </span>
          </div>
          <Progress value={stepProgress} className="h-2" />
        </div>

        {/* Step Content */}
        {state.step === 1 && (
          <ImportUploadStep
            onFileUpload={handleFileUpload}
            isProcessing={isProcessing}
          />
        )}

        {state.step === 2 && (
          <ImportMappingStep
            fileName={state.fileName}
            sourceColumns={state.sourceColumns}
            rowCount={state.rawRows.length}
            columnMapping={state.columnMapping}
            onUpdateMapping={updateMapping}
            onSavePreset={savePreset}
            onLoadPreset={loadPreset}
            onDeletePreset={deletePreset}
            getPresets={getPresets}
            onNext={processRows}
            onBack={() => goToStep(1)}
            isProcessing={isProcessing}
          />
        )}

        {state.step === 3 && (
          <ImportValidateStep
            parsedRows={state.parsedRows}
            skipDuplicates={state.skipDuplicates}
            onSetSkipDuplicates={setSkipDuplicates}
            onImport={handleImport}
            onBack={() => goToStep(2)}
            onReset={reset}
            onDownloadErrors={downloadErrorsCsv}
            results={state.results}
            isProcessing={isProcessing}
          />
        )}
      </div>
    </div>
  );
}
