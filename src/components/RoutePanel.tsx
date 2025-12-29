import { useState, useCallback } from 'react';
import { RouteInput } from './RouteInput';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Route, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RouteLocation {
  name: string;
  coordinates: [number, number];
}

interface RoutePanelProps {
  mapboxToken: string;
  start: RouteLocation | null;
  end: RouteLocation | null;
  onStartChange: (location: RouteLocation | null) => void;
  onEndChange: (location: RouteLocation | null) => void;
  bufferDistance: number;
  onBufferDistanceChange: (distance: number) => void;
  onClearRoute: () => void;
  placesInRange: number;
  isLoading?: boolean;
  className?: string;
}

export function RoutePanel({
  mapboxToken,
  start,
  end,
  onStartChange,
  onEndChange,
  bufferDistance,
  onBufferDistanceChange,
  onClearRoute,
  placesInRange,
  isLoading,
  className,
}: RoutePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasRoute = start && end;

  return (
    <div className={cn('bg-background/95 backdrop-blur-sm rounded-lg border border-border shadow-lg', className)}>
      {/* Header */}
      <button
        className="w-full px-4 py-3 flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Route Planning</span>
          {hasRoute && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {placesInRange} places nearby
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Start input */}
          <RouteInput
            mapboxToken={mapboxToken}
            placeholder="Starting point"
            icon="start"
            value={start}
            onChange={onStartChange}
          />

          {/* End input */}
          <RouteInput
            mapboxToken={mapboxToken}
            placeholder="Destination"
            icon="end"
            value={end}
            onChange={onEndChange}
          />

          {/* Distance buffer slider */}
          {hasRoute && (
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Show places within
                </span>
                <span className="text-xs font-medium">
                  {bufferDistance} miles
                </span>
              </div>
              <Slider
                value={[bufferDistance]}
                onValueChange={([value]) => onBufferDistanceChange(value)}
                min={5}
                max={50}
                step={5}
                className="w-full"
              />
            </div>
          )}

          {/* Clear route button */}
          {hasRoute && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onClearRoute}
            >
              <X className="w-4 h-4 mr-2" />
              Clear Route
            </Button>
          )}

          {/* Loading state */}
          {isLoading && (
            <p className="text-xs text-muted-foreground text-center">
              Calculating route...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
