import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { ReviewHelper } from './ReviewHelper';
import { ReviewPopup } from './ReviewPopup';
import { PlaceStampBadges } from './PlaceStampBadges';
import { useReviews, useMyReview, ReviewSignal, useCreateReview, useUpdateReview } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import { useStamps, FALLBACK_STAMPS } from '@/hooks/useStamps';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type PlaceCategory = Database['public']['Enums']['place_category'];

const TUTORIAL_SEEN_KEY = 'review-tutorial-seen';

interface CompactReviewStripProps {
  placeId: string;
  placeName: string;
  placeCategory?: PlaceCategory;
}

export function CompactReviewStrip({
  placeId,
  placeName,
  placeCategory,
}: CompactReviewStripProps) {
  const navigate = useNavigate();
  const { user, isVerified, loading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { data: reviews, isLoading } = useReviews(placeId);
  const { data: existingReview } = useMyReview(placeId);
  const { data: stamps } = useStamps(placeCategory);
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const hasReviews = reviews && reviews.length > 0;
  const isEditing = !!existingReview;

  // Get stamps to display
  const positiveStamps = stamps?.positive || FALLBACK_STAMPS.positive.map(f => ({
    id: f.id,
    label: f.label,
    icon: f.icon,
    category: 'fallback',
    polarity: 'positive' as const,
    sort_order: 0,
  }));

  const improvementStamps = stamps?.improvement || FALLBACK_STAMPS.improvement.map(f => ({
    id: f.id,
    label: f.label,
    icon: f.icon,
    category: 'fallback',
    polarity: 'improvement' as const,
    sort_order: 0,
  }));

  const neutralStamps = stamps?.neutral || FALLBACK_STAMPS.neutral.map(f => ({
    id: f.id,
    label: f.label,
    icon: f.icon,
    category: 'fallback',
    polarity: 'neutral' as const,
    sort_order: 0,
  }));

  // Parse existing review into initial state
  const getInitialPositive = (): Map<string, number> => {
    if (!existingReview) return new Map();
    const map = new Map<string, number>();
    existingReview.signals.forEach((s: ReviewSignal) => {
      if (s.polarity === 'positive') {
        const stampId = (s as any).stamp_id || s.dimension;
        map.set(stampId, s.level);
      }
    });
    return map;
  };

  const getInitialImprovement = (): Map<string, number> => {
    if (!existingReview) return new Map();
    const map = new Map<string, number>();
    existingReview.signals.forEach((s: ReviewSignal) => {
      if (s.polarity === 'improvement') {
        const stampId = (s as any).stamp_id || s.dimension;
        map.set(stampId, s.level);
      }
    });
    return map;
  };

  const handleLeaveReviewClick = () => {
    const tutorialSeen = localStorage.getItem(TUTORIAL_SEEN_KEY) === 'true';
    const hasCompletedFirstReview = localStorage.getItem('review-first-completed') === 'true';
    
    // Allow anyone to start a review - we'll check auth on submit
    if (!tutorialSeen && !hasCompletedFirstReview) {
      setShowTutorial(true);
    } else {
      setShowReviewPopup(true);
    }
  };

  const handleTutorialStart = () => {
    localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    setShowTutorial(false);
    setShowReviewPopup(true);
  };

  const handleTutorialSkip = () => {
    localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    setShowTutorial(false);
    setShowReviewPopup(true);
  };

  const handleSubmit = async (data: {
    positiveSignals: Map<string, number>;
    improvementSignals: Map<string, number>;
    neutralSignals: Map<string, number>;
    notePublic: string;
    notePrivate: string;
  }) => {
    const { positiveSignals, improvementSignals, neutralSignals, notePublic, notePrivate } = data;

    // Check auth only on submit
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Create an account to post your review. Your selections will be saved!",
      });
      // Store pending review in localStorage so it's not lost
      localStorage.setItem(
        'pending-review',
        JSON.stringify({
          placeId,
          positiveSignals: Array.from(positiveSignals.entries()),
          improvementSignals: Array.from(improvementSignals.entries()),
          notePublic,
          notePrivate,
        })
      );
      // Redirect to auth page using navigate (SPA-friendly)
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    // Prevent RLS failures: backend requires verified users for review inserts/signals
    // Avoid false negatives while auth/profile is still loading.
    if (loading) {
      toast({
        title: "Checking your account…",
        description: "One moment while we confirm your verification status.",
      });
      refreshProfile?.();
      return;
    }

    if (!isVerified) {
      toast({
        title: "Verify your email to post",
        description: "Only verified users can submit or edit reviews.",
        variant: "destructive",
      });
      return;
    }

    const totalStamps = positiveSignals.size + improvementSignals.size + neutralSignals.size;
    if (totalStamps === 0) {
      toast({
        title: "Something needs to stand out",
        description: "Add at least one stamp to submit your review.",
        variant: "destructive",
      });
      return;
    }

    // Build signals array (neutral signals use level 1)
    const signals: ReviewSignal[] = [
      ...Array.from(positiveSignals.entries()).map(([stampId, level]) => ({
        dimension: 'quality' as const,
        polarity: 'positive' as const,
        level,
        stamp_id: stampId,
      })),
      ...Array.from(improvementSignals.entries()).map(([stampId, level]) => ({
        dimension: 'quality' as const,
        polarity: 'improvement' as const,
        level,
        stamp_id: stampId,
      })),
      ...Array.from(neutralSignals.entries()).map(([stampId, level]) => ({
        dimension: 'quality' as const,
        polarity: 'neutral' as const,
        level,
        stamp_id: stampId,
      })),
    ];

    try {
      if (isEditing && existingReview) {
        await updateReview.mutateAsync({
          reviewId: existingReview.id,
          placeId,
          notePublic,
          notePrivate,
          signals,
        });
        toast({
          title: "Review updated",
          description: "Your review has been saved",
        });
      } else {
        await createReview.mutateAsync({
          placeId,
          notePublic,
          notePrivate,
          signals,
        });
        toast({
          title: "Thanks!",
          description: "Your review helps people make better decisions",
        });
      }
      localStorage.setItem('review-first-completed', 'true');
      localStorage.removeItem('pending-review'); // Clear any pending review
      setShowReviewPopup(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save review",
        variant: "destructive",
      });
    }
  };

  const isSubmitting = createReview.isPending || updateReview.isPending;

  return (
    <>
      <ReviewHelper 
        autoShowOnFirstTime={showTutorial}
        onStartReview={handleTutorialStart}
        onSkip={handleTutorialSkip}
      />

      <div className="flex items-center gap-4">
        {/* Stamp badges - max 5 icons */}
        <div className="flex-1 min-w-0">
          {hasReviews ? (
            <PlaceStampBadges placeId={placeId} maxGood={5} maxBad={0} showReviewCount={false} variant="compact" />
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Heart className="w-5 h-5" />
              <span className="text-base font-medium">No reviews yet</span>
            </div>
          )}
        </div>

        {/* Leave a review link - available to everyone */}
        <button
          onClick={handleLeaveReviewClick}
          className="text-base font-semibold text-primary hover:underline whitespace-nowrap flex-shrink-0"
        >
          {isEditing ? 'Edit review' : 'Leave a review'}
        </button>
      </div>

      {/* Review Popup */}
      <ReviewPopup
        open={showReviewPopup}
        onOpenChange={setShowReviewPopup}
        positiveStamps={positiveStamps}
        improvementStamps={improvementStamps}
        neutralStamps={neutralStamps}
        placeName={placeName}
        initialPositive={getInitialPositive()}
        initialImprovement={getInitialImprovement()}
        initialNeutral={new Map()}
        initialNotePublic={existingReview?.note_public || ''}
        initialNotePrivate={existingReview?.note_private || ''}
        isEditing={isEditing}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </>
  );
}
