import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, MousePointerClick, Zap, Send, CheckCircle, XCircle } from 'lucide-react';

interface ReviewHowItWorksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartReview?: () => void;
  onSkip?: () => void;
  viewCount?: number;
  onDontShowAgain?: () => void;
}

const steps = [
  {
    icon: Sparkles,
    title: 'A Better Way to Review',
    body: 'Instead of stars, we focus on what actually stood out — the good and what needs work.',
  },
  {
    icon: MousePointerClick,
    title: 'Pick What Stood Out',
    body: 'Choose up to 5 Good stamps and up to 2 Needs Work stamps.\n\nOnly select what really mattered to you.',
  },
  {
    icon: Zap,
    title: 'Set Strength',
    body: 'Tap a stamp to rate it:\n\nGood → Great → Excellent\n\n(Tap again if it was even better)',
  },
  {
    icon: Send,
    title: 'Almost Done',
    body: 'Comments are optional. When you submit, this place updates instantly for everyone.',
  },
];

export function ReviewHowItWorksModal({
  open,
  onOpenChange,
  onStartReview,
  onSkip,
  viewCount = 0,
  onDontShowAgain,
}: ReviewHowItWorksModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const canDismissPermanently = viewCount >= 4;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStartReview = () => {
    setCurrentStep(0);
    setShowConfirmation(false);
    onStartReview?.();
    onOpenChange(false);
  };

  const handleSkip = () => {
    setCurrentStep(0);
    setShowConfirmation(false);
    onSkip?.();
    onOpenChange(false);
  };

  const handleDontShowAgain = () => {
    setShowConfirmation(true);
  };

  const handleConfirmYes = () => {
    setCurrentStep(0);
    setShowConfirmation(false);
    onDontShowAgain?.();
    onOpenChange(false);
  };

  const handleConfirmNo = () => {
    setShowConfirmation(false);
    setCurrentStep(0);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCurrentStep(0);
      setShowConfirmation(false);
    }
    onOpenChange(newOpen);
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {showConfirmation ? (
          /* Confirmation screen */
          <div className="flex flex-col items-center text-center py-8 px-4 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <CheckCircle className="w-7 h-7 text-primary" />
            </div>

            <h2 className="text-xl font-display font-semibold text-foreground mb-3">
              Quick Check
            </h2>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Do you understand how our stamp-based review system works?
            </p>

            <div className="flex flex-col gap-2 w-full">
              <Button onClick={handleConfirmYes} className="w-full">
                <CheckCircle className="w-4 h-4 mr-2" />
                Yes, I've got it
              </Button>
              <Button 
                variant="outline" 
                onClick={handleConfirmNo} 
                className="w-full"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Show me again
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 pt-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-6 bg-primary'
                      : index < currentStep
                      ? 'w-1.5 bg-primary/50'
                      : 'w-1.5 bg-muted'
                  }`}
                />
              ))}
            </div>

            {/* Step content with animation */}
            <div
              key={currentStep}
              className="flex flex-col items-center text-center py-8 px-4 animate-fade-in"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                <Icon className="w-7 h-7 text-primary" />
              </div>

              <h2 className="text-xl font-display font-semibold text-foreground mb-3">
                {step.title}
              </h2>

              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {step.body}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2">
              {isLastStep ? (
                <>
                  <Button onClick={handleStartReview} className="w-full">
                    Start Review
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="w-full text-muted-foreground"
                  >
                    Skip
                  </Button>
                  {canDismissPermanently && (
                    <Button
                      variant="link"
                      onClick={handleDontShowAgain}
                      className="w-full text-xs text-muted-foreground/70"
                    >
                      Don't show this again
                    </Button>
                  )}
                </>
              ) : (
                <Button onClick={handleNext} className="w-full">
                  Next
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>

            {/* Footnote on last step */}
            {isLastStep && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                You can reopen this guide anytime from the ? icon.
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
