import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  MapPin,
  Check,
  X,
  Eye,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useIsAdmin } from '@/hooks/useAdmin';
import {
  usePendingSubmissions,
  useAllSubmissions,
  useApproveSubmission,
  useRejectSubmission,
  PlaceSubmission,
} from '@/hooks/usePlaceSubmissions';
import { useNavigate } from 'react-router-dom';

export default function AdminPlaceSubmissions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: pendingSubmissions, isLoading: pendingLoading } = usePendingSubmissions();
  const { data: allSubmissions, isLoading: allLoading } = useAllSubmissions();

  const approveSubmission = useApproveSubmission();
  const rejectSubmission = useRejectSubmission();

  const [selectedSubmission, setSelectedSubmission] = useState<PlaceSubmission | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submissionToReject, setSubmissionToReject] = useState<string | null>(null);

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack />
        <main className="container max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack />
        <main className="container max-w-4xl mx-auto px-4 py-12 text-center">
          <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground">
            You don't have permission to view this page.
          </p>
        </main>
      </div>
    );
  }

  const handleApprove = async (submission: PlaceSubmission) => {
    try {
      const newPlace = await approveSubmission.mutateAsync(submission.id);
      toast({
        title: 'Place approved',
        description: `"${submission.name}" has been added to the map.`,
      });
      setSelectedSubmission(null);
      // Navigate to the new place
      if (newPlace?.id) {
        navigate(`/place/${newPlace.id}`);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve submission.',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!submissionToReject || !rejectReason.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await rejectSubmission.mutateAsync({
        submissionId: submissionToReject,
        reason: rejectReason.trim(),
      });
      toast({
        title: 'Submission rejected',
        description: 'The submission has been rejected.',
      });
      setRejectDialogOpen(false);
      setRejectReason('');
      setSubmissionToReject(null);
      setSelectedSubmission(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject submission.',
        variant: 'destructive',
      });
    }
  };

  const openRejectDialog = (submissionId: string) => {
    setSubmissionToReject(submissionId);
    setRejectDialogOpen(true);
  };

  const getStatusBadge = (status: PlaceSubmission['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    }
  };

  const renderSubmissionCard = (submission: PlaceSubmission, showActions = false) => (
    <Card key={submission.id} className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold">{submission.name}</h3>
            {getStatusBadge(submission.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            {submission.primaryCategory}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Submitted {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
            {submission.submitterName && ` by ${submission.submitterName}`}
          </p>
          {submission.rejectionReason && (
            <p className="text-xs text-destructive mt-1">
              Rejected: {submission.rejectionReason}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedSubmission(submission)}
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {showActions && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => handleApprove(submission)}
                disabled={approveSubmission.isPending}
                title="Approve"
              >
                {approveSubmission.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => openRejectDialog(submission.id)}
                title="Reject"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header showBack />
      <main className="container max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">
              Pending ({pendingSubmissions?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="all">All Submissions</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </Card>
                ))}
              </div>
            ) : pendingSubmissions?.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No pending submissions</h2>
                <p className="text-muted-foreground">
                  All place submissions have been reviewed.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingSubmissions?.map((submission) =>
                  renderSubmissionCard(submission, true)
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all">
            {allLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {allSubmissions?.map((submission) =>
                  renderSubmissionCard(submission, submission.status === 'pending')
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedSubmission?.name}</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <p className="font-medium">{selectedSubmission.primaryCategory}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p>{getStatusBadge(selectedSubmission.status)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <p className="font-medium">
                    {selectedSubmission.latitude.toFixed(4)}, {selectedSubmission.longitude.toFixed(4)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Submitted by:</span>
                  <p className="font-medium">{selectedSubmission.submitterName || 'Unknown'}</p>
                </div>
              </div>

              {selectedSubmission.description && (
                <div>
                  <span className="text-sm text-muted-foreground">Description:</span>
                  <p className="text-sm">{selectedSubmission.description}</p>
                </div>
              )}

              {selectedSubmission.features.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Features:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedSubmission.features.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedSubmission.status === 'pending' && (
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => openRejectDialog(selectedSubmission.id)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedSubmission)}
                    disabled={approveSubmission.isPending}
                  >
                    {approveSubmission.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for rejecting this submission.
            </p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Duplicate entry, incorrect location, etc."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectSubmission.isPending || !rejectReason.trim()}
            >
              {rejectSubmission.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
