import React, { useState, useEffect } from 'react';
import { MessageSquareText, MapPin, Heart, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReviewHelper } from './ReviewHelper';
import { PlaceSignalSummary } from './PlaceSignalSummary';
import { ReviewForm } from './ReviewForm';
import { ReviewList } from './ReviewList';
import { ReviewFooterMessage } from './ReviewFooterMessage';
import { useReviews, useMyReview, usePlaceReviewCount } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type PlaceCategory = Database['public']['Enums']['place_category'];

const TUTORIAL_SEEN_KEY = 'review-tutorial-seen';

interface ReviewsSectionProps {
  placeId: string;
  placeName: string;
  placeCategory?: PlaceCategory;
  // Optional location info - will show GPS if not provided
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

const FIRST_REVIEW_CELEBRATION_KEY = 'first-review-celebrated';

export function ReviewsSection({
  placeId,
  placeName,
  placeCategory,
  city,
  state,
  latitude,
  longitude,
}: ReviewsSectionProps) {
  const { user, isVerified } = useAuth();
  const { data: reviews, isLoading } = useReviews(placeId);
  const { data: myReview } = useMyReview(placeId);
  const { data: reviewCount } = usePlaceReviewCount(placeId);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showFirstReviewCelebration, setShowFirstReviewCelebration] = useState(false);
  const [justSubmittedFirst, setJustSubmittedFirst] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const hasReviews = reviews && reviews.length > 0;
  const isFirstReview = !hasReviews && !isLoading;

  // Check if we just submitted the first review
  useEffect(() => {
    if (hasReviews && reviews.length === 1) {
      const celebratedKey = `${FIRST_REVIEW_CELEBRATION_KEY}-${placeId}`;
      const alreadyCelebrated = sessionStorage.getItem(celebratedKey);
      if (!alreadyCelebrated) {
        setShowFirstReviewCelebration(true);
        sessionStorage.setItem(celebratedKey, 'true');
      }
    }
  }, [hasReviews, reviews?.length, placeId]);

  // Format location string
  const getLocationString = () => {
    if (city && state) {
      return `${city}, ${state}`;
    }
    if (state) {
      return state;
    }
    if (latitude && longitude) {
      return `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
    }
    return null;
  };

  const locationString = getLocationString();

  const handleReviewSuccess = () => {
    // Mark that user has completed at least one review ever
    localStorage.setItem('review-first-completed', 'true');
    if (isFirstReview) {
      setJustSubmittedFirst(true);
    }
    setShowReviewForm(false);
  };

  // Handle "Leave a Review" button click - show tutorial only on first ever review
  const handleLeaveReviewClick = () => {
    const tutorialSeen = localStorage.getItem(TUTORIAL_SEEN_KEY) === 'true';
    const hasCompletedFirstReview = localStorage.getItem('review-first-completed') === 'true';
    
    // Only show tutorial if never seen AND never completed a review
    if (!tutorialSeen && !hasCompletedFirstReview) {
      setShowTutorial(true);
    } else {
      // Open review form directly - no intermediate steps
      setShowReviewForm(true);
    }
  };

  // Called when user clicks "Start Review" in tutorial
  const handleTutorialStart = () => {
    localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    setShowTutorial(false);
    setShowReviewForm(true);
  };

  // Called when user clicks "Skip" in tutorial
  const handleTutorialSkip = () => {
    localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    setShowTutorial(false);
    setShowReviewForm(true);
  };

  return (
    <section className="mb-6 animate-fade-in" style={{ animationDelay: '275ms' }}>
      {/* Tutorial Modal - shows on first review click */}
      <ReviewHelper 
        autoShowOnFirstTime={showTutorial}
        onStartReview={handleTutorialStart}
        onSkip={handleTutorialSkip}
      />

      {/* Section Header with Location */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-primary" />
            Reviews
          </h2>
          {reviewCount !== undefined && reviewCount > 0 && (
            <span className="text-base text-muted-foreground">
              {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </span>
          )}
        </div>
        {locationString && (
          <div className="flex items-center gap-1.5 mt-1 text-base text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>
              {placeName} – {locationString}
            </span>
          </div>
        )}
      </div>

      {/* First Review Celebration */}
      {(showFirstReviewCelebration || justSubmittedFirst) && hasReviews && (
        <div className="animate-fade-in flex items-start gap-3 p-4 bg-success/10 border border-success/20 rounded-lg mb-4">
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">First review added!</p>
            <p className="text-sm text-muted-foreground">
              This place now has real community feedback
            </p>
          </div>
        </div>
      )}

      {/* Signal Summary - Known for / Common issues (hide review count since we show it in header) */}
      {hasReviews && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          <PlaceSignalSummary placeId={placeId} showReviewCount={false} />
        </div>
      )}

      {/* Empty State or Review Button */}
      {isFirstReview && !showReviewForm && user && isVerified && (
        <div className="text-center py-8 px-4 bg-secondary/30 border border-dashed border-border rounded-lg mb-4">
          <Heart className="w-10 h-10 mx-auto mb-3 text-primary/60" />
          <h3 className="font-medium text-foreground text-lg mb-1">
            Be the first to share what stood out here
          </h3>
          <p className="text-base text-muted-foreground mb-4">
            Your review helps other travelers make better decisions
          </p>
          <Button onClick={handleLeaveReviewClick} size="lg" className="min-w-[200px] text-base">
            Leave the first review
          </Button>
        </div>
      )}

      {/* Empty state for non-verified or logged out users */}
      {isFirstReview && !showReviewForm && (!user || !isVerified) && (
        <div className="text-center py-8 px-4 bg-secondary/30 border border-dashed border-border rounded-lg mb-4">
          <Heart className="w-10 h-10 mx-auto mb-3 text-muted-foreground/60" />
          <h3 className="font-medium text-foreground text-lg mb-1">
            No reviews yet
          </h3>
          <p className="text-base text-muted-foreground">
            Be the first to share what stood out here
          </p>
        </div>
      )}

      {/* Write/Edit Review Button (when reviews exist) */}
      {hasReviews && user && isVerified && !showReviewForm && (
        <Button
          onClick={handleLeaveReviewClick}
          variant="outline"
          className="w-full mb-4"
        >
          {myReview ? 'Edit Your Review' : 'Write a Review'}
        </Button>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          {/* First review encouragement */}
          {isFirstReview && (
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg mb-4">
              <Heart className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                There's no perfect place — share what stood out for you
              </p>
            </div>
          )}
          <ReviewForm
            placeId={placeId}
            placeName={placeName}
            placeCategory={placeCategory}
            onSuccess={handleReviewSuccess}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      {/* Review List */}
      {hasReviews && (
        <ReviewList
          placeId={placeId}
          onEditReview={() => setShowReviewForm(true)}
        />
      )}

      {/* Footer Message */}
      <ReviewFooterMessage />
    </section>
  );
}