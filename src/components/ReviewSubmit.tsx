import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// This would come from Supabase in production
interface Signal {
  id: string;
  name: string;
  category: 'what_stood_out' | 'whats_it_like' | 'what_didnt_work';
  emoji: string;
  color: 'blue' | 'gray' | 'orange';
}

// Mock signals - in production, fetch from Supabase filtered by place type
const MOCK_SIGNALS: Signal[] = [
  // What Stood Out (Blue)
  { id: '1', name: 'Great Food', category: 'what_stood_out', emoji: '👍', color: 'blue' },
  { id: '2', name: 'Clean Bathrooms', category: 'what_stood_out', emoji: '👍', color: 'blue' },
  { id: '3', name: 'Friendly Staff', category: 'what_stood_out', emoji: '👍', color: 'blue' },
  { id: '4', name: 'Beautiful Views', category: 'what_stood_out', emoji: '👍', color: 'blue' },
  { id: '5', name: 'Good WiFi', category: 'what_stood_out', emoji: '👍', color: 'blue' },
  { id: '6', name: 'Great Location', category: 'what_stood_out', emoji: '👍', color: 'blue' },
  
  // What's it like (Gray)
  { id: '7', name: 'Rustic', category: 'whats_it_like', emoji: '⭐', color: 'gray' },
  { id: '8', name: 'Family-Friendly', category: 'whats_it_like', emoji: '⭐', color: 'gray' },
  { id: '9', name: 'Quiet', category: 'whats_it_like', emoji: '⭐', color: 'gray' },
  { id: '10', name: 'Pet-Friendly', category: 'whats_it_like', emoji: '⭐', color: 'gray' },
  { id: '11', name: 'Modern', category: 'whats_it_like', emoji: '⭐', color: 'gray' },
  { id: '12', name: 'Cozy', category: 'whats_it_like', emoji: '⭐', color: 'gray' },
  
  // What didn't work (Orange)
  { id: '13', name: 'Slow Service', category: 'what_didnt_work', emoji: '⚠️', color: 'orange' },
  { id: '14', name: 'Spotty WiFi', category: 'what_didnt_work', emoji: '⚠️', color: 'orange' },
  { id: '15', name: 'Too Noisy', category: 'what_didnt_work', emoji: '⚠️', color: 'orange' },
  { id: '16', name: 'Poor Lighting', category: 'what_didnt_work', emoji: '⚠️', color: 'orange' },
  { id: '17', name: 'Needs Maintenance', category: 'what_didnt_work', emoji: '⚠️', color: 'orange' },
  { id: '18', name: 'Overpriced', category: 'what_didnt_work', emoji: '⚠️', color: 'orange' },
];

const COLOR_CLASSES = {
  blue: {
    bg: 'bg-[#008fc0]',
    bgSelected: 'bg-[#008fc0]',
    bgUnselected: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-white',
    textUnselected: 'text-gray-700 dark:text-gray-300',
    border: 'border-[#008fc0]',
  },
  gray: {
    bg: 'bg-gray-500',
    bgSelected: 'bg-gray-500',
    bgUnselected: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-white',
    textUnselected: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-500',
  },
  orange: {
    bg: 'bg-orange-500',
    bgSelected: 'bg-orange-500',
    bgUnselected: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-white',
    textUnselected: 'text-gray-700 dark:text-gray-300',
    border: 'border-orange-500',
  },
};

const CATEGORY_INFO = {
  what_stood_out: {
    title: '👍 What Stood Out',
    subtitle: 'Tap the positive signals',
    color: 'blue' as const,
  },
  whats_it_like: {
    title: '⭐ What\'s it like',
    subtitle: 'Tap the vibe/atmosphere',
    color: 'gray' as const,
  },
  what_didnt_work: {
    title: '⚠️ What didn\'t work',
    subtitle: 'Tap what needs improvement',
    color: 'orange' as const,
  },
};

