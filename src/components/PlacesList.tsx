import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Users, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Mock data - in production, fetch from Supabase
interface Place {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  category: string;
  image_url?: string;
  review_count: number;
  top_signals?: Array<{
    emoji: string;
    name: string;
    count: number;
  }>;
}

const MOCK_PLACES: Place[] = [
  {
    id: '1',
    name: 'Mountain View Campground',
    address: '123 Scenic Drive',
    city: 'Boulder',
    state: 'CO',
    category: 'RV Park',
    image_url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400',
    review_count: 127,
    top_signals: [
      { emoji: '👍', name: 'Beautiful Views', count: 89 },
      { emoji: '👍', name: 'Clean Bathrooms', count: 76 },
      { emoji: '⭐', name: 'Quiet', count: 71 },
    ],
  },
  {
    id: '2',
    name: 'The Rustic Table',
    address: '456 Main Street',
    city: 'Denver',
    state: 'CO',
    category: 'Restaurant',
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
    review_count: 234,
    top_signals: [
      { emoji: '👍', name: 'Delicious Food', count: 189 },
      { emoji: '👍', name: 'Friendly Staff', count: 156 },
      { emoji: '⭐', name: 'Cozy', count: 134 },
    ],
  },
  {
    id: '3',
    name: 'Sunset Cafe',
    address: '789 Beach Road',
    city: 'Santa Monica',
    state: 'CA',
    category: 'Cafe',
    image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
    review_count: 98,
    top_signals: [
      { emoji: '👍', name: 'Great Coffee', count: 78 },
      { emoji: '⭐', name: 'Outdoor Seating', count: 65 },
      { emoji: '👍', name: 'Good WiFi', count: 54 },
    ],
  },
];

const CATEGORIES = ['All', 'Restaurant', 'RV Park', 'Cafe', 'Hotel', 'Campground'];

export function PlacesList() {
  const [places, setPlaces] = useState<Place[]>(MOCK_PLACES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);

  // In production, fetch from Supabase
  useEffect(() => {
    // const fetchPlaces = async () => {
    //   setLoading(true);
    //   const { data } = await supabase
    //     .from('place_summary')
    //     .select('*')
    //     .order('review_count', { ascending: false });
    //   setPlaces(data || []);
    //   setLoading(false);
    // };
    // fetchPlaces();
  }, []);

  // Filter places
  const filteredPlaces = places.filter(place => {
    const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         place.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || place.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-[#008fc0] text-white px-4 py-6 sticky top-0 z-10">
        <h1 className="text-2xl font-bold mb-4">Discover Places</h1>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search places or cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white text-gray-900"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="px-4 py-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                transition-colors
                ${selectedCategory === category
                  ? 'bg-[#008fc0] text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="px-4 py-2 text-sm text-muted-foreground">
        {filteredPlaces.length} place{filteredPlaces.length !== 1 ? 's' : ''} found
      </div>

      {/* Places Grid */}
      <div className="px-4 pb-4 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filteredPlaces.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No places found</p>
            <Button asChild variant="outline">
              <Link to="/add-place">
                <Plus className="w-4 h-4 mr-2" />
                Add a Place
              </Link>
            </Button>
          </div>
        ) : (
          filteredPlaces.map(place => (
            <Link
              key={place.id}
              to={`/place/${place.id}`}
              className="block bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Image */}
              {place.image_url && (
                <div className="relative h-48 w-full">
                  <img
                    src={place.image_url}
                    alt={place.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[#008fc0] text-xs font-semibold rounded-full">
                      {place.category}
                    </span>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {place.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{place.city}, {place.state}</span>
                  </div>
                </div>

                {/* Top Signals */}
                {place.top_signals && place.top_signals.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {place.top_signals.map((signal, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1 bg-[#008fc0]/10 text-[#008fc0] rounded-full text-xs font-medium"
                      >
                        {signal.emoji} {signal.name} ×{signal.count}
                      </div>
                    ))}
                  </div>
                )}

                {/* Review Count */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold text-foreground">{place.review_count}</span>
                  <span>reviews</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Floating Add Button */}
      <Link
        to="/add-place"
        className="fixed bottom-20 right-4 w-14 h-14 bg-[#008fc0] hover:bg-[#007aa8] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-20"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
