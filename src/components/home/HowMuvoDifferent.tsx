import { ThumbsUp, Star, AlertTriangle } from 'lucide-react';

export function HowMuvoDifferent() {
  return (
    <section className="bg-muted/30 py-12 md:py-16 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center mb-2">
          HOW MUVO IS DIFFERENT
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-2">
          How MUVO is Different
        </h2>
        <p className="text-base text-muted-foreground text-center mb-8 md:mb-12">
          Real signals, not confusing star ratings
        </p>

        {/* Mobile Layout: Stacked */}
        <div className="md:hidden flex flex-col items-center">
          {/* Phone Mockup Card */}
          <div className="w-full max-w-sm bg-card rounded-xl overflow-hidden shadow-card border border-border mb-8">
            <img
              src="/demo/rv-park-scenic.jpg"
              alt="RV Park example"
              className="w-full h-40 object-cover"
            />
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-center gap-2 min-w-[192px] bg-[hsl(var(--signal-positive))] text-white px-3 py-2 rounded-full text-sm">
                <ThumbsUp className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Best for:</span>
                <span>Level Sites</span>
                <span className="font-bold">×62</span>
              </div>
              <div className="flex items-center justify-center gap-2 min-w-[192px] bg-[hsl(var(--signal-neutral))] text-white px-3 py-2 rounded-full text-sm">
                <Star className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Vibe:</span>
                <span>Family-Friendly</span>
                <span className="font-bold">×28</span>
              </div>
              <div className="flex items-center justify-center gap-2 min-w-[192px] bg-[hsl(var(--signal-negative))] text-white px-3 py-2 rounded-full text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Heads up:</span>
                <span>Spotty WiFi</span>
                <span className="font-bold">×18</span>
              </div>
            </div>
          </div>

          {/* Explanations List */}
          <div className="w-full max-w-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-[hsl(var(--signal-positive))] flex-shrink-0" />
              <span className="text-lg text-foreground/80">What Stood Out?</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-[hsl(var(--signal-neutral))] flex-shrink-0" />
              <span className="text-lg text-foreground/80">What&apos;s it like?</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-[hsl(var(--signal-negative))] flex-shrink-0" />
              <span className="text-lg text-foreground/80">What didn&apos;t work?</span>
            </div>
          </div>
        </div>

        {/* Desktop Layout: Two Columns */}
        <div className="hidden md:grid grid-cols-2 gap-8 items-start max-w-4xl mx-auto">
          {/* Phone Mockup Card - Left */}
          <div className="bg-card rounded-xl overflow-hidden shadow-card border border-border">
            <img
              src="/demo/rv-park-scenic.jpg"
              alt="RV Park example"
              className="w-full h-48 object-cover"
            />
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-center gap-2 min-w-[192px] bg-[hsl(var(--signal-positive))] text-white px-4 py-2.5 rounded-full text-sm">
                <ThumbsUp className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Best for:</span>
                <span>Level Sites</span>
                <span className="font-bold">×62</span>
              </div>
              <div className="flex items-center justify-center gap-2 min-w-[192px] bg-[hsl(var(--signal-neutral))] text-white px-4 py-2.5 rounded-full text-sm">
                <Star className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Vibe:</span>
                <span>Family-Friendly</span>
                <span className="font-bold">×28</span>
              </div>
              <div className="flex items-center justify-center gap-2 min-w-[192px] bg-[hsl(var(--signal-negative))] text-white px-4 py-2.5 rounded-full text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Heads up:</span>
                <span>Spotty WiFi</span>
                <span className="font-bold">×18</span>
              </div>
            </div>
          </div>

          {/* Explanations - Right, aligned with badges */}
          <div className="flex flex-col justify-end" style={{ paddingTop: '192px' }}>
            <div className="space-y-3">
              <div className="flex items-center gap-3 h-[44px]">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--signal-positive))] flex-shrink-0" />
                <span className="text-base text-muted-foreground">What Stood Out?</span>
              </div>
              <div className="flex items-center gap-3 h-[44px]">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--signal-neutral))] flex-shrink-0" />
                <span className="text-base text-muted-foreground">What&apos;s it like?</span>
              </div>
              <div className="flex items-center gap-3 h-[44px]">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--signal-negative))] flex-shrink-0" />
                <span className="text-base text-muted-foreground">What didn&apos;t work?</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
