import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import * as LucideIcons from 'lucide-react';
import { ArrowLeft, ArrowRight, Check, Loader2, ChevronLeft, ChevronRight, HelpCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic, hapticLight, hapticMedium } from '@/lib/haptics';
import type { StampDefinition } from '@/hooks/useStamps';
import { NotesStep } from '@/components/review/NotesStep';
import { SummaryStep } from '@/components/review/SummaryStep';

// Step definitions
type ReviewStep = 'intro' | 'good' | 'improvement' | 'neutral' | 'notes' | 'confirm';

interface ReviewPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  positiveStamps: StampDefinition[];
  improvementStamps: StampDefinition[];
  neutralStamps: StampDefinition[];
  placeName?: string;
  initialPositive?: Map<string, number>;
  initialImprovement?: Map<string, number>;
  initialNeutral?: Map<string, number>;
  initialNotePublic?: string;
  initialNotePrivate?: string;
  isEditing?: boolean;
  isSubmitting?: boolean;
  onSubmit: (data: {
    positiveSignals: Map<string, number>;
    improvementSignals: Map<string, number>;
    neutralSignals: Map<string, number>;
    notePublic: string;
    notePrivate: string;
  }) => void;
}

const LEVEL_LABELS = ['', 'Good', 'Great', 'Excellent'];
const IMPROVEMENT_LABELS = ['', 'Needs Work', 'Needs More', 'Major Issue'];
const NEUTRAL_LABELS = ['', '×1', '×2', '×3']; // Same tap mechanic as positive/negative

// Onboarding key for localStorage
const ONBOARDING_KEY = 'review_onboarding_seen';

