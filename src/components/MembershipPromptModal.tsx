import { useState } from 'react';
import { Ticket, X, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MembershipSelector } from './MembershipSelector';
import { useMarkMembershipPromptShown } from '@/hooks/useMemberships';

interface MembershipPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MembershipPromptModal({ open, onOpenChange }: MembershipPromptModalProps) {
  const [showSelector, setShowSelector] = useState(false);
  const markPromptShown = useMarkMembershipPromptShown();

  const handleNotNow = async () => {
    await markPromptShown.mutateAsync();
    onOpenChange(false);
  };

  const handleAddMemberships = () => {
    setShowSelector(true);
  };

  const handleDone = async () => {
    await markPromptShown.mutateAsync();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            {showSelector ? 'Select Your Memberships' : 'See Included Parks'}
          </DialogTitle>
          <DialogDescription>
            {showSelector
              ? 'Select the campground memberships you have. Changes apply immediately.'
              : 'Want to see parks included in memberships you may already have?'
            }
          </DialogDescription>
        </DialogHeader>

        {showSelector ? (
          <div className="space-y-4">
            <MembershipSelector />
            <Button 
              onClick={handleDone} 
              className="w-full"
              disabled={markPromptShown.isPending}
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Many RVers save thousands using campground memberships like Thousand Trails, 
                Harvest Hosts, and Passport America. MUVO helps you find parks included in 
                your memberships.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleNotNow}
                disabled={markPromptShown.isPending}
              >
                Not now
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddMemberships}
              >
                Add memberships
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
