import { Clock, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrustedBadge } from '@/components/TrustedBadge';
import { usePlaceSuggestions, FIELD_LABELS, Suggestion } from '@/hooks/useSuggestions';
import { formatDistanceToNow } from 'date-fns';

interface PendingSuggestionsProps {
  placeId: string;
}

export function PendingSuggestions({ placeId }: PendingSuggestionsProps) {
  const { data: suggestions, isLoading, error } = usePlaceSuggestions(placeId);

  const pendingSuggestions = suggestions?.filter((s) => s.status === 'pending') || [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error || pendingSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-foreground">Pending Updates</h3>
        <Badge variant="secondary" className="text-xs">
          {pendingSuggestions.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {pendingSuggestions.map((suggestion) => (
          <SuggestionCard key={suggestion.id} suggestion={suggestion} />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        These suggested updates are pending review and have not been verified.
      </p>
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  return (
    <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-warning/10 border-warning/30 text-warning">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
          <span className="text-xs text-muted-foreground">
            {FIELD_LABELS[suggestion.fieldName] || suggestion.fieldName}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-2">
        <div>
          <p className="text-xs text-muted-foreground">Current</p>
          <p className="text-foreground truncate">
            {suggestion.currentValue || <span className="italic text-muted-foreground">Not set</span>}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Suggested</p>
          <p className="text-foreground font-medium truncate">{suggestion.suggestedValue}</p>
        </div>
      </div>

      {suggestion.notes && (
        <p className="text-xs text-muted-foreground italic mb-2">"{suggestion.notes}"</p>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <User className="w-3 h-3" />
        <span className="flex items-center gap-1">
          {suggestion.userDisplayName}
          {suggestion.userIsPro && <TrustedBadge showLabel={false} />}
        </span>
        {suggestion.userIsPro && (
          <span className="text-primary text-xs">Trusted Contributor</span>
        )}
        <span>•</span>
        <span>{formatDistanceToNow(suggestion.createdAt, { addSuffix: true })}</span>
      </div>
    </div>
  );
}
