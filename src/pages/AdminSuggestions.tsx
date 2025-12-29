import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Check, X, AlertTriangle, Clock, User, MapPin, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin, usePendingSuggestions, useApproveSuggestion, useRejectSuggestion, useToggleProStatus } from '@/hooks/useAdmin';
import { FIELD_LABELS } from '@/hooks/useSuggestions';
import { TrustedBadge } from '@/components/TrustedBadge';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function AdminSuggestions() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: suggestions, isLoading: suggestionsLoading } = usePendingSuggestions();
  const approveMutation = useApproveSuggestion();
  const rejectMutation = useRejectSuggestion();
  const toggleProMutation = useToggleProStatus();
  const { toast } = useToast();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  if (authLoading || adminLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleApprove = async (suggestion: typeof suggestions extends (infer T)[] ? T : never) => {
    try {
      await approveMutation.mutateAsync(suggestion);
      toast({
        title: 'Suggestion approved',
        description: `Updated ${FIELD_LABELS[suggestion.fieldName] || suggestion.fieldName} for ${suggestion.placeName}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve suggestion',
        variant: 'destructive',
      });
    }
  };

  const openRejectDialog = (suggestionId: string) => {
    setSelectedSuggestionId(suggestionId);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedSuggestionId) return;

    try {
      await rejectMutation.mutateAsync({
        suggestionId: selectedSuggestionId,
        reason: rejectionReason || undefined,
      });
      setRejectDialogOpen(false);
      toast({
        title: 'Suggestion rejected',
        description: 'The suggestion has been rejected.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject suggestion',
        variant: 'destructive',
      });
    }
  };

  const handleTogglePro = async (userId: string, currentIsPro: boolean) => {
    try {
      await toggleProMutation.mutateAsync({ userId, isPro: !currentIsPro });
      toast({
        title: currentIsPro ? 'Pro status removed' : 'Pro status granted',
        description: currentIsPro 
          ? 'User is no longer a Trusted Contributor' 
          : 'User is now a Trusted Contributor',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update pro status',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Review Suggestions</h1>
        <p className="text-muted-foreground">
          Review and approve or reject user-submitted place updates.
        </p>
      </div>

      {suggestionsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : !suggestions || suggestions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Check className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">All caught up!</h2>
            <p className="text-muted-foreground">
              There are no pending suggestions to review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <Card key={suggestion.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-4 w-4" />
                      {suggestion.placeName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {suggestion.userDisplayName}
                        {suggestion.userIsPro && <TrustedBadge showLabel={false} className="ml-1" />}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(suggestion.createdAt, { addSuffix: true })}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {FIELD_LABELS[suggestion.fieldName] || suggestion.fieldName}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Current Value</p>
                    <p className="font-medium">
                      {suggestion.currentValue || <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Suggested Value</p>
                    <p className="font-medium text-primary">{suggestion.suggestedValue}</p>
                  </div>
                </div>

                {suggestion.notes && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Notes from user</p>
                    <p className="text-sm">{suggestion.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleApprove(suggestion)}
                    disabled={approveMutation.isPending}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openRejectDialog(suggestion.id)}
                    disabled={rejectMutation.isPending}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>

                {/* Admin toggle for Pro status */}
                <div className="pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePro(suggestion.userId, suggestion.userIsPro || false)}
                    disabled={toggleProMutation.isPending}
                    className="text-xs"
                  >
                    <Award className="h-3 w-3 mr-1" />
                    {suggestion.userIsPro ? 'Remove Trusted Status' : 'Grant Trusted Status'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Suggestion</DialogTitle>
            <DialogDescription>
              Optionally provide a reason for rejecting this suggestion.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection (optional)"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
