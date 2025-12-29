import { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  AlertTriangle,
  Ruler,
  Mountain,
  RotateCcw,
  Calendar,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { EntranceData } from '@/types/entrance';

interface PlaceEntrancesProps {
  entrances: EntranceData[];
  placeName: string;
  onAddEntrance?: () => void;
  canAddEntrance?: boolean;
}

export function PlaceEntrances({ entrances, placeName, onAddEntrance, canAddEntrance = false }: PlaceEntrancesProps) {
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});

  const handleNavigate = (entrance: EntranceData) => {
    const destination = `${entrance.latitude},${entrance.longitude}`;
    const label = encodeURIComponent(`${placeName} - ${entrance.name}`);
    
    // Try to detect platform and open appropriate maps app
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      window.open(`maps://maps.apple.com/?daddr=${destination}&dirflg=d`, '_blank');
    } else if (isAndroid) {
      window.open(`geo:${destination}?q=${destination}(${label})`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
    }
  };

  const toggleNotes = (index: number) => {
    setExpandedNotes(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Helper to get RV warning badges
  const getRVWarnings = (entrance: EntranceData) => {
    const warnings: { icon: React.ReactNode; text: string; variant: 'warning' | 'destructive' | 'secondary' }[] = [];
    
    if (entrance.lowClearance === true) {
      warnings.push({ 
        icon: <AlertTriangle className="w-3 h-3" />, 
        text: 'Low Clearance', 
        variant: 'destructive' 
      });
    }
    if (entrance.tightTurns === true) {
      warnings.push({ 
        icon: <RotateCcw className="w-3 h-3" />, 
        text: 'Tight Turns', 
        variant: 'warning' 
      });
    }
    if (entrance.grade === 'steep') {
      warnings.push({ 
        icon: <Mountain className="w-3 h-3" />, 
        text: 'Steep Grade', 
        variant: 'warning' 
      });
    }
    if (entrance.seasonalAccess === 'seasonal') {
      warnings.push({ 
        icon: <Calendar className="w-3 h-3" />, 
        text: 'Seasonal', 
        variant: 'secondary' 
      });
    }
    
    return warnings;
  };

  // Check if entrance has any RV info worth showing
  const hasRVInfo = (entrance: EntranceData) => {
    return entrance.maxRvLengthFt || entrance.maxRvHeightFt || entrance.roadType || entrance.grade;
  };

  return (
    <section className="animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Entrances
        </h2>
        {canAddEntrance && onAddEntrance && entrances.length < 6 && (
          <Button variant="ghost" size="sm" onClick={onAddEntrance} className="gap-1">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        )}
      </div>
      
      {entrances.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">No entrances added yet</p>
          {canAddEntrance && onAddEntrance && (
            <Button variant="outline" size="sm" onClick={onAddEntrance} className="gap-1">
              <Plus className="w-4 h-4" />
              Add First Entrance
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {entrances.map((entrance, index) => {
            const warnings = getRVWarnings(entrance);
            const showRVInfo = hasRVInfo(entrance);
            const notesContent = entrance.notes || entrance.seasonalNotes;
            
            return (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Name + Primary Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-foreground">{entrance.name}</h3>
                      {entrance.isPrimary && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          Primary
                        </Badge>
                      )}
                    </div>
                    
                    {/* Road/Access info */}
                    {entrance.road && (
                      <p className="text-sm text-muted-foreground mt-1">
                        via {entrance.road}
                      </p>
                    )}

                    {/* RV Warnings (icons only for compact display) */}
                    {warnings.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {warnings.map((warning, i) => (
                          <Badge 
                            key={i} 
                            variant={warning.variant === 'warning' ? 'outline' : warning.variant}
                            className={`text-xs gap-1 ${
                              warning.variant === 'warning' 
                                ? 'border-warning text-warning bg-warning/10' 
                                : ''
                            }`}
                          >
                            {warning.icon}
                            {warning.text}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* RV Specs (if available) */}
                    {showRVInfo && (
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        {entrance.maxRvLengthFt && (
                          <span className="flex items-center gap-1">
                            <Ruler className="w-3 h-3" />
                            Max {entrance.maxRvLengthFt}ft
                          </span>
                        )}
                        {entrance.maxRvHeightFt && (
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Max {entrance.maxRvHeightFt}ft tall
                          </span>
                        )}
                        {entrance.roadType && (
                          <span className="capitalize">{entrance.roadType} road</span>
                        )}
                        {entrance.grade && entrance.grade !== 'steep' && (
                          <span className="capitalize">{entrance.grade} grade</span>
                        )}
                      </div>
                    )}

                    {/* Expandable Notes */}
                    {notesContent && (
                      <div className="mt-2">
                        {notesContent.length > 80 ? (
                          <Collapsible 
                            open={expandedNotes[index]} 
                            onOpenChange={() => toggleNotes(index)}
                          >
                            <p className="text-sm text-muted-foreground">
                              {expandedNotes[index] 
                                ? notesContent 
                                : `${notesContent.slice(0, 80)}...`
                              }
                            </p>
                            <CollapsibleTrigger className="text-xs text-primary hover:underline mt-1 flex items-center gap-1">
                              {expandedNotes[index] ? (
                                <>Show less <ChevronUp className="w-3 h-3" /></>
                              ) : (
                                <>Show more <ChevronDown className="w-3 h-3" /></>
                              )}
                            </CollapsibleTrigger>
                          </Collapsible>
                        ) : (
                          <p className="text-sm text-muted-foreground">{notesContent}</p>
                        )}
                      </div>
                    )}

                    {/* Coordinates */}
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      {entrance.latitude.toFixed(4)}°N, {Math.abs(entrance.longitude).toFixed(4)}°W
                    </p>
                  </div>

                  {/* Navigate Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => handleNavigate(entrance)}
                  >
                    <Navigation className="w-4 h-4 mr-1.5" />
                    Navigate
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// Re-export for backwards compatibility
export type { EntranceData as Entrance } from '@/types/entrance';
export { extractEntrancesWithRVData as extractEntrances } from '@/hooks/useEntrances';
