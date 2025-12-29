import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Flag, Trash2, Camera, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrustedContributorBadge } from '@/components/TrustedContributorBadge';
import { usePlacePhotos, useDeletePhoto, useFlagPhoto, PHOTO_CATEGORIES, PlacePhoto } from '@/hooks/usePlacePhotos';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PlacePhotoGalleryProps {
  placeId: string;
  onAddPhoto?: () => void;
}

export function PlacePhotoGallery({ placeId, onAddPhoto }: PlacePhotoGalleryProps) {
  const { user, isVerified } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { data: photos, isLoading } = usePlacePhotos(placeId);
  const deletePhoto = useDeletePhoto();
  const flagPhoto = useFlagPhoto();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportingPhotoId, setReportingPhotoId] = useState<string | null>(null);

  const selectedPhoto = selectedIndex !== null ? photos?.[selectedIndex] : null;

  const handlePrev = () => {
    hapticLight();
    if (selectedIndex !== null && photos) {
      setSelectedIndex(selectedIndex === 0 ? photos.length - 1 : selectedIndex - 1);
    }
  };

  const handleNext = () => {
    hapticLight();
    if (selectedIndex !== null && photos) {
      setSelectedIndex(selectedIndex === photos.length - 1 ? 0 : selectedIndex + 1);
    }
  };

  const handleDelete = async (photo: PlacePhoto) => {
    hapticMedium();
    try {
      await deletePhoto.mutateAsync({ 
        photoId: photo.id, 
        placeId, 
        url: photo.url 
      });
      toast.success('Photo deleted');
      setSelectedIndex(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete photo');
    }
  };

  const handleReport = async () => {
    if (!reportingPhotoId) return;
    hapticMedium();
    try {
      await flagPhoto.mutateAsync({ photoId: reportingPhotoId, placeId });
      toast.success('Photo reported for review');
      setShowReportDialog(false);
      setReportingPhotoId(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to report photo');
    }
  };

  const getCategoryLabel = (category: string) => {
    return PHOTO_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  // Empty state
  if (!photos || photos.length === 0) {
    return (
      <div className="bg-secondary/30 border border-dashed border-border rounded-lg p-8 text-center">
        <Camera className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-sm mb-3">
          No photos yet. Be the first to add a photo!
        </p>
        {user && isVerified && onAddPhoto && (
          <Button size="sm" onClick={onAddPhoto}>
            <Camera className="w-4 h-4 mr-2" />
            Add Photo
          </Button>
        )}
        {user && !isVerified && (
          <Link to="/auth" className="text-sm text-primary hover:underline">
            Complete verification to add photos
          </Link>
        )}
        {!user && (
          <Link to="/auth" className="text-sm text-primary hover:underline">
            Sign in to add photos
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Photo Grid */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
          {photos.slice(0, 6).map((photo, index) => (
            <button
              key={photo.id}
              className={cn(
                'relative aspect-square overflow-hidden',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                'transition-transform active:scale-[0.98]'
              )}
              onClick={() => {
                hapticLight();
                setSelectedIndex(index);
              }}
            >
              <img
                src={photo.url}
                alt={getCategoryLabel(photo.category)}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                <span className="text-[10px] text-white font-medium">
                  {getCategoryLabel(photo.category)}
                </span>
              </div>
              {index === 5 && photos.length > 6 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-semibold">+{photos.length - 6}</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Add photo button */}
        {user && isVerified && onAddPhoto && (
          <Button variant="outline" size="sm" className="w-full" onClick={onAddPhoto}>
            <Camera className="w-4 h-4 mr-2" />
            Add Photo
          </Button>
        )}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && setSelectedIndex(null)}>
        <DialogContent className="max-w-3xl p-0 bg-black/95 border-none">
          {selectedPhoto && (
            <div className="relative">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
                onClick={() => setSelectedIndex(null)}
              >
                <X className="w-5 h-5" />
              </Button>

              {/* Navigation */}
              {photos && photos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                    onClick={handlePrev}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                    onClick={handleNext}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}

              {/* Image */}
              <img
                src={selectedPhoto.url}
                alt={getCategoryLabel(selectedPhoto.category)}
                className="w-full max-h-[70vh] object-contain"
              />

              {/* Info bar */}
              <div className="p-4 bg-black/80 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {getCategoryLabel(selectedPhoto.category)}
                    </span>
                    <span className="text-xs text-white/60">
                      by {selectedPhoto.profile?.displayName || 'Anonymous'}
                    </span>
                    {selectedPhoto.profile?.trustedContributor && (
                      <TrustedContributorBadge className="bg-amber-500/20" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    {user && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                        onClick={() => {
                          setReportingPhotoId(selectedPhoto.id);
                          setShowReportDialog(true);
                        }}
                      >
                        <Flag className="w-4 h-4 mr-1" />
                        Report
                      </Button>
                    )}
                    {(selectedPhoto.userId === user?.id || isAdmin) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/20"
                        onClick={() => handleDelete(selectedPhoto)}
                        disabled={deletePhoto.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
                {photos && (
                  <div className="text-xs text-white/60 mt-1">
                    {(selectedIndex ?? 0) + 1} of {photos.length}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Photo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Are you sure you want to report this photo? An admin will review it.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReport}
              disabled={flagPhoto.isPending}
            >
              Report Photo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
