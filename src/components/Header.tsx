import { ArrowLeft, Heart, Shield } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { NotificationBell } from '@/components/NotificationBell';
import muvoLogo from '@/assets/muvo-logo.png';

interface HeaderProps {
  showBack?: boolean;
  showMap?: boolean;
  className?: string;
}

export function Header({ showBack = false, showMap = false, className }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border',
        className
      )}
    >
      <div className="container flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-foreground hover:bg-secondary"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          {/* Always show MUVO logo - no page titles */}
          <Link to="/" className="flex items-center">
            <img src={muvoLogo} alt="MUVO" className="h-7" />
          </Link>
        </div>

        <div className="flex items-center gap-1">
          {/* Always show notification bell and heart */}
          <NotificationBell />
          <Button
            asChild
            variant="ghost"
            size="icon"
            className={cn(
              "text-muted-foreground hover:text-foreground",
              location.pathname === '/saved' && "text-primary"
            )}
          >
            <Link to={user ? "/saved" : "/auth"} aria-label="Saved places">
              <Heart className="w-5 h-5" />
            </Link>
          </Button>

          {isAdmin && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className={cn(
                "text-muted-foreground hover:text-foreground",
                location.pathname === '/admin/suggestions' && "text-primary"
              )}
            >
              <Link to="/admin/suggestions" aria-label="Admin panel">
                <Shield className="w-5 h-5" />
              </Link>
            </Button>
          )}

          {/* Profile icon removed - access via footer navigation only */}
        </div>
      </div>
    </header>
  );
}

