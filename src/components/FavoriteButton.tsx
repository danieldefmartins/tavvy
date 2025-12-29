import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useIsFavorite, useToggleFavorite } from '@/hooks/useFavorites';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { hapticLight, hapticMedium } from '@/lib/haptics';

interface FavoriteButtonProps {
  placeId: string;
  variant?: 'icon' | 'full';
  className?: string;
}

export function FavoriteButton({ placeId, variant = 'icon', className }: FavoriteButtonProps) {
  const { user, isVerified } = useAuth();
  const isFavorite = useIsFavorite(placeId);
  const toggleFavorite = useToggleFavorite();
  const { toast } = useToast();
  const [animating, setAnimating] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    hapticLight();

    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save places.',
      });
      return;
    }

    if (!isVerified) {
      toast({
        title: 'Verification required',
        description: 'Complete verification to save places.',
      });
      return;
    }

    // Trigger animation
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    toggleFavorite.mutate(
      { placeId, isFavorite },
      {
        onSuccess: () => {
          hapticMedium();
          toast({
            title: isFavorite ? 'Removed from saved' : 'Saved!',
            description: isFavorite ? 'Place removed from your favorites.' : 'Place added to your favorites.',
          });
        },
        onError: () => {
          toast({
            title: 'Error',
            description: 'Could not update favorites. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  }

  if (variant === 'full') {
    return (
      <Button
        variant={isFavorite ? 'default' : 'outline'}
        className={cn('gap-2 active:scale-[0.97] transition-transform', className)}
        onClick={handleClick}
        disabled={toggleFavorite.isPending}
      >
        <Heart
          className={cn(
            'w-4 h-4 transition-all duration-300',
            isFavorite && 'fill-current',
            animating && 'scale-125'
          )}
        />
        {isFavorite ? 'Saved' : 'Save Place'}
      </Button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={toggleFavorite.isPending}
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-full transition-all active:scale-[0.9]',
        isFavorite
          ? 'bg-primary text-primary-foreground'
          : 'bg-background/90 text-muted-foreground hover:text-primary backdrop-blur-sm',
        toggleFavorite.isPending && 'opacity-50',
        className
      )}
      title={isFavorite ? 'Remove from saved' : 'Save place'}
    >
      <Heart
        className={cn(
          'w-4 h-4 transition-all duration-300 transform-gpu',
          isFavorite && 'fill-current',
          animating && !isFavorite && 'scale-[1.4] text-red-500',
          animating && isFavorite && 'scale-75'
        )}
      />
    </button>
  );
}