export function ReviewSubmit() {
  const { placeId } = useParams<{ placeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSignals, setSelectedSignals] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSignal = (signalId: string) => {
    setSelectedSignals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(signalId)) {
        newSet.delete(signalId);
      } else {
        newSet.add(signalId);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (selectedSignals.size === 0) {
      toast({
        title: 'No signals selected',
        description: 'Please tap at least one signal to submit your review.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Replace with actual Supabase call
      // const { data: review } = await supabase
      //   .from('reviews')
      //   .insert({ place_id: placeId, user_id: user.id })
      //   .select()
      //   .single();
      //
      // const signalInserts = Array.from(selectedSignals).map(signalId => ({
      //   review_id: review.id,
      //   signal_id: signalId,
      // }));
      //
      // await supabase.from('review_signals').insert(signalInserts);
      // await supabase.rpc('refresh_aggregated_signals');

      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Review submitted!',
        description: `You tapped ${selectedSignals.size} signals. Thanks for helping others!`,
      });

      navigate(`/place/${placeId}`);
    } catch (error) {
      toast({
        title: 'Error submitting review',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const signalsByCategory = {
    what_stood_out: MOCK_SIGNALS.filter(s => s.category === 'what_stood_out'),
    whats_it_like: MOCK_SIGNALS.filter(s => s.category === 'whats_it_like'),
    what_didnt_work: MOCK_SIGNALS.filter(s => s.category === 'what_didnt_work'),
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-[#008fc0] text-white px-4 py-6">
        <h1 className="text-2xl font-bold mb-2">Leave a Review</h1>
        <p className="text-sm opacity-90">
          Tap the signals that describe your experience. Takes 10 seconds!
        </p>
      </div>

      {/* Categories */}
      <div className="px-4 py-6 space-y-8">
        {(Object.keys(signalsByCategory) as Array<keyof typeof signalsByCategory>).map(category => {
          const info = CATEGORY_INFO[category];
          const signals = signalsByCategory[category];
          const selectedInCategory = signals.filter(s => selectedSignals.has(s.id)).length;

          return (
            <div key={category} className="space-y-3">
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{info.title}</h2>
                  <p className="text-sm text-muted-foreground">{info.subtitle}</p>
                </div>
                {selectedInCategory > 0 && (
                  <div className="text-sm font-semibold text-[#008fc0]">
                    {selectedInCategory} selected
                  </div>
                )}
              </div>

              {/* Signal Buttons */}
              <div className="flex flex-wrap gap-2">
                {signals.map(signal => {
                  const isSelected = selectedSignals.has(signal.id);
                  const colors = COLOR_CLASSES[signal.color];

                  return (
                    <button
                      key={signal.id}
                      onClick={() => toggleSignal(signal.id)}
                      className={`
                        relative px-4 py-2.5 rounded-full text-sm font-medium
                        transition-all duration-200
                        ${isSelected ? colors.bgSelected : colors.bgUnselected}
                        ${isSelected ? colors.text : colors.textUnselected}
                        ${isSelected ? 'border-2' : 'border-2 border-gray-300 dark:border-gray-700'}
                        ${isSelected ? colors.border : ''}
                        hover:scale-105 active:scale-95
                      `}
                    >
                      <span className="flex items-center gap-1.5">
                        {signal.emoji} {signal.name}
                        {isSelected && (
                          <Check className="w-4 h-4 ml-1" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Button (Fixed at bottom) */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
        <div className="max-w-md mx-auto space-y-3">
          <div className="text-center text-sm text-muted-foreground">
            {selectedSignals.size === 0 ? (
              'Tap at least one signal to submit'
            ) : (
              `${selectedSignals.size} signal${selectedSignals.size === 1 ? '' : 's'} selected`
            )}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={selectedSignals.size === 0 || isSubmitting}
            className="w-full bg-[#008fc0] hover:bg-[#007aa8] text-white text-lg py-6"
            size="lg"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </div>
    </div>
  );
}
