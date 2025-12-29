import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import * as LucideIcons from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StampDefinition } from '@/hooks/useStamps';

interface StampSelectorPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stamps: StampDefinition[];
  polarity: 'positive' | 'improvement';
  selectedStamps: Map<string, number>;
  onSelectStamp: (stamp: StampDefinition, level: number) => void;
  remainingVotes: number;
  maxVotes: number;
}

const LEVEL_LABELS = ['', 'Good', 'Great', 'Excellent'];
const IMPROVEMENT_LABELS = ['', 'Needs Work', 'Could Improve', 'Major Issue'];

export function StampSelectorPopup({
  open,
  onOpenChange,
  stamps,
  polarity,
  selectedStamps,
  onSelectStamp,
  remainingVotes,
  maxVotes,
}: StampSelectorPopupProps) {
  const [activeStamp, setActiveStamp] = useState<StampDefinition | null>(null);
  const [animatingLevel, setAnimatingLevel] = useState<number | null>(null);
  const [showLevelText, setShowLevelText] = useState(false);

  // Reset active stamp when popup opens
  useEffect(() => {
    if (open) {
      // Pre-select first unselected stamp, or first stamp if all selected
      const unselectedStamp = stamps.find(s => !selectedStamps.has(s.id));
      setActiveStamp(unselectedStamp || stamps[0] || null);
    } else {
      setActiveStamp(null);
      setAnimatingLevel(null);
      setShowLevelText(false);
    }
  }, [open, stamps, selectedStamps]);

  const currentLevel = activeStamp ? (selectedStamps.get(activeStamp.id) || 0) : 0;
  const labels = polarity === 'positive' ? LEVEL_LABELS : IMPROVEMENT_LABELS;
  const isLimitReached = remainingVotes <= 0;

  const handleStampTap = () => {
    if (!activeStamp) return;

    const current = selectedStamps.get(activeStamp.id) || 0;
    let newLevel: number;

    if (current === 0) {
      // First tap - check if we have votes
      if (remainingVotes < 1) return;
      newLevel = 1;
    } else if (current < 3) {
      // Check if we can add another vote
      if (remainingVotes < 1) {
        // Can't increase, but don't remove - just show limit message
        return;
      } else {
        newLevel = current + 1;
      }
    } else {
      // At level 3, remove the stamp
      newLevel = 0;
    }

    // Animate level text
    setAnimatingLevel(newLevel);
    setShowLevelText(true);
    
    onSelectStamp(activeStamp, newLevel);

    // Auto-close after selection with slight delay for feedback
    if (newLevel > 0) {
      setTimeout(() => {
        onOpenChange(false);
      }, 500);
    }

    // Reset animation after delay
    setTimeout(() => {
      setShowLevelText(false);
      setAnimatingLevel(null);
    }, 450);
  };

  const getActiveIcon = () => {
    if (!activeStamp?.icon) return LucideIcons.Circle;
    return (LucideIcons as any)[activeStamp.icon] || LucideIcons.Circle;
  };

  const ActiveIcon = getActiveIcon();

  const renderStrengthDots = (level: number) => {
    return (
      <div className="flex gap-2 justify-center">
        {[1, 2, 3].map((dot) => (
          <div
            key={dot}
            className={cn(
              'w-3.5 h-3.5 rounded-full transition-all duration-300',
              dot <= level
                ? polarity === 'positive'
                  ? 'bg-primary scale-125'
                  : level === 3
                  ? 'bg-[hsl(var(--signal-negative))] scale-125'
                  : 'bg-[hsl(var(--signal-neutral))] scale-125'
                : 'bg-muted-foreground/30'
            )}
          />
        ))}
      </div>
    );
  };

  const getActiveStyles = () => {
    if (currentLevel === 0) {
      return polarity === 'positive'
        ? 'bg-primary/10 text-primary border-primary/30'
        : 'bg-[hsl(var(--signal-neutral))]/10 text-[hsl(var(--signal-neutral))] border-[hsl(var(--signal-neutral))]/30';
    }

    if (polarity === 'positive') {
      switch (currentLevel) {
        case 1:
          return 'bg-primary/20 text-primary border-primary/50';
        case 2:
          return 'bg-primary/40 text-primary border-primary ring-2 ring-primary/40';
        case 3:
          return 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/60 shadow-lg shadow-primary/30';
        default:
          return 'bg-primary/10 text-primary border-primary/30';
      }
    } else {
      switch (currentLevel) {
        case 1:
          return 'bg-[hsl(var(--signal-neutral))]/20 text-[hsl(var(--signal-neutral))] border-[hsl(var(--signal-neutral))]/50';
        case 2:
          return 'bg-[hsl(var(--signal-neutral))]/40 text-[hsl(var(--signal-neutral))] border-[hsl(var(--signal-neutral))] ring-2 ring-[hsl(var(--signal-neutral))]/40';
        case 3:
          return 'bg-[hsl(var(--signal-negative))] text-white border-[hsl(var(--signal-negative))] ring-2 ring-[hsl(var(--signal-negative))]/40 shadow-lg shadow-[hsl(var(--signal-negative))]/30';
        default:
          return 'bg-[hsl(var(--signal-neutral))]/10 text-[hsl(var(--signal-neutral))] border-[hsl(var(--signal-neutral))]/30';
      }
    }
  };

  // Check if a stamp can be selected (not already selected and has remaining votes)
  const canSelectStamp = (stamp: StampDefinition) => {
    const isSelected = selectedStamps.has(stamp.id);
    return isSelected || remainingVotes > 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-sm mx-auto p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-center text-base font-semibold">
            {polarity === 'positive' ? 'What stood out?' : 'What needs improvement?'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-4 space-y-3">
          {/* Large Active Stamp Preview - Centered */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleStampTap}
              disabled={!activeStamp || (currentLevel === 0 && isLimitReached)}
              className={cn(
                'w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300',
                'hover:scale-105 active:scale-95',
                getActiveStyles(),
                animatingLevel !== null && 'scale-110',
                (!activeStamp || (currentLevel === 0 && isLimitReached)) &&
                  'opacity-50 cursor-not-allowed'
              )}
            >
              <ActiveIcon size={28} />
            </button>

            {/* Stamp Label & Level */}
            <div className="text-center">
              <p className="text-sm font-semibold">
                {activeStamp?.label || 'Select a stamp'}
              </p>

              {/* Level Text */}
              <div className="h-5 flex items-center justify-center">
                {showLevelText && animatingLevel !== null && animatingLevel > 0 ? (
                  <p
                    className={cn(
                      'text-sm font-bold transition-all duration-300',
                        polarity === 'positive'
                        ? 'text-primary'
                        : animatingLevel === 3
                        ? 'text-[hsl(var(--signal-negative))]'
                        : 'text-[hsl(var(--signal-neutral))]'
                    )}
                  >
                    {labels[animatingLevel]}
                  </p>
                ) : currentLevel > 0 ? (
                  <p
                    className={cn(
                      'text-xs font-medium',
                        polarity === 'positive'
                        ? 'text-primary'
                        : currentLevel === 3
                        ? 'text-[hsl(var(--signal-negative))]'
                        : 'text-[hsl(var(--signal-neutral))]'
                    )}
                  >
                    {labels[currentLevel]}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Tap to select</p>
                )}
              </div>

              {/* Strength Dots */}
              {renderStrengthDots(currentLevel)}
            </div>
          </div>

          {/* Limit Reached Warning */}
          {isLimitReached && currentLevel === 0 && (
            <div className="flex items-center gap-2 py-1.5 px-2.5 bg-[hsl(var(--signal-neutral))]/10 rounded-lg border border-[hsl(var(--signal-neutral))]/20">
              <AlertCircle className="w-3.5 h-3.5 text-[hsl(var(--signal-neutral))] flex-shrink-0" />
              <p className="text-xs text-[hsl(var(--signal-neutral-text))]">Max reached for this review.</p>
            </div>
          )}

          {/* Horizontal Scrollable Stamp List */}
          <div className="border-t border-border pt-2">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-1.5 py-1">
                {stamps.map((stamp) => {
                  const IconComponent = stamp.icon
                    ? (LucideIcons as any)[stamp.icon] || LucideIcons.Circle
                    : LucideIcons.Circle;
                  const stampLevel = selectedStamps.get(stamp.id) || 0;
                  const isActive = activeStamp?.id === stamp.id;
                  const isDisabled = !canSelectStamp(stamp);

                  return (
                    <button
                      key={stamp.id}
                      onClick={() => setActiveStamp(stamp)}
                      disabled={isDisabled}
                      className={cn(
                        'flex flex-col items-center gap-0.5 p-1 rounded-lg transition-all duration-200 flex-shrink-0',
                        'hover:bg-muted/50',
                        isActive && 'bg-muted ring-2 ring-primary/50',
                        stampLevel > 0 && !isActive && 'opacity-80',
                        isDisabled && 'opacity-30 cursor-not-allowed'
                      )}
                    >
                      <div
                        className={cn(
                          'w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all',
                          stampLevel > 0
                            ? polarity === 'positive'
                              ? 'bg-primary/20 text-primary border-primary/50'
                              : 'bg-[hsl(var(--signal-neutral))]/20 text-[hsl(var(--signal-neutral))] border-[hsl(var(--signal-neutral))]/50'
                            : 'bg-muted text-muted-foreground border-border'
                        )}
                      >
                        <IconComponent size={16} />
                      </div>
                      <span className="text-[9px] text-center w-10 truncate leading-tight">
                        {stamp.label}
                      </span>
                      {stampLevel > 0 && (
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map((dot) => (
                            <div
                              key={dot}
                              className={cn(
                                'w-1 h-1 rounded-full',
                                dot <= stampLevel
                                  ? polarity === 'positive'
                                    ? 'bg-primary'
                                    : 'bg-[hsl(var(--signal-neutral))]'
                                  : 'bg-muted-foreground/30'
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Instructions - Compact */}
          <div className="text-center pt-1 border-t border-border">
            <p className="text-[10px] text-muted-foreground">
              1× Good • 2× Great • 3× Excellent · {remainingVotes}/{maxVotes} left
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
