import { MapPin, Droplets, Zap, Wifi, Dog, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Place, PlaceFeature } from '@/hooks/usePlaces';
import { FavoriteButton } from './FavoriteButton';
import { NavigateButton } from './NavigateButton';
import { PlaceStampBadges } from './PlaceStampBadges';
import { cn } from '@/lib/utils';

interface PlaceMapCardProps {
  place: Place;
  className?: string;
  onClose?: () => void;
  isHighlighted?: boolean;
}

// Compact feature icons for map popup
const FEATURE_ICONS: Partial<Record<PlaceFeature, React.ElementType>> = {
  'Wi-Fi': Wifi,
  'Pet Friendly': Dog,
  'Big Rig Friendly': Truck,
  'Electric Hookups': Zap,
  'Dump Station': Droplets,
  'Fresh Water': Droplets,
};

function getFeatureIcons(features: PlaceFeature[], max = 4) {
  const icons: { feature: PlaceFeature; Icon: React.ElementType }[] = [];
  const usedIcons = new Set<React.ElementType>();
  
  for (const feature of features) {
    if (icons.length >= max) break;
    const Icon = FEATURE_ICONS[feature];
    if (Icon && !usedIcons.has(Icon)) {
      icons.push({ feature, Icon });
      usedIcons.add(Icon);
    }
  }
  
  return icons;
}

export function PlaceMapCard({ place, className, onClose, isHighlighted }: PlaceMapCardProps) {
  const featureIcons = getFeatureIcons(place.features);

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl shadow-lg overflow-hidden w-72',
        isHighlighted && 'ring-2 ring-primary',
        className
      )}
    >
      {/* Image */}
      <div className="relative h-28">
        {place.coverImageUrl ? (
          <img
            src={place.coverImageUrl}
            alt={place.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-background/95 text-foreground backdrop-blur-sm">
            {place.primaryCategory}
          </span>
        </div>

        {/* Favorite button */}
        <div className="absolute top-2 right-2">
          <FavoriteButton placeId={place.id} variant="icon" />
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-display font-semibold text-foreground text-sm leading-tight mb-1">
          {place.name}
        </h3>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <MapPin className="w-3 h-3" />
            <span>{place.distance} mi</span>
            <span className="mx-0.5">•</span>
            <span className="font-medium text-foreground">{place.priceLevel}</span>
          </div>
        </div>

        {/* Review stamps */}
        <PlaceStampBadges 
          placeId={place.id} 
          variant="compact" 
          maxGood={2} 
          maxBad={1}
          showReviewCount={true}
          className="mb-2"
        />

        {/* Feature icons */}
        {featureIcons.length > 0 && (
          <div className="flex items-center gap-1 mb-3">
            {featureIcons.map(({ feature, Icon }) => (
              <div
                key={feature}
                className="flex items-center justify-center w-6 h-6 rounded-full bg-muted"
                title={feature}
              >
                <Icon className="w-3 h-3 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Link
            to={`/place/${place.id}`}
            className="flex-1 text-center py-2 px-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            onClick={onClose}
          >
            Details
          </Link>
          <NavigateButton
            latitude={place.latitude}
            longitude={place.longitude}
            name={place.name}
            variant="compact"
          />
        </div>
      </div>
    </div>
  );
}
