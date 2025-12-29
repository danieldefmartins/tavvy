import { Link } from 'react-router-dom';
import { MapPin, Phone, Globe, Instagram, Share2, ThumbsUp, Star, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Place } from '@/hooks/usePlaces';
import { usePlaceStampAggregates } from '@/hooks/useReviews';
import { useAllStamps, getStampLabel } from '@/hooks/useStamps';
import { cn } from '@/lib/utils';
import { useMemo, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

// Demo photos for testing swipe functionality
const DEMO_PHOTOS = [
  '/demo/rv-park-scenic.jpg',
  '/demo/forest-campground.jpg',
  '/demo/lakeside-camp.jpg',
  '/demo/desert-campground.jpg',
  '/demo/national-park-camp.jpg',
];

interface UniversalPlaceCardProps {
  place: Place;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * MUVO Universal Place Preview Card v1.8 (LOCKED)
 * 
 * Purpose: Allow users to decide "Should I go here?" in under 3 seconds.
 * This is a DECISION CARD - not a marketing card, photo gallery, or review list.
 */
export function UniversalPlaceCard({ place, className, style }: UniversalPlaceCardProps) {
  const { data: aggregates } = usePlaceStampAggregates(place.id);
  const { data: allStamps } = useAllStamps();
  
  // Photo carousel - use place cover image + demo photos for testing
  const photos = useMemo(() => {
    const placePhotos = place.coverImageUrl ? [place.coverImageUrl] : [];
    // Add demo photos for testing swipe functionality
    return [...placePhotos, ...DEMO_PHOTOS].slice(0, 5);
  }, [place.coverImageUrl]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    dragFree: false,
  });
  const [currentSlide, setCurrentSlide] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentSlide(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Subscribe to carousel events
  useMemo(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const reviewLines = useMemo(() => {
    if (!aggregates || aggregates.length === 0) {
      return { positive: null, neutral: null, negative: null };
    }

    // Helper to safely get label as string
    const getLabel = (data: typeof aggregates[0]): string => {
      if (data.stamp_id) {
        return getStampLabel(allStamps, data.stamp_id);
      }
      // Ensure dimension is converted to string (it could be an enum/object)
      const dim = data.dimension;
      if (typeof dim === 'string') return dim;
      if (dim && typeof dim === 'object') return String(dim);
      return 'Review';
    };

    // TOP 1 POSITIVE
    const positiveData = aggregates
      .filter(a => a.polarity === 'positive')
      .sort((a, b) => b.total_votes - a.total_votes)[0];

    // TOP 1 NEUTRAL
    const neutralData = aggregates
      .filter(a => a.polarity === 'neutral')
      .sort((a, b) => b.total_votes - a.total_votes)[0];

    // TOP 1 NEGATIVE (improvement polarity)
    const negativeData = aggregates
      .filter(a => a.polarity === 'improvement')
      .sort((a, b) => b.total_votes - a.total_votes)[0];

    return {
      positive: positiveData ? {
        label: getLabel(positiveData),
        votes: positiveData.total_votes,
      } : null,
      neutral: neutralData ? {
        label: getLabel(neutralData),
        votes: neutralData.total_votes,
      } : null,
      negative: negativeData ? {
        label: getLabel(negativeData),
        votes: negativeData.total_votes,
      } : null,
    };
  }, [aggregates, allStamps]);

  const hasAnyReviews = reviewLines.positive || reviewLines.neutral || reviewLines.negative;

  // Generate open status text
  const getOpenStatus = () => {
    if (place.is24_7) return 'Open 24/7';
    if (place.currentStatus === 'open_accessible') return 'Open';
    if (place.currentStatus === 'temporarily_closed') return 'Temporarily Closed';
    return 'Check hours';
  };

  // Handle action clicks without navigating
  const handleActionClick = (e: React.MouseEvent, action: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    switch (action) {
      case 'phone':
        if (place.phone) window.location.href = `tel:${place.phone}`;
        break;
      case 'website':
        if (place.website) window.open(place.website, '_blank');
        break;
      case 'instagram':
        if (place.instagramUrl) window.open(place.instagramUrl, '_blank');
        break;
      case 'share':
        if (navigator.share) {
          navigator.share({
            title: place.name,
            url: `${window.location.origin}/place/${place.id}`,
          });
        } else {
          navigator.clipboard.writeText(`${window.location.origin}/place/${place.id}`);
        }
        break;
    }
  };

  return (
    <Link
      to={`/place/${place.id}`}
      className={cn(
        'block w-full bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100',
        'transition-shadow duration-300 hover:shadow-xl',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      style={style}
    >
      <div className="flex p-4 gap-4">
        {/* LEFT: Swipeable Photo Carousel */}
        <div className="flex-shrink-0 w-28 h-28 sm:w-40 sm:h-40 rounded-xl overflow-hidden bg-muted relative group">
          {photos.length > 0 ? (
            <>
              <div className="overflow-hidden h-full" ref={emblaRef}>
                <div className="flex h-full">
                  {photos.map((photo, index) => (
                    <div key={index} className="flex-[0_0_100%] min-w-0 h-full">
                      <img
                        src={photo}
                        alt={`${place.name} - Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Navigation arrows - show on hover */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={scrollPrev}
                    className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={scrollNext}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </>
              )}
              
              {/* Dots indicator */}
              {photos.length > 1 && (
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                  {photos.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'w-1.5 h-1.5 rounded-full transition-colors',
                        index === currentSlide ? 'bg-white' : 'bg-white/50'
                      )}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* RIGHT: Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Place Name - Hero element */}
          <h3 className="font-display font-bold text-foreground text-xl leading-tight truncate">
            {place.name}
          </h3>

          {/* 3 Signal Lines - fixed width badges */}
          <div className="flex flex-col space-y-2 mt-4 mb-3">
            {/* LINE 1: POSITIVE (Brand Blue) */}
            {reviewLines.positive ? (
              <span className="inline-flex items-center justify-center gap-1.5 min-w-[192px] w-48 bg-[hsl(var(--signal-positive))] text-white px-3 py-1.5 rounded-full text-sm">
                <ThumbsUp className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium truncate max-w-[100px]">
                  {reviewLines.positive.label}
                </span>
                <span className="font-bold">×{reviewLines.positive.votes}</span>
              </span>
            ) : hasAnyReviews ? null : (
              <span className="inline-flex items-center justify-center gap-1.5 min-w-[192px] w-48 bg-muted text-muted-foreground px-3 py-1.5 rounded-full text-sm">
                <ThumbsUp className="w-4 h-4 flex-shrink-0" />
                <span className="italic">Be the first to add feedback</span>
              </span>
            )}

            {/* LINE 2: NEUTRAL (Gray) */}
            {reviewLines.neutral && (
              <span className="inline-flex items-center justify-center gap-1.5 min-w-[192px] w-48 bg-[hsl(var(--signal-neutral))] text-white px-3 py-1.5 rounded-full text-sm">
                <Star className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium truncate max-w-[100px]">
                  {reviewLines.neutral.label}
                </span>
                <span className="font-bold">×{reviewLines.neutral.votes}</span>
              </span>
            )}

            {/* LINE 3: NEGATIVE (Orange) - only if exists */}
            {reviewLines.negative && (
              <span className="inline-flex items-center justify-center gap-1.5 min-w-[192px] w-48 bg-[hsl(var(--signal-negative))] text-white px-3 py-1.5 rounded-full text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium truncate max-w-[100px]">
                  {reviewLines.negative.label}
                </span>
                <span className="font-bold">×{reviewLines.negative.votes}</span>
              </span>
            )}
          </div>

          {/* Meta Information Line */}
          <div className="text-sm text-muted-foreground truncate mb-2">
            {String(place.primaryCategory || 'Place')}
            <span className="mx-1.5">•</span>
            {place.distance} mi
            <span className="mx-1.5">•</span>
            {getOpenStatus()}
          </div>

          {/* Action Icons - 44x44px minimum for touch targets */}
          <div className="flex items-center gap-2 mt-auto">
            {place.phone && (
              <button
                onClick={(e) => handleActionClick(e, 'phone')}
                className="w-11 h-11 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                aria-label="Call"
              >
                <Phone className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            {place.website && (
              <button
                onClick={(e) => handleActionClick(e, 'website')}
                className="w-11 h-11 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                aria-label="Website"
              >
                <Globe className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            {place.instagramUrl && (
              <button
                onClick={(e) => handleActionClick(e, 'instagram')}
                className="w-11 h-11 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={(e) => handleActionClick(e, 'share')}
              className="w-11 h-11 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
