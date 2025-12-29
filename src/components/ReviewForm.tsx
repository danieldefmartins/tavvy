import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ReviewPopup } from './ReviewPopup';
import { PhoneVerificationModal } from './PhoneVerificationModal';
import {
  ReviewSignal,
  useCreateReview,
  useUpdateReview,
  useMyReview,
} from '@/hooks/useReviews';
import { useStamps, FALLBACK_STAMPS } from '@/hooks/useStamps';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Loader2, MessageSquarePlus, Edit2, Shield } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type PlaceCategory = Database['public']['Enums']['place_category'] | undefined;

// Maximum reviews allowed before phone verification is required
const MAX_REVIEWS_BEFORE_PHONE_VERIFICATION = 5;

interface ReviewFormProps {
  placeId: string;
  placeName?: string;
  placeCategory?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ placeId, placeName, placeCategory, onSuccess, onCancel }: ReviewFormProps) {
  const { profile, refreshProfile } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { toast } = useToast();
  const { data: existingReview, isLoading: loadingExisting } = useMyReview(placeId);
  const { data: stamps, isLoading: loadingStamps } = useStamps(placeCategory as any);
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();

  const [showPopup, setShowPopup] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);

  // Check if user needs phone verification to submit a new review
  const needsPhoneVerification = () => {
    // Admins bypass this requirement
    if (isAdmin) return false;
    
    // If already phone verified, no need
    if (profile?.phone_verified) return false;
    
    // If editing an existing review, no need (doesn't count as new review)
    if (existingReview) return false;
    
    // Check review count - if 5 or more, require phone verification
    const reviewCount = profile?.total_reviews_count ?? 0;
    return reviewCount >= MAX_REVIEWS_BEFORE_PHONE_VERIFICATION;
  };

  const handleWriteReviewClick = () => {
    if (needsPhoneVerification()) {
      setShowPhoneVerification(true);
    } else {
      setShowPopup(true);
    }
  };

  const handlePhoneVerified = () => {
    refreshProfile();
    // After verification, open the review popup
    setShowPopup(true);
  };

  // Get stamps to display (fallback if none loaded)
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

  const isEditing = !!existingReview;

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

  if (!profile?.is_verified) {
    return (
      <div className="p-4 bg-muted rounded-lg text-center">
        <p className="text-muted-foreground">Only verified users can write reviews.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Verify your email to unlock this feature.
        </p>
      </div>
    );
  }

  if (loadingExisting || loadingStamps) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = async (data: {
    positiveSignals: Map<string, number>;
    improvementSignals: Map<string, number>;
    neutralSignals: Map<string, number>;
    notePublic: string;
    notePrivate: string;
  }) => {
    const { positiveSignals, improvementSignals, neutralSignals, notePublic, notePrivate } = data;

    const totalStamps = positiveSignals.size + improvementSignals.size + neutralSignals.size;
    if (totalStamps === 0) {
      toast({
        title: "Something needs to stand out",
        description: "Add at least one stamp to submit your review.",
        variant: "destructive",
      });
      return;
    }

    // Build signals array
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
      setShowPopup(false);
      onSuccess?.();
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
      <div className="space-y-4">
        <div className="text-center p-6 bg-muted/50 rounded-lg border border-border/50">
          {isEditing ? (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                You've already reviewed this place.
              </p>
              <Button onClick={() => setShowPopup(true)} variant="outline">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Your Review
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                Share what stood out to help other travelers.
              </p>
              <Button onClick={handleWriteReviewClick}>
                <MessageSquarePlus className="w-4 h-4 mr-2" />
                Write a Review
              </Button>
              {needsPhoneVerification() && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" />
                  Phone verification required
                </p>
              )}
            </>
          )}
        </div>
        
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="w-full">
            Cancel
          </Button>
        )}
      </div>

      <PhoneVerificationModal
        open={showPhoneVerification}
        onOpenChange={setShowPhoneVerification}
        onVerified={handlePhoneVerified}
      />

      <ReviewPopup
        open={showPopup}
        onOpenChange={setShowPopup}
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
