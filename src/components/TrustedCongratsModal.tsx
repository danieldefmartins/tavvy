import { useEffect, useState } from 'react';
import { Shield, Award, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCheckNewTrusted } from '@/hooks/useUsers';
import { hapticMedium } from '@/lib/haptics';

const TRUSTED_CONGRATS_SHOWN_KEY = 'trusted_congrats_shown';

export function TrustedCongratsModal() {
  const { data } = useCheckNewTrusted();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (data?.isNewlyTrusted) {
      // Check if we've already shown the congrats
      const lastShown = localStorage.getItem(TRUSTED_CONGRATS_SHOWN_KEY);
      const now = Date.now();
      
      // Only show if never shown or shown more than 24 hours ago
      if (!lastShown || (now - parseInt(lastShown)) > 24 * 60 * 60 * 1000) {
        hapticMedium();
        setIsOpen(true);
        localStorage.setItem(TRUSTED_CONGRATS_SHOWN_KEY, now.toString());
      }
    }
  }, [data?.isNewlyTrusted]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="text-center max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-amber-500 fill-amber-500/50" />
          </div>
          <DialogTitle className="text-xl">
            <Sparkles className="w-5 h-5 inline mr-2 text-amber-500" />
            You're Now a Trusted Contributor!
            <Sparkles className="w-5 h-5 inline ml-2 text-amber-500" />
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-muted-foreground">
            Thank you for your {data?.contributionCount || 10}+ contributions to the community!
          </p>

          <div className="flex items-center justify-center gap-2 text-sm">
            <Award className="w-5 h-5 text-primary" />
            <span>Your contributions now carry extra trust</span>
          </div>

          <div className="bg-secondary/50 rounded-lg p-3 text-sm text-left space-y-2">
            <p className="font-medium">As a Trusted Contributor, you'll have:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• A badge next to your name</li>
              <li>• Higher visibility on your contributions</li>
              <li>• Recognition in the community</li>
            </ul>
          </div>
        </div>

        <Button onClick={() => setIsOpen(false)} className="w-full">
          Awesome!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
