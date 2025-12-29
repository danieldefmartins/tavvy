import React from 'react';
import { Info } from 'lucide-react';

export function ReviewFooterMessage() {
  return (
    <div className="flex items-start gap-2 py-4 mt-4 border-t border-border">
      <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground">
        Reviews here show what's good and what needs work — not just one score
      </p>
    </div>
  );
}
