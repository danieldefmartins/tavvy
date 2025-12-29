import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export const NotificationBell = () => {
  const { user } = useAuth();
  const { data: unreadCount = 0 } = useUnreadCount();

  return (
    <Link
      to={user ? "/notifications" : "/auth"}
      className="relative p-2 rounded-full hover:bg-accent transition-colors"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
      {unreadCount > 0 && user && (
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 flex items-center justify-center",
            "min-w-[18px] h-[18px] px-1 text-xs font-semibold",
            "bg-destructive text-destructive-foreground rounded-full"
          )}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
};
