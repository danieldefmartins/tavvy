import React, { useState } from 'react';
import { MessageCircle, Lock, X, Lightbulb, Clock, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface NotesStepProps {
  notePublic: string;
  notePrivate: string;
  onNotePublicChange: (value: string) => void;
  onNotePrivateChange: (value: string) => void;
  onSkip: () => void;
}

const INSPIRATION_PROMPTS = [
  { icon: Lightbulb, title: 'Pro tip:', text: 'Share insider knowledge' },
  { icon: Clock, title: 'Best time to visit:', text: 'Timing advice' },
  { icon: Sparkles, title: "Don't miss:", text: 'Hidden gems' },
];

const STARTER_TEXTS: Record<string, string> = {
  'Pro tip:': 'Pro tip: ',
  'Best time to visit:': 'Best time to visit: ',
  "Don't miss:": "Don't miss: ",
};

export function NotesStep({
  notePublic,
  notePrivate,
  onNotePublicChange,
  onNotePrivateChange,
}: NotesStepProps) {
  const [showPrivate, setShowPrivate] = useState(notePrivate.length > 0);

  const publicCharPercent = (notePublic.length / 250) * 100;
  const privateCharPercent = (notePrivate.length / 250) * 100;

  const handleInspirationClick = (title: string) => {
    const starter = STARTER_TEXTS[title] || '';
    if (!notePublic.startsWith(starter)) {
      onNotePublicChange(starter);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">
      {/* Top Section - Optional Badge */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#008fc0]/10 text-[#008fc0] text-sm font-medium">
          <span>✨</span>
          <span>Optional - Skip if you prefer</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Your taps tell the story, but feel free to add context if you'd like!
        </p>
      </div>

      {/* Public Note Card */}
      <div className="bg-white dark:bg-card rounded-2xl shadow-md border border-border p-4 space-y-4">
        {/* Icon and Heading */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-base">Share tips with others</h3>
            <p className="text-sm text-muted-foreground">Help fellow travelers know what to expect</p>
          </div>
        </div>

        {/* Textarea */}
        <Textarea
          value={notePublic}
          onChange={(e) => onNotePublicChange(e.target.value.slice(0, 250))}
          placeholder="Example: The sunset views from site 42 are incredible! Bring bug spray in summer."
          className="resize-none text-base min-h-[100px] rounded-xl border-border focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          rows={4}
        />

        {/* Bottom Row */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <span>💡</span>
            <span>Be specific and helpful</span>
          </span>
          <span className={cn(
            'font-medium',
            publicCharPercent >= 90 ? 'text-orange-500' : 'text-muted-foreground'
          )}>
            {notePublic.length}/250
          </span>
        </div>
      </div>

      {/* Private Note Section */}
      {!showPrivate ? (
        <button
          onClick={() => setShowPrivate(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-500/10 transition-all text-muted-foreground hover:text-amber-600 active:scale-[0.98]"
        >
          <Lock className="w-4 h-4" />
          <span className="font-medium text-sm">Add private feedback for owner (optional)</span>
        </button>
      ) : (
        <div className="relative bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/30 p-4 space-y-4">
          {/* Close Button */}
          <button
            onClick={() => {
              setShowPrivate(false);
              onNotePrivateChange('');
            }}
            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-amber-200/50 dark:hover:bg-amber-500/20 transition-colors"
          >
            <X className="w-4 h-4 text-amber-600" />
          </button>

          {/* Icon and Heading */}
          <div className="flex items-start gap-3 pr-8">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/30 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base">Direct feedback for owner</h3>
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 font-medium mt-1">
                <span>🔒</span>
                <span>Only visible to the business owner</span>
              </span>
            </div>
          </div>

          {/* Textarea */}
          <Textarea
            value={notePrivate}
            onChange={(e) => onNotePrivateChange(e.target.value.slice(0, 250))}
            placeholder="Constructive feedback for the owner..."
            className="resize-none text-base min-h-[80px] rounded-xl bg-white dark:bg-background border-amber-200 dark:border-amber-500/30 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            rows={3}
          />

          {/* Bottom Row */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <span>🔒</span>
              <span>Constructive feedback helps owners improve</span>
            </span>
            <span className={cn(
              'font-medium',
              privateCharPercent >= 90 ? 'text-orange-500' : 'text-amber-600 dark:text-amber-400'
            )}>
              {notePrivate.length}/250
            </span>
          </div>
        </div>
      )}

      {/* Inspiration Prompts */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
          <span>💡</span>
          <span>Need inspiration?</span>
        </h4>
        <div className="grid gap-2">
          {INSPIRATION_PROMPTS.map((prompt) => {
            const Icon = prompt.icon;
            return (
              <button
                key={prompt.title}
                onClick={() => handleInspirationClick(prompt.title)}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-card border border-border hover:border-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-500/10 transition-all active:scale-[0.98] text-left"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-semibold text-foreground">{prompt.title}</span>{' '}
                  <span className="text-muted-foreground">{prompt.text}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
