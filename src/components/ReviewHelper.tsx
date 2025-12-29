import React, { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { ReviewHowItWorksModal } from './ReviewHowItWorksModal';

const STORAGE_KEY = 'review-tutorial-dismissed';
const VIEW_COUNT_KEY = 'review-tutorial-view-count';

interface ReviewHelperProps {
  className?: string;
  autoShowOnFirstTime?: boolean;
  onStartReview?: () => void;
  onSkip?: () => void;
}

export function ReviewHelper({ 
  className, 
  autoShowOnFirstTime = false,
  onStartReview,
  onSkip 
}: ReviewHelperProps) {
  const [showModal, setShowModal] = useState(false);
  const [viewCount, setViewCount] = useState(0);

  // Load view count from localStorage
  useEffect(() => {
    const count = parseInt(localStorage.getItem(VIEW_COUNT_KEY) || '0', 10);
    setViewCount(count);
  }, []);

  // Show modal when autoShowOnFirstTime becomes true (if not permanently dismissed)
  useEffect(() => {
    if (autoShowOnFirstTime) {
      const isDismissed = localStorage.getItem(STORAGE_KEY) === 'true';
      if (!isDismissed) {
        setShowModal(true);
        // Increment view count
        const newCount = viewCount + 1;
        setViewCount(newCount);
        localStorage.setItem(VIEW_COUNT_KEY, String(newCount));
      } else {
        // Already dismissed, proceed directly
        onStartReview?.();
      }
    }
  }, [autoShowOnFirstTime]);

  const handleModalClose = (open: boolean) => {
    setShowModal(open);
  };

  const handleStartReview = () => {
    onStartReview?.();
  };

  const handleSkip = () => {
    onSkip?.();
  };

  const handleDontShowAgain = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    onStartReview?.();
  };

  return (
    <ReviewHowItWorksModal
      open={showModal}
      onOpenChange={handleModalClose}
      onStartReview={handleStartReview}
      onSkip={handleSkip}
      viewCount={viewCount}
      onDontShowAgain={handleDontShowAgain}
    />
  );
}

// Small help button to reopen the modal
export function ReviewHelpButton({ className }: { className?: string }) {
  const [showModal, setShowModal] = useState(false);
  const viewCount = parseInt(localStorage.getItem(VIEW_COUNT_KEY) || '0', 10);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={`w-6 h-6 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors ${className}`}
        aria-label="How reviews work"
      >
        <HelpCircle className="w-4 h-4 text-muted-foreground" />
      </button>

      <ReviewHowItWorksModal
        open={showModal}
        onOpenChange={setShowModal}
        viewCount={viewCount}
      />
    </>
  );
}