import { MessageSquareText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReviews, usePlaceReviewCount, Review } from '@/hooks/useReviews';
import { Skeleton } from '@/components/ui/skeleton';
import { TrustedContributorBadge } from '@/components/TrustedContributorBadge';
import { ReviewerMedalBadge } from '@/components/ReviewerMedalBadge';

interface ReviewsPreviewProps {
  placeId: string;
  placeName: string;
  placeCategory?: string;
  maxReviews?: number;
}

export function ReviewsPreview({ 
  placeId, 
  placeName, 
  placeCategory,
  maxReviews = 3 
}: ReviewsPreviewProps) {
  const { data: reviews, isLoading } = useReviews(placeId);
  const { data: reviewCount } = usePlaceReviewCount(placeId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const hasReviews = reviews && reviews.length > 0;
  const previewReviews = reviews?.slice(0, maxReviews) || [];
  const remainingCount = (reviewCount || 0) - previewReviews.length;

  if (!hasReviews) {
    return (
      <div className="text-center py-6 bg-secondary/30 rounded-lg border border-dashed border-border">
        <MessageSquareText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No reviews yet</p>
        <p className="text-xs text-muted-foreground mt-1">Be the first to share your experience</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Review preview cards */}
      {previewReviews.map((review) => (
        <ReviewPreviewCard key={review.id} review={review} />
      ))}

      {/* View all link */}
      {remainingCount > 0 && (
        <Link 
          to={`/place/${placeId}/reviews`}
          className="flex items-center justify-between p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          <span className="text-sm font-medium text-primary">
            View all {reviewCount} reviews
          </span>
          <ChevronRight className="w-4 h-4 text-primary" />
        </Link>
      )}
    </div>
  );
}

interface ReviewPreviewCardProps {
  review: Review;
}

function ReviewPreviewCard({ review }: ReviewPreviewCardProps) {
  const displayName = review.user_display_name || 'Anonymous';
  const medal = review.reviewer_medal || 'none';
  const isTrusted = review.trusted_contributor || false;
  
  // Format relative date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="p-3 bg-card border border-border rounded-lg">
      {/* Reviewer info */}
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium text-sm text-foreground">{displayName}</span>
        {medal !== 'none' && (
          <ReviewerMedalBadge medal={medal} size="sm" />
        )}
        {isTrusted && (
          <TrustedContributorBadge size="sm" />
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {formatDate(review.created_at)}
        </span>
      </div>

      {/* Review text */}
      {review.note_public ? (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {review.note_public}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground/60 italic">
          Shared stamps only
        </p>
      )}
    </div>
  );
}