export function ReviewPopup({
  open,
  onOpenChange,
  positiveStamps,
  improvementStamps,
  neutralStamps,
  placeName,
  initialPositive,
  initialImprovement,
  initialNeutral,
  initialNotePublic = '',
  initialNotePrivate = '',
  isEditing = false,
  isSubmitting = false,
  onSubmit,
}: ReviewPopupProps) {
  const [step, setStep] = useState<ReviewStep>('intro');
  const [positiveSignals, setPositiveSignals] = useState<Map<string, number>>(new Map());
  const [improvementSignals, setImprovementSignals] = useState<Map<string, number>>(new Map());
  const [neutralSignals, setNeutralSignals] = useState<Map<string, number>>(new Map());
  const [notePublic, setNotePublic] = useState('');
  const [notePrivate, setNotePrivate] = useState('');
  const [activeStamp, setActiveStamp] = useState<StampDefinition | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Animation states
  const [flashLevel, setFlashLevel] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [popText, setPopText] = useState<string | null>(null);

  // Scroll indicators
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position - always show right indicator initially if content overflows
  const updateScrollIndicators = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 5);
    // Show right scroll indicator if there's more content to scroll
    setCanScrollRight(scrollWidth > clientWidth && scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    updateScrollIndicators();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollIndicators);
      return () => container.removeEventListener('scroll', updateScrollIndicators);
    }
  }, [step, positiveStamps, improvementStamps, neutralStamps]);

  // Check if onboarding was seen
  useEffect(() => {
    if (open) {
      const seen = localStorage.getItem(ONBOARDING_KEY);
      if (!seen && !isEditing) {
        setShowOnboarding(true);
      }
    }
  }, [open, isEditing]);

  // Initialize state when popup opens
  useEffect(() => {
    if (open) {
      setPositiveSignals(initialPositive || new Map());
      setImprovementSignals(initialImprovement || new Map());
      setNeutralSignals(initialNeutral || new Map());
      setNotePublic(initialNotePublic);
      setNotePrivate(initialNotePrivate);
      
      // Check onboarding
      const seen = localStorage.getItem(ONBOARDING_KEY);
      if (seen || isEditing) {
        setStep('good');
      } else {
        setStep('intro');
      }
      
      setActiveStamp(null);
      setFlashLevel(null);
      setShowFlash(false);
      setPopText(null);
    }
  }, [open, initialPositive, initialImprovement, initialNeutral, initialNotePublic, initialNotePrivate, isEditing]);

  // Set initial active stamp when step changes
  useEffect(() => {
    if (step === 'good' && positiveStamps.length > 0) {
      const firstSelected = positiveStamps.find((s) => positiveSignals.has(s.id));
      const unselected = positiveStamps.find((s) => !positiveSignals.has(s.id));
      setActiveStamp(firstSelected || unselected || positiveStamps[0]);
    } else if (step === 'improvement' && improvementStamps.length > 0) {
      const firstSelected = improvementStamps.find((s) => improvementSignals.has(s.id));
      const unselected = improvementStamps.find((s) => !improvementSignals.has(s.id));
      setActiveStamp(firstSelected || unselected || improvementStamps[0]);
    } else if (step === 'neutral' && neutralStamps.length > 0) {
      const firstSelected = neutralStamps.find((s) => neutralSignals.has(s.id));
      const unselected = neutralStamps.find((s) => !neutralSignals.has(s.id));
      setActiveStamp(firstSelected || unselected || neutralStamps[0]);
    } else {
      setActiveStamp(null);
    }
    // Reset scroll position
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
    setTimeout(updateScrollIndicators, 100);
  }, [step, positiveStamps, improvementStamps, neutralStamps]);

  // *** CRITICAL FIX: Count DISTINCT stamps, NOT intensity ***
  const stampsSelectedPositive = positiveSignals.size;
  const stampsSelectedImprovement = improvementSignals.size;
  const remainingPositiveSlots = 5 - stampsSelectedPositive;
  const remainingImprovementSlots = 2 - stampsSelectedImprovement;

  // Handle tapping on a stamp in the carousel
  const handleCarouselStampTap = (stamp: StampDefinition) => {
    const isPositive = step === 'good';
    const isNeutral = step === 'neutral';
    
    if (isNeutral) {
      // Neutral stamps use SAME tap mechanic as positive/negative (×1/×2/×3)
      const current = neutralSignals.get(stamp.id) || 0;
      const newMap = new Map(neutralSignals);
      let newLevel: number;
      
      if (current === 0) {
        newLevel = 1;
      } else if (current < 3) {
        newLevel = current + 1;
      } else {
        newLevel = 0;
      }
      
      if (newLevel === 0) {
        newMap.delete(stamp.id);
        hapticLight();
      } else {
        newMap.set(stamp.id, newLevel);
        hapticMedium();
        setShowFlash(true);
        setPopText(NEUTRAL_LABELS[newLevel]);
        window.setTimeout(() => {
          setShowFlash(false);
          setPopText(null);
        }, 500);
      }
      setNeutralSignals(newMap);
      setActiveStamp(stamp);
      return;
    }
    
    const signals = isPositive ? positiveSignals : improvementSignals;
    const setSignals = isPositive ? setPositiveSignals : setImprovementSignals;
    const remainingSlots = isPositive ? remainingPositiveSlots : remainingImprovementSlots;
    const labels = isPositive ? LEVEL_LABELS : IMPROVEMENT_LABELS;

    const current = signals.get(stamp.id) || 0;
    let newLevel: number;

    if (current === 0) {
      // First tap: select with level 1 (uses 1 stamp slot)
      if (remainingSlots < 1) {
        haptic('heavy');
        return;
      }
      newLevel = 1;
    } else if (current < 3) {
      // Already selected, increase intensity (does NOT use another slot)
      newLevel = current + 1;
    } else {
      // At max (3), deselect completely
      newLevel = 0;
    }

    const newMap = new Map(signals);
    if (newLevel === 0) {
      newMap.delete(stamp.id);
    } else {
      newMap.set(stamp.id, newLevel);
    }
    setSignals(newMap);

    // Always keep this stamp active
    setActiveStamp(stamp);

    // Visual + haptic feedback
    if (newLevel > 0) {
      hapticMedium();
      setFlashLevel(newLevel);
      setShowFlash(true);
      setPopText(labels[newLevel]);
      
      window.setTimeout(() => {
        setShowFlash(false);
        setPopText(null);
      }, 500);
      window.setTimeout(() => setFlashLevel(null), 550);
    } else {
      hapticLight();
    }
  };

  // Handle tapping the main active stamp icon (increase intensity)
  const handleMainStampTap = () => {
    if (!activeStamp) return;
    handleCarouselStampTap(activeStamp);
  };

  // Handle removing a stamp (long press or X button)
  const handleRemoveStamp = (stampId: string, isPositive: boolean) => {
    hapticLight();
    if (isPositive) {
      const newMap = new Map(positiveSignals);
      newMap.delete(stampId);
      setPositiveSignals(newMap);
      // Update active stamp if needed
      if (activeStamp?.id === stampId && positiveStamps.length > 0) {
        const nextActive = positiveStamps.find(s => newMap.has(s.id)) || positiveStamps[0];
        setActiveStamp(nextActive);
      }
    } else {
      const newMap = new Map(improvementSignals);
      newMap.delete(stampId);
      setImprovementSignals(newMap);
      if (activeStamp?.id === stampId && improvementStamps.length > 0) {
        const nextActive = improvementStamps.find(s => newMap.has(s.id)) || improvementStamps[0];
        setActiveStamp(nextActive);
      }
    }
  };

  const dismissOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
    setStep('good');
  };

  const getStepTitle = () => {
    switch (step) {
      case 'intro': return 'A Better Way to Review';
      case 'good': return 'What Stood Out?';
      case 'improvement': return "What Didn't Go Well?";
      case 'neutral': return 'How This Place Feels';
      case 'notes': return 'Add a Note';
      case 'confirm': return 'Ready to Submit';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'good': return 'Tap stamps that stood out';
      case 'improvement': return 'Tap issues you experienced';
      case 'neutral': return 'This does NOT affect quality. It describes the vibe.';
      default: return null;
    }
  };

  const canGoNext = () => {
    switch (step) {
      case 'intro': return true;
      case 'good': return true;
      case 'improvement': return true;
      case 'neutral': return true;
      case 'notes': return true;
      case 'confirm': return positiveSignals.size + improvementSignals.size + neutralSignals.size > 0;
    }
  };

  const goNext = () => {
    switch (step) {
      case 'intro':
        localStorage.setItem(ONBOARDING_KEY, 'true');
        setStep('good');
        break;
      case 'good': setStep('improvement'); break;
      case 'improvement': setStep('neutral'); break;
      case 'neutral': setStep('notes'); break;
      case 'notes': setStep('confirm'); break;
      case 'confirm':
        onSubmit({ positiveSignals, improvementSignals, neutralSignals, notePublic, notePrivate });
        break;
    }
  };

  const goBack = () => {
    switch (step) {
      case 'good': setStep('intro'); break;
      case 'improvement': setStep('good'); break;
      case 'neutral': setStep('improvement'); break;
      case 'notes': setStep('neutral'); break;
      case 'confirm': setStep('notes'); break;
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = 180;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const getActiveIcon = () => {
    if (!activeStamp?.icon) return LucideIcons.Circle;
    return (LucideIcons as any)[activeStamp.icon] || LucideIcons.Circle;
  };

  const ActiveIcon = getActiveIcon();

  const isPositive = step === 'good';
  const isNeutralStep = step === 'neutral';
  const stamps = isNeutralStep ? neutralStamps : isPositive ? positiveStamps : improvementStamps;
  const signals = isNeutralStep ? neutralSignals : isPositive ? positiveSignals : improvementSignals;
  const remainingSlots = isNeutralStep ? Infinity : isPositive ? remainingPositiveSlots : remainingImprovementSlots;
  const maxSlots = isNeutralStep ? stamps.length : isPositive ? 5 : 2;
  const labels = isNeutralStep ? NEUTRAL_LABELS : isPositive ? LEVEL_LABELS : IMPROVEMENT_LABELS;
  const currentLevel = activeStamp ? (signals.get(activeStamp.id) || 0) : 0;
  const stampCount = signals.size;

  const getActiveStyles = () => {
    if (currentLevel === 0) {
      if (isNeutralStep) {
        return 'bg-stone-500/10 text-stone-600 border-stone-500/30 dark:text-stone-400';
      }
      return isPositive
        ? 'bg-primary/10 text-primary border-primary/30'
        : 'bg-amber-500/10 text-amber-500 border-amber-500/30';
    }
    if (isNeutralStep) {
      // Neutral uses muted gold/stone colors - same 3-level intensity
      switch (currentLevel) {
        case 1: return 'bg-stone-500/20 text-stone-600 border-stone-500/50 shadow-lg shadow-stone-500/20 dark:text-stone-300';
        case 2: return 'bg-stone-500/40 text-stone-700 border-stone-500 ring-4 ring-stone-500/30 shadow-xl shadow-stone-500/30 dark:text-stone-200';
        case 3: return 'bg-stone-600 text-white border-stone-600 ring-4 ring-stone-500/50 shadow-2xl shadow-stone-600/40';
        default: return 'bg-stone-500/10 text-stone-600 border-stone-500/30 dark:text-stone-400';
      }
    }
    if (isPositive) {
      switch (currentLevel) {
        case 1: return 'bg-primary/20 text-primary border-primary/50 shadow-lg shadow-primary/20';
        case 2: return 'bg-primary/40 text-primary border-primary ring-4 ring-primary/30 shadow-xl shadow-primary/30';
        case 3: return 'bg-primary text-primary-foreground border-primary ring-4 ring-primary/50 shadow-2xl shadow-primary/40';
        default: return 'bg-primary/10 text-primary border-primary/30';
      }
    } else {
      switch (currentLevel) {
        case 1: return 'bg-[hsl(var(--signal-neutral))]/20 text-[hsl(var(--signal-neutral))] border-[hsl(var(--signal-neutral))]/50 shadow-lg shadow-[hsl(var(--signal-neutral))]/20';
        case 2: return 'bg-[hsl(var(--signal-neutral))]/40 text-[hsl(var(--signal-neutral))] border-[hsl(var(--signal-neutral))] ring-4 ring-[hsl(var(--signal-neutral))]/30 shadow-xl shadow-[hsl(var(--signal-neutral))]/30';
        case 3: return 'bg-[hsl(var(--signal-negative))] text-white border-[hsl(var(--signal-negative))] ring-4 ring-[hsl(var(--signal-negative))]/40 shadow-2xl shadow-[hsl(var(--signal-negative))]/40';
        default: return 'bg-[hsl(var(--signal-neutral))]/10 text-[hsl(var(--signal-neutral))] border-[hsl(var(--signal-neutral))]/30';
      }
    }
  };

  const renderDots = (level: number, polarity: 'positive' | 'improvement' | 'neutral') => {
    // All polarities use 3 dots now
    return (
      <div className="flex gap-2 justify-center">
        {[1, 2, 3].map((dot) => (
          <div
            key={dot}
            className={cn(
              'w-3 h-3 rounded-full transition-all duration-300',
              dot <= level
                ? polarity === 'positive'
                  ? 'bg-primary scale-110'
                  : polarity === 'neutral'
                    ? 'bg-[hsl(var(--signal-neutral))] scale-110'
                    : level === 3 ? 'bg-[hsl(var(--signal-negative))] scale-110' : 'bg-[hsl(var(--signal-neutral))] scale-110'
                : 'bg-muted-foreground/25'
            )}
          />
        ))}
      </div>
    );
  };

  const renderSelectedStamps = (
    stampMap: Map<string, number>,
    stampList: StampDefinition[],
    polarity: 'positive' | 'improvement' | 'neutral'
  ) => {
    if (stampMap.size === 0) return null;
    return (
      <div className="flex flex-wrap gap-4 justify-center">
        {Array.from(stampMap.entries()).map(([id, level]) => {
          const stamp = stampList.find((s) => s.id === id);
          if (!stamp) return null;
          const Icon = stamp.icon
            ? (LucideIcons as any)[stamp.icon] || LucideIcons.Circle
            : LucideIcons.Circle;

          return (
            <div key={id} className="flex flex-col items-center gap-1.5 w-24">
              <div
                className={cn(
                  'w-14 h-14 rounded-full border-2 flex items-center justify-center',
                  polarity === 'positive'
                    ? 'bg-primary/20 text-primary border-primary/50'
                    : 'bg-amber-500/20 text-amber-500 border-amber-500/50'
                )}
              >
                <Icon size={24} />
              </div>
              <span className="text-sm text-center leading-tight font-medium">
                {stamp.label}
              </span>
              {renderDots(level, polarity)}
            </div>
          );
        })}
      </div>
    );
  };

  // Track if user has made their first tap (for hint visibility)
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Update hasInteracted when any signal is added
  useEffect(() => {
    if (positiveSignals.size > 0 || improvementSignals.size > 0 || neutralSignals.size > 0) {
      setHasInteracted(true);
    }
  }, [positiveSignals.size, improvementSignals.size, neutralSignals.size]);

  // Grid stamp card component (2-column design from mockup)
  const renderGridStamp = (stamp: StampDefinition, polarity: 'positive' | 'improvement' | 'neutral') => {
    const Icon = stamp.icon
      ? (LucideIcons as any)[stamp.icon] || LucideIcons.Circle
      : LucideIcons.Circle;
    
    const signalMap = polarity === 'positive' ? positiveSignals : polarity === 'neutral' ? neutralSignals : improvementSignals;
    const setSignalMap = polarity === 'positive' ? setPositiveSignals : polarity === 'neutral' ? setNeutralSignals : setImprovementSignals;
    const level = signalMap.get(stamp.id) || 0;
    const isSelected = level > 0;
    
    const maxStamps = polarity === 'positive' ? 5 : polarity === 'neutral' ? 99 : 2;
    const currentCount = signalMap.size;
    const canAdd = currentCount < maxStamps || isSelected;
    
    const handleTap = () => {
      let newLevel: number;
      if (level === 0) {
        if (!canAdd) {
          haptic('heavy');
          return;
        }
        newLevel = 1;
      } else if (level < 3) {
        newLevel = level + 1;
      } else {
        newLevel = 0;
      }
      
      const newMap = new Map(signalMap);
      if (newLevel === 0) {
        newMap.delete(stamp.id);
        hapticLight();
      } else {
        newMap.set(stamp.id, newLevel);
        hapticMedium();
      }
      setSignalMap(newMap);
    };
    
    // Get the active color based on polarity
    const getActiveColor = () => {
      if (polarity === 'positive') return 'hsl(var(--signal-positive))';
      if (polarity === 'neutral') return 'hsl(var(--signal-neutral))';
      return 'hsl(var(--signal-negative))';
    };
    
    // Render fire emojis for strength
    const renderStrength = () => {
      if (!isSelected) return null;
      return (
        <div className="mt-1.5 text-base">
          {'🔥'.repeat(level)}
        </div>
      );
    };
    
    return (
      <button
        key={stamp.id}
        onClick={handleTap}
        disabled={!canAdd && !isSelected}
        className={cn(
          'relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 active:scale-95 h-32',
          isSelected ? 'shadow-lg' : 'shadow-sm hover:shadow-md',
          !canAdd && !isSelected && 'opacity-40 cursor-not-allowed'
        )}
        style={{
          backgroundColor: isSelected ? getActiveColor() : '#F3F4F6',
          borderWidth: isSelected ? '3px' : '2px',
          borderColor: isSelected ? getActiveColor() : '#E5E7EB',
          borderStyle: 'solid',
        }}
      >
        {/* Checkmark for selected */}
        {isSelected && (
          <div 
            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center"
          >
            <LucideIcons.Check 
              className="w-3 h-3" 
              style={{ color: getActiveColor() }}
            />
          </div>
        )}
        
        {/* Icon */}
        <div className={cn(
          'w-10 h-10 flex items-center justify-center mb-1',
          isSelected ? 'text-white' : 'text-gray-500'
        )}>
          <Icon size={28} strokeWidth={2} />
        </div>
        
        {/* Label */}
        <span className={cn(
          'text-sm font-semibold text-center leading-tight',
          isSelected ? 'text-white' : 'text-gray-700'
        )}>
          {stamp.label}
        </span>
        
        {/* Strength indicator (fire emojis) */}
        {renderStrength()}
      </button>
    );
  };

  // Render selected stamps summary for confirm step - pill/badge style
  const renderSelectedStampsSummary = (
    stampMap: Map<string, number>,
    stampList: StampDefinition[],
    polarity: 'positive' | 'improvement' | 'neutral'
  ) => {
    if (stampMap.size === 0) return null;
    
    // Get the background color based on polarity
    const getBgColor = () => {
      if (polarity === 'positive') return 'bg-[hsl(var(--signal-positive))]';
      if (polarity === 'neutral') return 'bg-[hsl(var(--signal-neutral))]';
      return 'bg-[hsl(var(--signal-negative))]';
    };

    return (
      <div className="grid grid-cols-2 gap-2.5">
        {Array.from(stampMap.entries()).map(([id, level]) => {
          const stamp = stampList.find((s) => s.id === id);
          if (!stamp) return null;
          const Icon = stamp.icon
            ? (LucideIcons as any)[stamp.icon] || LucideIcons.Circle
            : LucideIcons.Circle;

          return (
            <div
              key={id}
              className={cn(
                'w-full inline-flex items-center justify-between gap-2 px-3 py-2 rounded-full text-sm font-semibold text-white',
                getBgColor(),
              )}
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <Icon size={16} />
                <span className="truncate">{stamp.label}</span>
              </span>

              <div className="flex gap-1 ml-2 flex-shrink-0">
                {[1, 2, 3].map((d) => (
                  <div
                    key={d}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      d <= level ? 'bg-white/90' : 'bg-white/30',
                    )}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto p-0 overflow-hidden gap-0 flex flex-col max-h-[92vh]">
        {/* Compact Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background">
          <div className="w-8 flex items-center">
            {step !== 'intro' && (
              <button onClick={goBack} className="p-1.5 -m-1 rounded-lg hover:bg-muted transition-colors">
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="flex-1 text-center">
            <h2 className="text-base font-semibold">{getStepTitle()}</h2>
          </div>
          <div className="w-8 flex items-center justify-end">
            {(step === 'good' || step === 'improvement' || step === 'neutral') && (
              <button 
                onClick={() => setShowOnboarding(true)}
                className="p-1.5 -m-1 rounded-lg hover:bg-muted transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* INTRO STEP */}
          {step === 'intro' && (
            <div className="p-5 text-center space-y-5">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Instead of stars, focus on what actually matters.
              </p>
              <div className="space-y-4 text-left bg-muted/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                  <div>
                    <p className="font-semibold text-foreground">Tap what stood out</p>
                    <p className="text-sm text-muted-foreground">Up to 5 positives, 2 improvements</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                  <div>
                    <p className="font-semibold text-foreground">Set strength</p>
                    <p className="text-sm text-muted-foreground">Tap again: ● → ●● → ●●●</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                  <div>
                    <p className="font-semibold text-foreground">Done!</p>
                    <p className="text-sm text-muted-foreground">Optional notes, then submit</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* POSITIVE STEP - Grid of stamps */}
          {step === 'good' && (
            <div className="p-4 space-y-3">
              {/* Section header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <LucideIcons.ThumbsUp className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="font-semibold text-sm">What Stood Out</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {positiveSignals.size}/5 selected
                </span>
              </div>
              
              {/* First-time hint */}
              {!hasInteracted && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                  <LucideIcons.Hand className="w-4 h-4" />
                  <span>Tap to select • Tap again to increase strength</span>
                </div>
              )}
              
              {/* Stamp grid - 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                {positiveStamps.map((stamp) => renderGridStamp(stamp, 'positive'))}
              </div>
            </div>
          )}

          {/* IMPROVEMENT STEP - Grid of stamps */}
          {step === 'improvement' && (
            <div className="p-4 space-y-3">
              {/* Section header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <LucideIcons.AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <span className="font-semibold text-sm">What Didn't Go Well</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {improvementSignals.size}/2 selected
                </span>
              </div>
              
              <p className="text-xs text-muted-foreground">Optional — skip if nothing to report</p>
              
              {/* Stamp grid - 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                {improvementStamps.map((stamp) => renderGridStamp(stamp, 'improvement'))}
              </div>
            </div>
          )}

          {/* NEUTRAL STEP - Grid of stamps */}
          {step === 'neutral' && (
            <div className="p-4 space-y-3">
              {/* Section header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-stone-500/20 flex items-center justify-center">
                    <LucideIcons.Sparkles className="w-3.5 h-3.5 text-stone-500" />
                  </div>
                  <span className="font-semibold text-sm">How It Feels</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {neutralSignals.size} selected
                </span>
              </div>
              
              <p className="text-xs text-stone-600 dark:text-stone-400 bg-stone-500/10 rounded-lg px-3 py-2">
                Style & vibe only — does NOT affect quality score
              </p>
              
              {/* Stamp grid - 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                {neutralStamps.map((stamp) => renderGridStamp(stamp, 'neutral'))}
              </div>
            </div>
          )}

          {/* NOTES STEP - Modern Design */}
          {step === 'notes' && (
            <NotesStep
              notePublic={notePublic}
              notePrivate={notePrivate}
              onNotePublicChange={setNotePublic}
              onNotePrivateChange={setNotePrivate}
              onSkip={goNext}
            />
          )}

          {/* CONFIRM STEP - Celebratory Summary */}
          {step === 'confirm' && (
            <SummaryStep
              positiveSignals={positiveSignals}
              improvementSignals={improvementSignals}
              neutralSignals={neutralSignals}
              positiveStamps={positiveStamps}
              improvementStamps={improvementStamps}
              neutralStamps={neutralStamps}
              notePublic={notePublic}
              notePrivate={notePrivate}
              onEditNote={() => setStep('notes')}
            />
          )}
        </div>

        {/* Sticky Footer */}
        <div className="px-4 py-3 border-t border-border bg-background space-y-2">
          {step === 'confirm' ? (
            <div className="space-y-2">
              {/* Go Back button */}
              <button
                onClick={goBack}
                className="w-full text-sm text-muted-foreground hover:text-foreground py-2 flex items-center justify-center gap-1 transition-colors active:scale-[0.98]"
              >
                <LucideIcons.ArrowLeft className="w-4 h-4" />
                Go Back to Edit
              </button>
              
              {/* Submit button with glow effect */}
              <Button 
                onClick={goNext} 
                disabled={!canGoNext() || isSubmitting} 
                className="w-full h-14 text-base font-semibold bg-[#008fc0] hover:bg-[#007aad] active:scale-[0.98] transition-all shadow-lg shadow-[#008fc0]/30"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Check className="w-5 h-5 mr-2" />
                )}
                {isEditing ? 'Update Review' : 'Submit Review'}
              </Button>
              
              {/* Micro-copy */}
              <p className="text-xs text-muted-foreground text-center pt-1">
                Your review helps travelers make better decisions
              </p>
            </div>
          ) : step === 'notes' ? (
            <>
              <Button onClick={goNext} className="w-full h-11 text-sm font-semibold bg-[#008fc0] hover:bg-[#007aad] active:scale-[0.98] transition-all">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <button
                onClick={goNext}
                className="w-full text-sm text-muted-foreground hover:text-foreground py-2 transition-colors active:scale-[0.98]"
              >
                Skip this step
              </button>
            </>
          ) : (
            <Button onClick={goNext} disabled={!canGoNext()} className="w-full h-11 text-sm font-semibold">
              {step === 'intro' ? "Let's Go" : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Help Overlay */}
        {showOnboarding && step !== 'intro' && (
          <div className="absolute inset-0 bg-background/95 z-50 flex flex-col items-center justify-center p-6">
            <div className="text-center space-y-5 max-w-sm">
              <h3 className="text-lg font-bold text-foreground">How It Works</h3>
              
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Tap to select</p>
                    <p className="text-xs text-muted-foreground">Pick up to 5 positives, 2 improvements</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Tap again = more strength</p>
                    <p className="text-xs text-muted-foreground">● → ●● → ●●● (same slot, more impact)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">4th tap removes</p>
                    <p className="text-xs text-muted-foreground">Cycle back to unselected</p>
                  </div>
                </div>
              </div>

              <Button onClick={dismissOnboarding} className="w-full">
                Got it!
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
