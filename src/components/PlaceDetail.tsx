import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock data - in production, fetch from Supabase
interface AggregatedSignal {
  signal_id: string;
  signal_name: string;
  signal_emoji: string;
  signal_category: 'what_stood_out' | 'whats_it_like' | 'what_didnt_work';
  signal_color: 'blue' | 'gray' | 'orange';
  count: number;
}

interface Place {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  category: string;
  description?: string;
  image_url?: string;
  review_count: number;
  last_review_at?: string;
}

// Mock place data
const MOCK_PLACE: Place = {
  id: '1',
  name: 'Mountain View Campground',
  address: '123 Scenic Drive',
  city: 'Boulder',
  state: 'CO',
  category: 'RV Park',
  description: 'Beautiful mountain views with full hookups and modern amenities.',
  image_url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
  review_count: 127,
  last_review_at: '2024-12-27T10:30:00Z',
};

// Mock aggregated signals
const MOCK_SIGNALS: AggregatedSignal[] = [
  { signal_id: '1', signal_name: 'Beautiful Views', signal_emoji: '👍', signal_category: 'what_stood_out', signal_color: 'blue', count: 89 },
  { signal_id: '2', signal_name: 'Clean Bathrooms', signal_emoji: '👍', signal_category: 'what_stood_out', signal_color: 'blue', count: 76 },
  { signal_id: '3', signal_name: 'Friendly Staff', signal_emoji: '👍', signal_category: 'what_stood_out', signal_color: 'blue', count: 68 },
  { signal_id: '4', signal_name: 'Level Sites', signal_emoji: '👍', signal_category: 'what_stood_out', signal_color: 'blue', count: 54 },
  { signal_id: '5', signal_name: 'Good WiFi', signal_emoji: '👍', signal_category: 'what_stood_out', signal_color: 'blue', count: 42 },
  
  { signal_id: '6', signal_name: 'Quiet', signal_emoji: '⭐', signal_category: 'whats_it_like', signal_color: 'gray', count: 71 },
  { signal_id: '7', signal_name: 'Family-Friendly', signal_emoji: '⭐', signal_category: 'whats_it_like', signal_color: 'gray', count: 58 },
  { signal_id: '8', signal_name: 'Pet-Friendly', signal_emoji: '⭐', signal_category: 'whats_it_like', signal_color: 'gray', count: 45 },
  { signal_id: '9', signal_name: 'Rustic', signal_emoji: '⭐', signal_category: 'whats_it_like', signal_color: 'gray', count: 33 },
  
  { signal_id: '10', signal_name: 'Spotty WiFi', signal_emoji: '⚠️', signal_category: 'what_didnt_work', signal_color: 'orange', count: 23 },
  { signal_id: '11', signal_name: 'Road Noise', signal_emoji: '⚠️', signal_category: 'what_didnt_work', signal_color: 'orange', count: 15 },
  { signal_id: '12', signal_name: 'No Shade', signal_emoji: '⚠️', signal_category: 'what_didnt_work', signal_color: 'orange', count: 12 },
];

const COLOR_CLASSES = {
  blue: 'bg-[#008fc0] text-white',
  gray: 'bg-gray-500 text-white',
  orange: 'bg-orange-500 text-white',
};

const CATEGORY_TITLES = {
  what_stood_out: '👍 What Stood Out',
  whats_it_like: '⭐ What\'s it like',
  what_didnt_work: '⚠️ What didn\'t work',
};

export function PlaceDetail() {
  const { placeId } = useParams<{ placeId: string }>();
  const [place] = useState<Place>(MOCK_PLACE);
  const [signals] = useState<AggregatedSignal[]>(MOCK_SIGNALS);

  // Group signals by category
  const signalsByCategory = {
    what_stood_out: signals.filter(s => s.signal_category === 'what_stood_out' && s.count > 0).sort((a, b) => b.count - a.count),
    whats_it_like: signals.filter(s => s.signal_category === 'whats_it_like' && s.count > 0).sort((a, b) => b.count - a.count),
    what_didnt_work: signals.filter(s => s.signal_category === 'what_didnt_work' && s.count > 0).sort((a, b) => b.count - a.count),
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'No reviews yet';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Image */}
      {place.image_url && (
        <div className="relative h-64 w-full">
          <img
            src={place.image_url}
            alt={place.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Place Info */}
      <div className="px-4 py-6 space-y-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="px-2 py-1 bg-[#008fc0]/10 text-[#008fc0] rounded-md font-medium">
              {place.category}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{place.name}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{place.address}, {place.city}, {place.state}</span>
          </div>
        </div>

        {place.description && (
          <p className="text-base text-muted-foreground leading-relaxed">
            {place.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#008fc0]" />
            <span className="font-semibold text-foreground">{place.review_count}</span>
            <span className="text-muted-foreground">reviews</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#008fc0]" />
            <span className="text-muted-foreground">{formatTimeAgo(place.last_review_at)}</span>
          </div>
        </div>
      </div>

      {/* Signals by Category */}
      <div className="px-4 py-6 space-y-8">
        {(Object.keys(signalsByCategory) as Array<keyof typeof signalsByCategory>).map(category => {
          const categorySignals = signalsByCategory[category];
          if (categorySignals.length === 0) return null;

          return (
            <div key={category} className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">
                {CATEGORY_TITLES[category]}
              </h2>
              <div className="space-y-2">
                {categorySignals.map(signal => (
                  <div
                    key={signal.signal_id}
                    className={`
                      flex items-center justify-between
                      px-4 py-3 rounded-xl
                      ${COLOR_CLASSES[signal.signal_color]}
                    `}
                  >
                    <span className="font-medium">
                      {signal.signal_emoji} {signal.signal_name}
                    </span>
                    <span className="text-lg font-bold">
                      ×{signal.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Button (Fixed at bottom) */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
        <div className="max-w-md mx-auto">
          <Button
            asChild
            className="w-full bg-[#008fc0] hover:bg-[#007aa8] text-white text-lg py-6"
            size="lg"
          >
            <Link to={`/review/${placeId}`}>
              Leave a Review
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
