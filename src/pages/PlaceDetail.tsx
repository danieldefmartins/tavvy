import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Heart,
  MapPin,
  Phone,
  Globe,
  Calendar,
  ThumbsUp,
  Star,
  AlertTriangle,
  Navigation,
  Instagram,
  Facebook,
} from 'lucide-react';
import { FavoriteButton } from '@/components/FavoriteButton';
import { PlacePhotoGallery } from '@/components/PlacePhotoGallery';
import { PhotoUploadForm } from '@/components/PhotoUploadForm';
import { MuvoReviewSimple } from '@/components/MuvoReviewSimple';
import { ReviewForm } from '@/components/ReviewForm';
import { extractEntrancesWithRVData } from '@/hooks/useEntrances';
import { EntranceData } from '@/types/entrance';
import { usePlace } from '@/hooks/usePlaces';
import { useAuth } from '@/hooks/useAuth';
import { usePlaceMemberships, useMembershipsList } from '@/hooks/useMemberships';
import { useFavorites } from '@/hooks/useFavorites';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PlaceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: place, isLoading, error } = usePlace(id || '');
  const { user } = useAuth();
  const { data: placeMemberships } = usePlaceMemberships(id);
  const { data: allMemberships } = useMembershipsList();
  const { data: favorites } = useFavorites();
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const queryClient = useQueryClient();

  // Check if place is favorited
  const isFavorited = favorites?.includes(id || '') ?? false;

  // Fetch raw place data to extract entrances
  const [entrances, setEntrances] = useState<EntranceData[]>([]);
  
  useMemo(() => {
    if (!id) return;
    
    supabase
      .from('places')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const extracted = extractEntrancesWithRVData(data as unknown as Record<string, unknown>);
          setEntrances(extracted);
        }
      });
  }, [id]);

  // Get membership that includes this place (first match for hero badge)
  const includedMembership = useMemo(() => {
    if (!placeMemberships?.length || !allMemberships?.length) return null;
    const firstMatch = placeMemberships[0];
    return allMemberships.find(m => m.id === firstMatch.membership_id);
  }, [placeMemberships, allMemberships]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted">
        <Skeleton className="h-96 w-full" />
        <div className="px-4 py-6 space-y-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-muted-foreground">This place could not be found.</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Build address string
  const addressParts = [
    place.addressLine1,
    place.city,
    place.state,
    place.zipCode
  ].filter(Boolean);
  const fullAddress = addressParts.join(', ') || `${place.latitude.toFixed(4)}°N, ${Math.abs(place.longitude).toFixed(4)}°W`;

  // Price level display
  const priceDisplay = place.priceLevel === '$' ? '$' :
    place.priceLevel === '$$' ? '$$' :
    place.priceLevel === '$$$' ? '$$$' : '$';

  // Open status (simplified - would need hours data for real implementation)
  const isOpen = true; // Placeholder - would check against hours_of_operation

  // Navigate to entrance
  const handleNavigate = (lat: number, lng: number, name: string) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    const encodedName = encodeURIComponent(name);
    
    if (isIOS) {
      window.open(`maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`, '_blank');
    } else if (isAndroid) {
      window.open(`geo:${lat},${lng}?q=${lat},${lng}(${encodedName})`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    }
  };

  // Ensure website has protocol
  const ensureHttps = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  // Format website for display
  const formatWebsiteDisplay = (url: string) => {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  };

  return (
    <div className="min-h-screen bg-muted pb-20">
      {/* Hero Section */}
      <div className="relative h-96 w-full">
        <img 
          src={place.coverImageUrl || '/demo/rv-park-scenic.jpg'} 
          alt={place.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-11 h-11 bg-card rounded-full flex items-center justify-center shadow-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        
        {/* Favorite Button */}
        <button 
          className="absolute top-4 right-4 w-11 h-11 bg-card rounded-full flex items-center justify-center shadow-lg hover:bg-muted transition-colors"
        >
          <FavoriteButton placeId={place.id} variant="icon" />
        </button>

        {/* Place Name and Membership Badge */}
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-3xl font-bold text-white mb-3">{place.name}</h1>
          {includedMembership && (
            <div className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Included with: <span className="text-primary">{includedMembership.name}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Facts Bar */}
      <div className="bg-card border-b border-border">
        <div className="flex items-center justify-around py-4 px-4">
          <div className="flex flex-col items-center gap-1">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">{place.distance} mi</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold text-primary">{priceDisplay}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-3 h-3 rounded-full ${isOpen ? 'bg-green-500' : 'bg-destructive'}`} />
            <span className="text-sm font-medium text-foreground">{isOpen ? 'Open now' : 'Closed'}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {place.openYearRound ? 'Year-round' : 'Seasonal'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-4">
        {/* Community Reviews Section */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Community Reviews</h2>
          
          {/* MUVO Review Simple - 3-line format */}
          <MuvoReviewSimple placeId={id!} />
          
          {/* Review Form - handles both new reviews and editing */}
          <div className="mt-4">
            <ReviewForm 
              placeId={id!} 
              placeName={place.name}
              placeCategory={place.primaryCategory}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['place-stamp-aggregates', id] });
                queryClient.invalidateQueries({ queryKey: ['my-review', id] });
              }}
            />
          </div>
        </div>

        {/* Location & Contact Section */}
        {(fullAddress || place.phone || place.website) && (
          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">Location & Contact</h2>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground">{fullAddress}</span>
              </div>
              
              {place.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                  <a href={`tel:${place.phone}`} className="text-foreground hover:text-primary transition-colors">
                    {place.phone}
                  </a>
                </div>
              )}
              
              {place.website && (
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                  <a 
                    href={ensureHttps(place.website)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-foreground hover:text-primary transition-colors"
                  >
                    {formatWebsiteDisplay(place.website)}
                  </a>
                </div>
              )}

              {(place.instagramUrl || place.facebookUrl) && (
                <div className="flex items-center gap-4 pt-2">
                  {place.instagramUrl && (
                    <a 
                      href={ensureHttps(place.instagramUrl)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Instagram className="w-6 h-6" />
                    </a>
                  )}
                  {place.facebookUrl && (
                    <a 
                      href={ensureHttps(place.facebookUrl)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Facebook className="w-6 h-6" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Entrances Section - Only show if entrances exist */}
        {entrances.length > 0 && (
          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">Entrances</h2>
            
            <div className="space-y-3">
              {entrances.map((entrance, idx) => (
                <div key={idx} className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <span className={`${entrance.isPrimary ? 'font-semibold' : ''} text-foreground`}>
                      {entrance.name || `Entrance ${idx + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-sm">
                        {entrance.latitude && entrance.longitude 
                          ? `${Math.abs(entrance.latitude - place.latitude).toFixed(1)} mi`
                          : '--'
                        }
                      </span>
                    </div>
                    <Button 
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => handleNavigate(
                        entrance.latitude || place.latitude, 
                        entrance.longitude || place.longitude, 
                        entrance.name || place.name
                      )}
                    >
                      Navigate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accepted Memberships Section - Only show if memberships exist */}
        {placeMemberships && placeMemberships.length > 0 && (
          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">Accepted Memberships</h2>
            
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              {placeMemberships.map((pm) => (
                <div key={pm.id} className="w-16 h-16 flex items-center justify-center bg-muted rounded-lg p-2">
                  {pm.membership?.icon ? (
                    <img 
                      src={pm.membership.icon} 
                      alt={pm.membership.name} 
                      className="max-w-full max-h-full object-contain" 
                    />
                  ) : (
                    <span className="text-xs text-center text-muted-foreground font-medium">
                      {pm.membership?.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            {placeMemberships.some(pm => pm.notes) && (
              <p className="text-sm text-muted-foreground">
                {placeMemberships.find(pm => pm.notes)?.notes}
              </p>
            )}
          </div>
        )}

        {/* Photos Section */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Photos</h2>
          
          {showPhotoUpload ? (
            <PhotoUploadForm 
              placeId={id!}
              onSuccess={() => {
                setShowPhotoUpload(false);
                queryClient.invalidateQueries({ queryKey: ['place-photos', id] });
              }}
              onCancel={() => setShowPhotoUpload(false)}
            />
          ) : (
            <PlacePhotoGallery 
              placeId={id!} 
              onAddPhoto={() => setShowPhotoUpload(true)}
            />
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-muted-foreground pt-2">
          Information is based on community reports. Always verify locally.
        </p>
      </div>
    </div>
  );
};

export default PlaceDetail;
