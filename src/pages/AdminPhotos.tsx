import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Trash2, Check, Flag, AlertTriangle, Loader2 } from 'lucide-react';
import { useFlaggedPhotos, useDeletePhoto, useUnflagPhoto, PHOTO_CATEGORIES } from '@/hooks/usePlacePhotos';
import { useIsAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';

export default function AdminPhotos() {
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { data: photos, isLoading } = useFlaggedPhotos();
  const deletePhoto = useDeletePhoto();
  const unflagPhoto = useUnflagPhoto();

  const getCategoryLabel = (category: string) => {
    return PHOTO_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const handleDelete = async (photo: any) => {
    try {
      await deletePhoto.mutateAsync({ 
        photoId: photo.id, 
        placeId: photo.placeId, 
        url: photo.url 
      });
      toast.success('Photo deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete photo');
    }
  };

  const handleApprove = async (photoId: string) => {
    try {
      await unflagPhoto.mutateAsync({ photoId });
      toast.success('Photo approved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve photo');
    }
  };

  if (isAdminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack />
        <main className="container px-4 py-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack />
        <main className="container px-4 py-6 max-w-2xl mx-auto text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <h1 className="text-xl font-semibold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access this page.
          </p>
          <Link to="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header showBack />

      <main className="container px-4 py-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Flag className="w-5 h-5 text-destructive" />
          <h1 className="text-xl font-semibold">Flagged Photos</h1>
          {photos && photos.length > 0 && (
            <span className="ml-auto text-sm text-muted-foreground">
              {photos.length} photo{photos.length !== 1 ? 's' : ''} to review
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !photos || photos.length === 0 ? (
          <div className="text-center py-12 bg-secondary/30 rounded-lg">
            <Check className="w-12 h-12 mx-auto text-success mb-4" />
            <p className="text-muted-foreground">No flagged photos to review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="bg-card border border-border rounded-lg overflow-hidden"
              >
                <div className="aspect-video relative">
                  <img
                    src={photo.url}
                    alt={getCategoryLabel(photo.category)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link 
                        to={`/place/${photo.placeId}`} 
                        className="font-medium hover:text-primary"
                      >
                        {(photo as any).placeName || 'Unknown Place'}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        Category: {getCategoryLabel(photo.category)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded by: {photo.profile?.displayName || 'Anonymous'}
                      </p>
                    </div>
                  </div>

                  {(photo as any).flagReason && (
                    <div className="p-2 bg-destructive/10 rounded text-sm text-destructive">
                      Reason: {(photo as any).flagReason}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-success hover:text-success"
                      onClick={() => handleApprove(photo.id)}
                      disabled={unflagPhoto.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(photo)}
                      disabled={deletePhoto.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
