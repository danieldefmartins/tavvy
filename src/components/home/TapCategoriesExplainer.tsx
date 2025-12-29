import { ThumbsUp, Sparkles, AlertTriangle, Info } from 'lucide-react';

/**
 * TapCategoriesExplainer - Fills blank space with helpful explanations
 * Shows users what each tap category means and how MUVO scoring works
 * Optimized for mobile view (99.9% of users)
 */
export function TapCategoriesExplainer() {
  return (
    <section className="py-8 px-4 bg-gradient-to-b from-muted/30 to-background">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            How MUVO Reviews Work
          </h2>
          <p className="text-sm text-muted-foreground">
            Three simple categories. No confusing star ratings.
          </p>
        </div>

        {/* Category 1: What Stood Out (Positive) */}
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[hsl(var(--signal-positive))]/10 flex items-center justify-center flex-shrink-0">
              <ThumbsUp className="w-5 h-5 text-[hsl(var(--signal-positive))]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">What Stood Out?</h3>
              <p className="text-xs text-muted-foreground">The best features</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Things that really impressed visitors and made their experience great. These are the highlights that make a place worth visiting.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 bg-[hsl(var(--signal-positive))]/10 text-[hsl(var(--signal-positive))] px-3 py-1 rounded-full text-xs font-medium">
              Level Sites
            </span>
            <span className="inline-flex items-center gap-1 bg-[hsl(var(--signal-positive))]/10 text-[hsl(var(--signal-positive))] px-3 py-1 rounded-full text-xs font-medium">
              Clean Bathrooms
            </span>
            <span className="inline-flex items-center gap-1 bg-[hsl(var(--signal-positive))]/10 text-[hsl(var(--signal-positive))] px-3 py-1 rounded-full text-xs font-medium">
              Friendly Staff
            </span>
          </div>
        </div>

        {/* Category 2: What's it like (Neutral) */}
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[hsl(var(--signal-neutral))]/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-[hsl(var(--signal-neutral))]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">What&apos;s it like?</h3>
              <p className="text-xs text-muted-foreground">The vibe & atmosphere</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Neutral characteristics that help you decide if this place matches your style. Not good or bad—just what it&apos;s like.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 bg-[hsl(var(--signal-neutral))]/10 text-[hsl(var(--signal-neutral))] px-3 py-1 rounded-full text-xs font-medium">
              Family-Friendly
            </span>
            <span className="inline-flex items-center gap-1 bg-[hsl(var(--signal-neutral))]/10 text-[hsl(var(--signal-neutral))] px-3 py-1 rounded-full text-xs font-medium">
              Rustic
            </span>
            <span className="inline-flex items-center gap-1 bg-[hsl(var(--signal-neutral))]/10 text-[hsl(var(--signal-neutral))] px-3 py-1 rounded-full text-xs font-medium">
              Quiet
            </span>
          </div>
        </div>

        {/* Category 3: What didn't work (Improvement) */}
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[hsl(var(--signal-negative))]/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-[hsl(var(--signal-negative))]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">What didn&apos;t work?</h3>
              <p className="text-xs text-muted-foreground">Honest feedback</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Issues or challenges visitors experienced. Helps you know what to expect and decide if it&apos;s a dealbreaker for you.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 bg-[hsl(var(--signal-negative))]/10 text-[hsl(var(--signal-negative))] px-3 py-1 rounded-full text-xs font-medium">
              Spotty WiFi
            </span>
            <span className="inline-flex items-center gap-1 bg-[hsl(var(--signal-negative))]/10 text-[hsl(var(--signal-negative))] px-3 py-1 rounded-full text-xs font-medium">
              Road Noise
            </span>
            <span className="inline-flex items-center gap-1 bg-[hsl(var(--signal-negative))]/10 text-[hsl(var(--signal-negative))] px-3 py-1 rounded-full text-xs font-medium">
              Tight Turns
            </span>
          </div>
        </div>

        {/* Why This is Better */}
        <div className="bg-primary/5 rounded-xl p-5 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-base text-foreground">
                Why No Star Ratings?
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Star ratings punish businesses unfairly. One bad day can tank a rating. With MUVO, you see <span className="font-medium text-foreground">both the good AND the bad</span>, so you can decide what matters to you.
              </p>
              <p className="text-xs text-muted-foreground italic">
                Example: "Spotty WiFi" might be a dealbreaker if you need to work, but perfect if you want to unplug!
              </p>
            </div>
          </div>
        </div>

        {/* MUVO Score Explanation */}
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border space-y-3">
          <h4 className="font-semibold text-base text-foreground">
            What&apos;s a MUVO Score?
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The MUVO Score is calculated from community taps. It weighs positive features, considers the vibe, and factors in issues—all while accounting for how recent the feedback is.
          </p>
          <div className="flex items-center justify-between pt-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">85+</div>
              <div className="text-xs text-muted-foreground">Excellent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">70-84</div>
              <div className="text-xs text-muted-foreground">Good</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">50-69</div>
              <div className="text-xs text-muted-foreground">Mixed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">&lt;50</div>
              <div className="text-xs text-muted-foreground">Issues</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-2">
          <p className="text-sm font-medium text-foreground mb-2">
            Ready to see it in action?
          </p>
          <p className="text-xs text-muted-foreground">
            Browse real places with real community reviews below
          </p>
        </div>
      </div>
    </section>
  );
}
