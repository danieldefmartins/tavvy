import { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportUploadStepProps {
  onFileUpload: (file: File) => Promise<void>;
  isProcessing: boolean;
}

export function ImportUploadStep({ onFileUpload, isProcessing }: ImportUploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV or Excel (.xlsx) file',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onFileUpload(file);
    } catch (error: any) {
      toast({
        title: 'Failed to parse file',
        description: error.message || 'Please check the file format',
        variant: 'destructive',
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const downloadTemplate = () => {
    const baseHeaders = ['name', 'latitude', 'longitude', 'primary_category', 'price_tier', 'short_description', 'address_line1', 'city', 'state', 'postal_code', 'country', 'phone', 'website_url', 'email'];
    
    const entranceHeaders: string[] = [];
    for (let i = 1; i <= 5; i++) {
      entranceHeaders.push(
        `entrance${i}_name`,
        `entrance${i}_lat`,
        `entrance${i}_lng`,
        `entrance${i}_road`,
        `entrance${i}_notes`,
        `entrance${i}_primary_flag`
      );
    }
    
    const headers = [...baseHeaders, ...entranceHeaders].join(',');
    const example = '"Yosemite National Park",37.8651,-119.5383,"National Park","$$","Beautiful national park","9035 Village Dr","Yosemite Valley","CA","95389","USA","(209) 372-0200","https://www.nps.gov/yose","","Arch Rock Entrance",37.6842,-119.8453,"Highway 140","Main entrance from Merced",true';
    const csv = `${headers}\n${example}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'muvo-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Step 1: Upload File
        </CardTitle>
        <CardDescription>
          Upload a CSV or Excel file with your places. Column mapping is done in the next step.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download MUVO Template
          </Button>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Processing file...</p>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Drop your file here</p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Label className="text-xs text-muted-foreground">
                Supports CSV and Excel (.xlsx) files
              </Label>
            </>
          )}
        </div>

        <Alert>
          <AlertDescription className="text-sm">
            <strong>Flexible Import:</strong> Your file doesn't need to match our template exactly. 
            In the next step, you'll map your columns to MUVO fields.
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
              <li>Required: Place name, latitude, longitude</li>
              <li>Optional: Category, price, address, contact info, entrances</li>
              <li>Supports up to 5 entrances per place</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
