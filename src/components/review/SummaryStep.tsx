import React from 'react';
import * as LucideIcons from 'lucide-react';
import { ThumbsUp, Sparkles, AlertTriangle, MessageCircle, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StampDefinition } from '@/hooks/useStamps';

interface SummaryStepProps {
  positiveSignals: Map<string, number>;
  improvementSignals: Map<string, number>;
  neutralSignals: Map<string, number>;
  positiveStamps: StampDefinition[];
  improvementStamps: StampDefinition[];
  neutralStamps: StampDefinition[];
  notePublic: string;
  notePrivate: string;
  onEditNote: () => void;
}

export function SummaryStep({
  positiveSignals,
  improvementSignals,
  neutralSignals,
  positiveStamps,
  improvementStamps,
  neutralStamps,
  notePublic,
  notePrivate,
  onEditNote,
}: SummaryStepProps) {
  const totalSignals = positiveSignals.size + improvementSignals.size + neutralSignals.size;
  
  // Count categories with signals
  const categoriesCount = [
    positiveSignals.size > 0,
    neutralSignals.size > 0,
    improvementSignals.size > 0,
  ].filter(Boolean).length;

  const renderBadges = (
    stampMap: Map<string, number>,
    stampList: StampDefinition[],
    type: 'positive' | 'neutral' | 'improvement'
  ) => {
    const getBgColor = () => {
      switch (type) {
        case 'positive':
          return 'bg-[hsl(var(--signal-positive))]';
        case 'neutral':
          return 'bg-[hsl(var(--signal-neutral))]';
        case 'improvement':
          return 'bg-[hsl(var(--signal-negative))]';
      }
    };

    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from(stampMap.entries()).map(([id, level], index) => {
          const stamp = stampList.find((s) => s.id === id);
          if (!stamp) return null;
          const Icon = stamp.icon
            ? (LucideIcons as any)[stamp.icon] || LucideIcons.Circle
            : LucideIcons.Circle;

          return (
            <div
              key={id}
              className={cn(
                'w-full inline-flex items-center justify-between gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white shadow-sm',
                'animate-fade-in',
                getBgColor(),
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <Icon size={16} className="flex-shrink-0" />
                <span className="truncate">{stamp.label}</span>
              </span>

              <div className="flex gap-1 ml-2 flex-shrink-0">
                {[1, 2, 3].map((d) => (
                  <div
                    key={d}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      d <= level ? 'bg-white/90' : 'bg-white/30',
                    )}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Celebration Banner */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 px-5 py-6 text-center relative overflow-hidden">
        {/* Sparkle decorations */}
        <div className="absolute top-2 left-4 text-yellow-400 animate-pulse">✨</div>
        <div className="absolute top-4 right-6 text-yellow-400 animate-pulse" style={{ animationDelay: '0.3s' }}>✨</div>
        <div className="absolute bottom-3 left-8 text-cyan-400 animate-pulse" style={{ animationDelay: '0.5s' }}>⭐</div>
        <div className="absolute bottom-2 right-4 text-cyan-400 animate-pulse" style={{ animationDelay: '0.7s' }}>⭐</div>
        
        <div className="text-4xl mb-2">🎉</div>
        <h3 className="text-2xl font-bold text-foreground mb-1">Nice Work!</h3>
        <p className="text-muted-foreground text-sm">
          You tapped {totalSignals} signal{totalSignals !== 1 ? 's' : ''} across {categoriesCount} categor{categoriesCount !== 1 ? 'ies' : 'y'}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="px-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[hsl(var(--signal-positive))]/10 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-[hsl(var(--signal-positive))]">👍 {positiveSignals.size}</div>
            <div className="text-xs text-muted-foreground font-medium">Best For</div>
          </div>
          <div className="bg-[hsl(var(--signal-neutral))]/10 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-[hsl(var(--signal-neutral))]">⭐ {neutralSignals.size}</div>
            <div className="text-xs text-muted-foreground font-medium">Vibe</div>
          </div>
          <div className="bg-[hsl(var(--signal-negative))]/10 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-[hsl(var(--signal-negative))]">⚠️ {improvementSignals.size}</div>
            <div className="text-xs text-muted-foreground font-medium">Heads Up</div>
          </div>
        </div>
      </div>

      {/* Review Sections */}
      <div className="px-4 space-y-6">
        {positiveSignals.size > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--signal-positive))]/20 flex items-center justify-center">
                <ThumbsUp className="w-4 h-4 text-[hsl(var(--signal-positive))]" />
              </div>
              <span className="text-xl font-bold text-foreground">Highlights</span>
            </div>
            {renderBadges(positiveSignals, positiveStamps, 'positive')}
          </div>
        )}

        {neutralSignals.size > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--signal-neutral))]/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[hsl(var(--signal-neutral))]" />
              </div>
              <span className="text-xl font-bold text-foreground">Vibe</span>
            </div>
            {renderBadges(neutralSignals, neutralStamps, 'neutral')}
          </div>
        )}

        {improvementSignals.size > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--signal-negative))]/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-[hsl(var(--signal-negative))]" />
              </div>
              <span className="text-xl font-bold text-foreground">Needs Work</span>
            </div>
            {renderBadges(improvementSignals, improvementStamps, 'improvement')}
          </div>
        )}

        {totalSignals === 0 && (
          <p className="text-base text-muted-foreground text-center py-8">
            Add at least one stamp to submit.
          </p>
        )}

        {/* Note Preview */}
        {(notePublic || notePrivate) && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-foreground">You added a helpful note</span>
              </div>
              <button
                onClick={onEditNote}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>
            {notePublic && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {notePublic.length > 80 ? `${notePublic.slice(0, 80)}...` : notePublic}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Trust indicator */}
      <div className="px-4 pb-2">
        <p className="text-xs text-muted-foreground text-center">
          🔒 Your email stays private
        </p>
      </div>
    </div>
  );
}
