import React, { useState } from 'react';
import { useReviews, useDeleteReview, REVIEW_DIMENSIONS, Review } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { ReviewSignalIcon } from './ReviewSignalIcon';
import { TrustedContributorBadge } from './TrustedContributorBadge';
import { ReviewerMedalBadge } from './ReviewerMedalBadge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Loader2, Filter } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ReviewListProps {
  placeId: string;
  onEditReview?: () => void;
}

export function ReviewList({ placeId, onEditReview }: ReviewListProps) {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  // Pass isAdmin to useReviews so admins can see private notes via RLS-protected query
  const { data: reviews, isLoading } = useReviews(placeId, isAdmin);
  const deleteReview = useDeleteReview();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'trusted'>('all');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Empty state is now handled by ReviewsSection
  if (!reviews || reviews.length === 0) {
    return null;
  }

  // Filter reviews based on selected tab
  const filteredReviews = filter === 'trusted'
    ? reviews.filter((r) => r.reviewer_medal === 'silver' || r.reviewer_medal === 'gold')
    : reviews;

  const trustedCount = reviews.filter(
    (r) => r.reviewer_medal === 'silver' || r.reviewer_medal === 'gold'
  ).length;

  const handleDelete = async (reviewId: string) => {
    try {
      await deleteReview.mutateAsync({ reviewId, placeId });
      toast({
        title: "Review deleted",
        description: "The review has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  const getDimensionLabel = (dimension: string) => {
    return REVIEW_DIMENSIONS.find((d) => d.id === dimension)?.label || dimension;
  };

  return (
    <div className="space-y-4">
      {/* Filter tabs - only show if there are trusted reviews */}
      {trustedCount > 0 && (
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'trusted')}>
          <TabsList className="grid w-full grid-cols-2 max-w-xs">
            <TabsTrigger value="all">All ({reviews.length})</TabsTrigger>
            <TabsTrigger value="trusted">
              <Filter className="h-3 w-3 mr-1" />
              Trusted ({trustedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {filteredReviews.length === 0 && filter === 'trusted' && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No trusted reviews yet. Showing all reviews.
        </p>
      )}

      {filteredReviews.map((review: Review) => {
        const isOwner = user?.id === review.user_id;
        const canDelete = isOwner || isAdmin;
        const positiveSignals = review.signals.filter((s) => s.polarity === 'positive');
        const improvementSignals = review.signals.filter((s) => s.polarity === 'improvement');

        return (
          <div key={review.id} className="border rounded-lg p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {review.user_display_name || 'Anonymous'}
                </span>
                {review.reviewer_medal && review.reviewer_medal !== 'none' && (
                  <ReviewerMedalBadge medal={review.reviewer_medal} size="sm" />
                )}
                {review.trusted_contributor && <TrustedContributorBadge />}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </span>
                {isOwner && (
                  <Button variant="ghost" size="sm" onClick={onEditReview}>
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Review</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this review? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(review.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            {/* Signals */}
            <div className="space-y-2">
              {positiveSignals.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {positiveSignals.map((signal) => (
                    <div
                      key={signal.dimension}
                      className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium"
                    >
                      <ReviewSignalIcon
                        dimension={signal.dimension}
                        polarity="positive"
                        level={signal.level}
                        selected
                        size="sm"
                      />
                      <span>
                        {getDimensionLabel(signal.dimension)}
                        {signal.level > 1 && <span className="font-bold ml-0.5">×{signal.level}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {improvementSignals.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {improvementSignals.map((signal) => (
                    <div
                      key={signal.dimension}
                      className="flex items-center gap-1 bg-[hsl(var(--signal-neutral-tint))] text-[hsl(var(--signal-neutral-text))] px-2 py-1 rounded-full text-xs font-medium"
                    >
                      <ReviewSignalIcon
                        dimension={signal.dimension}
                        polarity="improvement"
                        level={signal.level}
                        selected
                        size="sm"
                      />
                      <span>
                        {getDimensionLabel(signal.dimension)}
                        {signal.level > 1 && <span className="font-bold ml-0.5">×{signal.level}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Public Note */}
            {review.note_public && (
              <p className="text-sm text-foreground">{review.note_public}</p>
            )}

            {/* Private Note (only for admin) */}
            {isAdmin && review.note_private && (
              <div className="bg-muted/50 p-2 rounded text-sm">
                <span className="text-xs font-medium text-muted-foreground">Private note: </span>
                {review.note_private}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
