import { useState } from 'react';
import { X, HelpCircle, ChevronLeft, ChevronRight, MousePointerClick, Sparkles, Award, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface MuvoReviewHowItWorksProps {
  trigger?: React.ReactNode;
  className?: string;
}

const slides = [
  {
    icon: MousePointerClick,
    title: "Tap what you noticed",
    description: "Instead of picking a star rating, tap the things that stood out to you — good or not so good. Each tap counts!",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Sparkles,
    title: "Neutral = Style, not quality",
    description: "\"Rustic\" or \"Modern\" aren't good or bad — they're just how a place feels. These help travelers find their vibe.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Award,
    title: "Medals reward consistency",
    description: "Places earn medals by being consistently good over time — not by getting one viral review. Real quality shines through.",
    color: "text-[hsl(var(--signal-neutral))]",
    bg: "bg-[hsl(var(--signal-neutral-tint))]",
  },
  {
    icon: Star,
    title: "No stars, no punishment",
    description: "We show what people actually notice. One bad day doesn't tank a place. The community decides what matters.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

export function MuvoReviewHowItWorks({ trigger, className }: MuvoReviewHowItWorksProps) {
  const [open, setOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setOpen(false);
      setCurrentSlide(0);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentSlide(0);
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button 
            className={cn(
              "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
              className
            )}
          >
            <HelpCircle className="w-4 h-4" />
            Learn how MUVO reviews work
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>How MUVO Reviews Work</DialogTitle>
        </DialogHeader>
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {/* Slide content */}
        <div className="flex flex-col items-center text-center py-6 px-2">
          {/* Icon */}
          <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-5", slide.bg)}>
            <Icon className={cn("w-8 h-8", slide.color)} />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-foreground mb-3">
            {slide.title}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
            {slide.description}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pb-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentSlide 
                  ? "bg-primary w-4" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <span className="text-sm text-muted-foreground">
            {currentSlide + 1} of {slides.length}
          </span>

          <Button
            size="sm"
            onClick={handleNext}
            className="gap-1"
          >
            {isLastSlide ? "Got it" : "Next"}
            {!isLastSlide && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
