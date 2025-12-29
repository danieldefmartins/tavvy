import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticLight } from '@/lib/haptics';
import { useFooter } from '@/contexts/FooterContext';
import { useAuth } from '@/hooks/useAuth';
import { AddPlaceWizard } from '@/components/place-wizard/AddPlaceWizard';

interface NavItem {
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
  label: string;
  path: string;
}

// Custom Map Icon - Folded map with 3 panels
const MapIcon = ({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth}
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" />
    <path d="M9 3v15" />
    <path d="M15 6v15" />
  </svg>
);

// Custom Places Icon - Location pin with inner circle (MUVO style)
const PlacesIcon = ({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth}
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 21c-4-4-8-7.5-8-11a8 8 0 1 1 16 0c0 3.5-4 7-8 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

// Custom Routes Icon - Curved path with start dot and end arrow
const RoutesIcon = ({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth}
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="5" cy="6" r="2" fill="currentColor" stroke="none" />
    <path d="M5 8c0 4 6 4 6 8s6 4 6 4" />
    <path d="M17 17l3 3-3 3" />
  </svg>
);

// Custom Saved Icon - Bookmark with rounded shape
const SavedIcon = ({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth}
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17l-7-4-7 4V4z" />
  </svg>
);

// Custom Profile Icon - Minimal user silhouette
const ProfileIcon = ({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth}
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);

// Navigation items - split into left (2) and right (2) with center + button
const leftNavItems: NavItem[] = [
  { icon: MapIcon, label: 'Map', path: '/map' },
  { icon: PlacesIcon, label: 'Places', path: '/places' },
];

const rightNavItems: NavItem[] = [
  { icon: SavedIcon, label: 'Saved', path: '/saved' },
];

// Paths where footer should always be hidden (forms, auth, creation flows)
const HIDDEN_PATHS = [
  '/auth',
  '/admin/import',
  '/admin/data-enrichment',
  '/admin/suggestions',
  '/admin/photos',
  '/admin/users',
  '/admin/place-submissions',
];

// Paths where footer is visible
const VISIBLE_PATHS = [
  '/',
  '/map',
  '/places',
  '/route',
  '/saved',
  '/search',
  '/notifications',
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMapInteracting, isScrollingDown } = useFooter();
  const { user, profile } = useAuth();
  const [showAddPlace, setShowAddPlace] = useState(false);
  
  const pathname = location.pathname;
  
  // Check if current path should hide footer
  const shouldHideForPath = HIDDEN_PATHS.some(path => pathname.startsWith(path));
  
  // Check if current path is a visible path or a place detail page
  const isVisiblePath = VISIBLE_PATHS.includes(pathname) || pathname.startsWith('/place/') || pathname.startsWith('/profile/');
  
  // Hide footer on hidden paths
  if (shouldHideForPath) {
    return null;
  }
  
  // Only show on explicitly visible paths
  if (!isVisiblePath) {
    return null;
  }

  // Map View: hide when user is interacting (dragging/zooming)
  const isMapPage = pathname === '/map';
  const shouldHideForMapInteraction = isMapPage && isMapInteracting;

  const handleNavClick = () => {
    hapticLight();
  };

  const handleAddClick = () => {
    hapticLight();
    if (!user) {
      navigate('/auth');
      return;
    }
    setShowAddPlace(true);
  };

  // Compact mode when scrolling down
  const isCompact = isScrollingDown && !isMapPage;

  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;
    
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={handleNavClick}
        className={cn(
          'flex flex-col items-center justify-center min-w-[48px] px-2 rounded-xl transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          isActive 
            ? 'text-primary' 
            : 'text-muted-foreground hover:text-foreground',
          isCompact ? 'gap-0 py-1' : 'gap-0.5 py-2'
        )}
        style={{ minHeight: '44px' }}
      >
        <div className={cn(
          'relative flex items-center justify-center rounded-full transition-all duration-200',
          isActive && !isCompact && 'bg-primary/10 px-2 py-1',
          isActive && isCompact && 'bg-primary/10 px-1.5 py-0.5'
        )}>
          <Icon 
            className={cn(
              'transition-all duration-200',
              isCompact ? 'w-5 h-5' : 'w-5 h-5'
            )}
            strokeWidth={isActive ? 2.25 : 2}
          />
        </div>
        <span className={cn(
          'font-medium tracking-tight transition-all duration-200',
          isActive && 'text-primary',
          isCompact 
            ? 'text-[8px] opacity-60' 
            : 'text-[10px] opacity-100'
        )}>
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <>
      <nav 
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 border-t border-border/50',
          'transition-all duration-200 ease-out',
          shouldHideForMapInteraction && 'translate-y-full',
          isCompact 
            ? 'bg-background/80 backdrop-blur-sm' 
            : 'bg-background/95 backdrop-blur-md'
        )}
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className={cn(
          'flex items-center justify-around max-w-lg mx-auto px-1 transition-all duration-200',
          isCompact ? 'h-12' : 'h-16'
        )}>
          {/* Left nav items */}
          {leftNavItems.map(renderNavItem)}
          
          {/* Center + button */}
          <button
            onClick={handleAddClick}
            className={cn(
              'flex flex-col items-center justify-center px-3 rounded-xl transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
              'text-primary-foreground',
              isCompact ? 'gap-0 py-1' : 'gap-0.5 py-2'
            )}
            style={{ minHeight: '44px' }}
          >
            <div className={cn(
              'flex items-center justify-center rounded-full bg-primary transition-all duration-200 shadow-lg',
              isCompact ? 'w-9 h-9' : 'w-11 h-11'
            )}>
              <Plus className={cn(
                'transition-all duration-200',
                isCompact ? 'w-5 h-5' : 'w-6 h-6'
              )} strokeWidth={2.5} />
            </div>
            {!isCompact && (
              <span className="text-[10px] font-medium text-primary opacity-0">
                Add
              </span>
            )}
          </button>
          
          {/* Right nav items */}
          {rightNavItems.map(renderNavItem)}
          
          {/* Profile nav item - dynamic based on auth state */}
          {renderNavItem({
            icon: ProfileIcon,
            label: 'Profile',
            path: user && profile?.username ? `/profile/${profile.username}` : '/auth'
          })}
        </div>
      </nav>

      {/* Add Place Wizard */}
      <AddPlaceWizard 
        open={showAddPlace} 
        onOpenChange={setShowAddPlace} 
      />
    </>
  );
}
