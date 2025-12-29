import { useState, useRef } from 'react';
import { Upload, X, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useUploadPhoto, PHOTO_CATEGORIES, PhotoCategory } from '@/hooks/usePlacePhotos';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PhotoUploadFormProps {
  placeId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function PhotoUploadForm({ placeId, onSuccess, onCancel }: PhotoUploadFormProps) {
  const uploadPhoto = useUploadPhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState<PhotoCategory | ''>('');
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Please select a JPG, PNG, or WebP image');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be less than 10MB');
      return;
    }

    hapticLight();
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !category) {
      toast.error('Please select an image and category');
      return;
    }

    hapticMedium();
    try {
      await uploadPhoto.mutateAsync({
        placeId,
        file: selectedFile,
        category,
        onProgress: setProgress,
      });
      toast.success('Photo uploaded successfully!');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload photo');
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      {/* File input / preview */}
      {!preview ? (
        <div
          className={cn(
            'border-2 border-dashed border-border rounded-lg p-6',
            'flex flex-col items-center justify-center gap-3',
            'cursor-pointer hover:border-primary/50 transition-colors'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="w-10 h-10 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">Tap to select a photo</p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, or WebP • Max 10MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden">
          <img
            src={preview}
            alt="Preview"
            className="w-full max-h-48 object-cover"
          />
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleClear}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Category selection */}
      <div className="space-y-2">
        <Label htmlFor="category">Photo Category *</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as PhotoCategory)}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select what this photo shows" />
          </SelectTrigger>
          <SelectContent>
            {PHOTO_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Upload progress */}
      {uploadPhoto.isPending && progress > 0 && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Uploading... {progress}%
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={uploadPhoto.isPending}
        >
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={!selectedFile || !category || uploadPhoto.isPending}
        >
          {uploadPhoto.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Photo
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
