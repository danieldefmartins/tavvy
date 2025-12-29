import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertTriangle, XCircle, AlertOctagon, Loader2, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useCreateStatusUpdate, STATUS_CONFIG } from '@/hooks/usePlaceStatus';
import { PlaceStatus } from '@/hooks/usePlaces';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ReportStatusFormProps {
  placeId: string;
  currentStatus: PlaceStatus;
}

const STATUS_OPTIONS: { status: PlaceStatus; icon: React.ElementType }[] = [
  { status: 'open_accessible', icon: CheckCircle },
  { status: 'access_questionable', icon: AlertTriangle },
  { status: 'temporarily_closed', icon: XCircle },
  { status: 'restrictions_reported', icon: AlertOctagon },
];

export function ReportStatusForm({ placeId, currentStatus }: ReportStatusFormProps) {
  const { user, isVerified } = useAuth();
  const createStatusUpdate = useCreateStatusUpdate();

  const [selectedStatus, setSelectedStatus] = useState<PlaceStatus | null>(null);
  const [note, setNote] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStatusSelect = (status: PlaceStatus) => {
    hapticLight();
    if (selectedStatus === status) {
      setSelectedStatus(null);
      setIsExpanded(false);
    } else {
      setSelectedStatus(status);
      setIsExpanded(true);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStatus) return;
    
    hapticMedium();
    try {
      await createStatusUpdate.mutateAsync({
        placeId,
        status: selectedStatus,
        note: note.trim() || undefined,
      });
      toast.success('Status report submitted for review');
      setSelectedStatus(null);
      setNote('');
      setIsExpanded(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit status report');
    }
  };

  // Show sign-in prompt for non-logged-in users
  if (!user) {
    return (
      <div className="p-4 bg-secondary/30 border border-dashed border-border rounded-lg text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Help keep this place's status up to date
        </p>
        <Link to="/auth" className="text-sm text-primary hover:underline">
          Sign in to report status
        </Link>
      </div>
    );
  }

  // Show verification prompt for non-verified users
  if (!isVerified) {
    return (
      <div className="p-4 bg-secondary/30 border border-dashed border-border rounded-lg text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Verified users can report status changes
        </p>
        <Link to="/auth" className="text-sm text-primary hover:underline">
          Complete verification
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Flag className="w-4 h-4" />
        <span>Report current status (requires admin approval)</span>
      </div>

      {/* Status options grid */}
      <div className="grid grid-cols-2 gap-2">
        {STATUS_OPTIONS.map(({ status, icon: Icon }) => {
          const config = STATUS_CONFIG[status];
          const isSelected = selectedStatus === status;
          const isCurrent = currentStatus === status;

          return (
            <Button
              key={status}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-auto py-2.5 px-3 flex-col items-start gap-1 transition-all duration-150',
                'active:scale-[0.97] active:opacity-90',
                isSelected && 'ring-2 ring-primary/30',
                isCurrent && !isSelected && 'border-2 border-primary/30'
              )}
              onClick={() => handleStatusSelect(status)}
            >
              <div className="flex items-center gap-1.5 w-full">
                <Icon className={cn('w-4 h-4', isSelected ? '' : config.color)} />
                <span className="text-xs font-medium truncate">{config.label}</span>
              </div>
              {isCurrent && (
                <span className="text-[10px] opacity-60">Current</span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Expanded form for note */}
      {isExpanded && (
        <div className="space-y-3 animate-fade-in">
          <Textarea
            placeholder="Add context (optional, max 200 chars)"
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
                  setSelectedStatus(null);
                  setNote('');
                  setIsExpanded(false);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={createStatusUpdate.isPending}
              >
                {createStatusUpdate.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Submit Report'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
