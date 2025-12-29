import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  Search, 
  Shield, 
  AlertTriangle, 
  Loader2,
  Award,
  CheckCircle,
} from 'lucide-react';
import { useAllUsers, useToggleTrusted } from '@/hooks/useUsers';
import { useIsAdmin } from '@/hooks/useAdmin';
import { TrustedContributorBadge } from '@/components/TrustedContributorBadge';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function AdminUsers() {
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: users, isLoading } = useAllUsers(searchQuery);
  const toggleTrusted = useToggleTrusted();

  const handleToggleTrusted = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleTrusted.mutateAsync({ userId, trusted: !currentStatus });
      toast.success(currentStatus ? 'Trusted status removed' : 'User marked as trusted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
  };

  if (isAdminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack />
        <main className="container px-4 py-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack />
        <main className="container px-4 py-6 max-w-2xl mx-auto text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <h1 className="text-xl font-semibold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access this page.
          </p>
          <Link to="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header showBack />

      <main className="container px-4 py-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">Users</h1>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !users || users.length === 0 ? (
          <div className="text-center py-12 bg-secondary/30 rounded-lg">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-card border border-border rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">
                        {user.displayName || user.email || 'Anonymous'}
                      </span>
                      {user.trustedContributor && <TrustedContributorBadge />}
                      {user.isPro && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                          PRO
                        </span>
                      )}
                      {user.isVerified && (
                        <CheckCircle className="w-4 h-4 text-success" />
                      )}
                    </div>
                    {user.email && user.displayName && (
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={user.trustedContributor}
                      onCheckedChange={() => handleToggleTrusted(user.id, user.trustedContributor)}
                      disabled={toggleTrusted.isPending}
                    />
                    <Shield className={`w-4 h-4 ${user.trustedContributor ? 'text-amber-500' : 'text-muted-foreground'}`} />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    <span>{user.contributionCount} contributions</span>
                  </div>
                  {user.trustedSince && (
                    <span>
                      Trusted since {formatDistanceToNow(user.trustedSince, { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
