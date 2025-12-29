import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Droplets, Eye, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TrustedContributorBadge } from '@/components/TrustedContributorBadge';
import { useAuth } from '@/hooks/useAuth';
import { 
  usePlaceCheckins, 
  useCreateCheckin, 
  useDeleteCheckin, 
  CheckinType 
} from '@/hooks/useCheckins';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface PlaceCheckinProps {
  placeId: string;
}

const CHECKIN_TYPES: { type: CheckinType; label: string; icon: React.ElementType }[] = [
  { type: 'stayed_here', label: 'Stayed here', icon: Home },
  { type: 'used_dump_water', label: 'Used dump/water', icon: Droplets },
  { type: 'passed_by', label: 'Passed by', icon: Eye },
];

export function PlaceCheckin({ placeId }: PlaceCheckinProps) {
  const { user, isVerified } = useAuth();
  const { data: checkins, isLoading } = usePlaceCheckins(placeId);
  const createCheckin = useCreateCheckin();
  const deleteCheckin = useDeleteCheckin();

  const [selectedType, setSelectedType] = useState<CheckinType | null>(null);
  const [note, setNote] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTypeSelect = (type: CheckinType) => {
    hapticLight();
    if (selectedType === type) {
      setSelectedType(null);
      setIsExpanded(false);
    } else {
      setSelectedType(type);
      setIsExpanded(true);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) return;
    
    hapticMedium();
    try {
      await createCheckin.mutateAsync({
        placeId,
        type: selectedType,
        note: note.trim() || undefined,
      });
      toast.success('Check-in saved!');
      setSelectedType(null);
      setNote('');
      setIsExpanded(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save check-in');
    }
  };

  const handleDelete = async (checkinId: string) => {
    hapticLight();
    try {
      await deleteCheckin.mutateAsync({ checkinId, placeId });
      toast.success('Check-in removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove check-in');
    }
  };

  // Show sign-in prompt for non-logged-in users
  if (!user) {
    return (
      <div className="p-4 bg-secondary/30 border border-dashed border-border rounded-lg text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Want to check in at this place?
        </p>
        <Link to="/auth" className="text-sm text-primary hover:underline">
          Sign in to check in
        </Link>
      </div>
    );
  }

  // Show verification prompt for non-verified users
  if (!isVerified) {
    return (
      <div className="p-4 bg-secondary/30 border border-dashed border-border rounded-lg text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Verify your account to check in
        </p>
        <Link to="/auth" className="text-sm text-primary hover:underline">
          Complete verification
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Check-in type buttons */}
      <div className="flex gap-2">
        {CHECKIN_TYPES.map(({ type, label, icon: Icon }) => (
          <Button
            key={type}
            variant={selectedType === type ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'flex-1 transition-all duration-150',
              'active:scale-[0.97] active:opacity-90',
              selectedType === type && 'ring-2 ring-primary/30'
            )}
            onClick={() => handleTypeSelect(type)}
          >
            <Icon className="w-4 h-4 mr-1.5" />
            <span className="text-xs sm:text-sm">{label}</span>
          </Button>
        ))}
      </div>

      {/* Expanded form for note */}
      {isExpanded && (
        <div className="space-y-3 animate-fade-in">
          <Textarea
            placeholder="Add an optional note (max 200 chars)"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            maxLength={200}
            rows={2}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {note.length}/200
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedType(null);
                  setNote('');
                  setIsExpanded(false);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={createCheckin.isPending}
              >
                {createCheckin.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Check in'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Recent check-ins list */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground text-center py-4">
          Loading check-ins...
        </div>
      ) : checkins && checkins.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Recent activity</h4>
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {checkins.slice(0, 5).map((checkin) => {
              const typeInfo = CHECKIN_TYPES.find((t) => t.type === checkin.type);
              const Icon = typeInfo?.icon || Eye;
              const isOwn = checkin.userId === user.id;

              return (
                <div
                  key={checkin.id}
                  className="flex items-start gap-3 p-3 bg-card"
                >
                  <div className="p-1.5 rounded-full bg-secondary">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">
                        {checkin.profile?.displayName || 'Anonymous'}
                      </span>
                      {checkin.profile?.trustedContributor && (
                        <TrustedContributorBadge />
                      )}
                      {checkin.profile?.isPro && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {typeInfo?.label} • {formatDistanceToNow(checkin.createdAt, { addSuffix: true })}
                    </p>
                    {checkin.note && (
                      <p className="text-sm text-foreground mt-1">
                        {checkin.note}
                      </p>
                    )}
                  </div>
                  {isOwn && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(checkin.id)}
                      disabled={deleteCheckin.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          No check-ins yet. Be the first!
        </p>
      )}
    </div>
  );
}
