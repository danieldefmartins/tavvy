import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploadProps {
  placeId: string;
  onSuccess: (imageUrl: string) => void;
  disabled?: boolean;
}

export function ImageUpload({ placeId, onSuccess, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be under 5MB.',
        variant: 'destructive',
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload with moderation
    await uploadImage(file);
  }

  async function uploadImage(file: File) {
    setIsUploading(true);

    try {
      // Get current session for auth header
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Not signed in',
          description: 'Please sign in to upload photos.',
          variant: 'destructive',
        });
        setPreview(null);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('placeId', placeId);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moderate-image`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (result.code === 'NOT_VERIFIED') {
          toast({
            title: 'Verification required',
            description: 'Please verify your email and phone to upload photos.',
            variant: 'destructive',
          });
        } else if (result.code === 'MODERATION_FAILED') {
          toast({
            title: 'Image not approved',
            description: result.reason || 'This image does not meet our guidelines.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Upload failed',
            description: result.error || 'Something went wrong.',
            variant: 'destructive',
          });
        }
        setPreview(null);
        return;
      }

      toast({
        title: 'Photo uploaded!',
        description: 'Your photo is now live.',
      });
      
      onSuccess(result.imageUrl);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      setPreview(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function clearPreview() {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {preview ? (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {isUploading ? (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Checking image...</p>
              </div>
            </div>
          ) : (
            <button
              onClick={clearPreview}
              className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="w-full h-auto py-4"
        >
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <span>Add a photo</span>
          </div>
        </Button>
      )}
    </div>
  );
}
