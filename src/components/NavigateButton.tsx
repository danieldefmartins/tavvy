import { useState, useEffect } from 'react';
import { Navigation, MapPin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { hapticMedium } from '@/lib/haptics';

type NavApp = 'apple' | 'google' | 'waze';

const STORAGE_KEY = 'preferred-nav-app';

interface NavigateButtonProps {
  latitude: number;
  longitude: number;
  name: string;
  variant?: 'default' | 'compact';
  className?: string;
}

export function NavigateButton({ latitude, longitude, name, variant = 'default', className }: NavigateButtonProps) {
  const [preferredApp, setPreferredApp] = useState<NavApp | null>(null);
  const [rememberChoice, setRememberChoice] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const encodedName = encodeURIComponent(name);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as NavApp | null;
    if (saved) {
      setPreferredApp(saved);
      setRememberChoice(true);
    }
  }, []);

  const openApp = (app: NavApp) => {
    hapticMedium();
    
    if (rememberChoice) {
      localStorage.setItem(STORAGE_KEY, app);
      setPreferredApp(app);
    }

    const urls: Record<NavApp, string> = {
      apple: `maps://maps.apple.com/?daddr=${latitude},${longitude}&q=${encodedName}`,
      google: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodedName}`,
      waze: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes&q=${encodedName}`,
    };

    window.open(urls[app], '_blank');
    setIsOpen(false);
  };

  const clearPreference = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPreferredApp(null);
    setRememberChoice(false);
  };

  const handleButtonClick = () => {
    if (preferredApp) {
      openApp(preferredApp);
    }
  };

  const isCompact = variant === 'compact';

  // If user has a saved preference, show direct button
  if (preferredApp) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={isCompact ? 'sm' : 'default'}
            className={cn(isCompact ? 'gap-1.5' : 'gap-2', className)}
            onClick={(e) => {
              e.preventDefault();
              handleButtonClick();
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setIsOpen(true);
            }}
          >
            <Navigation className={isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            {isCompact ? 'Navigate' : 'Get Directions'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-popover">
          <DropdownMenuItem onClick={() => openApp('apple')} className="gap-2 cursor-pointer">
            <MapPin className="w-4 h-4" />
            Apple Maps
            {preferredApp === 'apple' && <Check className="w-4 h-4 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openApp('google')} className="gap-2 cursor-pointer">
            <MapPin className="w-4 h-4" />
            Google Maps
            {preferredApp === 'google' && <Check className="w-4 h-4 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openApp('waze')} className="gap-2 cursor-pointer">
            <MapPin className="w-4 h-4" />
            Waze
            {preferredApp === 'waze' && <Check className="w-4 h-4 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={clearPreference} className="text-muted-foreground cursor-pointer">
            Clear saved preference
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={isCompact ? 'sm' : 'default'}
          className={cn(isCompact ? 'gap-1.5' : 'gap-2', className)}
        >
          <Navigation className={isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          {isCompact ? 'Navigate' : 'Get Directions'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-popover">
        <DropdownMenuItem onClick={() => openApp('apple')} className="gap-2 cursor-pointer">
          <MapPin className="w-4 h-4" />
          Apple Maps
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openApp('google')} className="gap-2 cursor-pointer">
          <MapPin className="w-4 h-4" />
          Google Maps
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openApp('waze')} className="gap-2 cursor-pointer">
          <MapPin className="w-4 h-4" />
          Waze
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-2 flex items-center gap-2">
          <Checkbox 
            id="remember-nav" 
            checked={rememberChoice}
            onCheckedChange={(checked) => setRememberChoice(checked === true)}
          />
          <label htmlFor="remember-nav" className="text-sm text-muted-foreground cursor-pointer">
            Remember my choice
          </label>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
