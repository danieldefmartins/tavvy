/**
 * MUVO SDK - JavaScript/TypeScript client for MUVO API
 * 
 * Installation:
 * npm install @muvo/sdk
 * 
 * Usage:
 * import { MuvoClient } from '@muvo/sdk';
 * const muvo = new MuvoClient({ apiKey: 'muvo_live_...' });
 */

// ============================================
// TYPES
// ============================================

export interface MuvoConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

export interface Place {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  description?: string;
  image_url?: string;
  created_at: string;
}

export interface Signal {
  id: string;
  name: string;
  emoji: string;
  category: 'what_stood_out' | 'whats_it_like' | 'what_didnt_work';
  is_active: boolean;
}

export interface SignalAggregation {
  signal_id: string;
  signal_name: string;
  emoji: string;
  category: string;
  count: number;
}

export interface PlaceDetail {
  place: Place;
  signals: SignalAggregation[];
  review_count: number;
}

export interface ReviewInput {
  place_id: string;
  user_id?: string;
  user_email?: string;
  signals: string[]; // Array of signal IDs
  source?: string;
}

export interface Review {
  id: string;
  place_id: string;
  user_id?: string;
  partner_id: string;
  source: string;
  created_at: string;
}

export interface PlacesSearchParams {
  q?: string;
  category?: string;
  lat?: number;
  lng?: number;
  radius?: number; // km
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

// ============================================
// MUVO CLIENT
// ============================================

export class MuvoClient {
  private apiKey: string;
  private baseURL: string;
  private timeout: number;

  constructor(config: MuvoConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.muvo.app/v1';
    this.timeout = config.timeout || 30000;

    if (!this.apiKey) {
      throw new Error('API key is required');
    }

    if (!this.apiKey.startsWith('muvo_')) {
      throw new Error('Invalid API key format');
    }
  }

  // ============================================
  // PLACES
  // ============================================

  /**
   * Search and list places
   */
  async getPlaces(params?: PlacesSearchParams): Promise<PaginatedResponse<Place>> {
    const queryParams = new URLSearchParams();
    
    if (params?.q) queryParams.append('q', params.q);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.lat !== undefined) queryParams.append('lat', params.lat.toString());
    if (params?.lng !== undefined) queryParams.append('lng', params.lng.toString());
    if (params?.radius) queryParams.append('radius', params.radius.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${this.baseURL}/places?${queryParams.toString()}`;
    return this.request<PaginatedResponse<Place>>('GET', url);
  }

  /**
   * Get single place with aggregated signals
   */
  async getPlace(placeId: string): Promise<PlaceDetail> {
    const url = `${this.baseURL}/places/${placeId}`;
    return this.request<PlaceDetail>('GET', url);
  }

  /**
   * Search places nearby (requires lat/lng)
   */
  async searchNearby(
    lat: number,
    lng: number,
    radius: number = 10,
    category?: string
  ): Promise<PaginatedResponse<Place>> {
    return this.getPlaces({ lat, lng, radius, category });
  }

  // ============================================
  // REVIEWS
  // ============================================

  /**
   * Submit a review from your app
   */
  async createReview(review: ReviewInput): Promise<{ review: Review }> {
    const url = `${this.baseURL}/reviews`;
    return this.request<{ review: Review }>('POST', url, review);
  }

  /**
   * Batch submit multiple reviews
   */
  async createReviews(reviews: ReviewInput[]): Promise<{ reviews: Review[] }> {
    const results = await Promise.all(
      reviews.map(review => this.createReview(review))
    );
    return {
      reviews: results.map(r => r.review),
    };
  }

  // ============================================
  // SIGNALS
  // ============================================

  /**
   * Get all available signals
   */
  async getSignals(): Promise<{ signals: Signal[] }> {
    const url = `${this.baseURL}/signals`;
    return this.request<{ signals: Signal[] }>('GET', url);
  }

  /**
   * Get signals by category
   */
  async getSignalsByCategory(
    category: 'what_stood_out' | 'whats_it_like' | 'what_didnt_work'
  ): Promise<{ signals: Signal[] }> {
    const { signals } = await this.getSignals();
    return {
      signals: signals.filter(s => s.category === category),
    };
  }

  // ============================================
  // HTTP CLIENT
  // ============================================

  private async request<T>(
    method: string,
    url: string,
    body?: any
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'muvo-sdk-js/1.0.0',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new MuvoError(
          error.error || `HTTP ${response.status}`,
          response.status,
          error
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof MuvoError) {
        throw error;
      }

      if (error.name === 'AbortError') {
        throw new MuvoError('Request timeout', 408);
      }

      throw new MuvoError('Network error', 0, error);
    }
  }
}

// ============================================
// ERROR HANDLING
// ============================================

export class MuvoError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = 'MuvoError';
    this.statusCode = statusCode;
    this.details = details;
  }

  isRateLimitError(): boolean {
    return this.statusCode === 429;
  }

  isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  isNotFoundError(): boolean {
    return this.statusCode === 404;
  }
}

// ============================================
// REACT HOOKS (Optional)
// ============================================

/**
 * React hook for MUVO client
 * 
 * Usage:
 * const muvo = useMuvo({ apiKey: 'muvo_live_...' });
 * const places = await muvo.getPlaces();
 */
export function useMuvo(config: MuvoConfig): MuvoClient {
  const [client] = React.useState(() => new MuvoClient(config));
  return client;
}

/**
 * React hook to fetch places
 */
export function usePlaces(
  client: MuvoClient,
  params?: PlacesSearchParams
): {
  places: Place[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [places, setPlaces] = React.useState<Place[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchPlaces = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await client.getPlaces(params);
      setPlaces(result.data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [client, params]);

  React.useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  return { places, loading, error, refetch: fetchPlaces };
}

/**
 * React hook to fetch single place
 */
export function usePlace(
  client: MuvoClient,
  placeId: string | null
): {
  place: PlaceDetail | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [place, setPlace] = React.useState<PlaceDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchPlace = React.useCallback(async () => {
    if (!placeId) {
      setPlace(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await client.getPlace(placeId);
      setPlace(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [client, placeId]);

  React.useEffect(() => {
    fetchPlace();
  }, [fetchPlace]);

  return { place, loading, error, refetch: fetchPlace };
}

// ============================================
// EXAMPLES
// ============================================

/**
 * Example 1: Basic usage
 */
async function example1() {
  const muvo = new MuvoClient({
    apiKey: 'muvo_live_abc123...',
  });

  // Get all places
  const places = await muvo.getPlaces();
  console.log(`Found ${places.pagination.total} places`);

  // Search places
  const restaurants = await muvo.getPlaces({
    category: 'Restaurant',
    q: 'pizza',
  });

  // Get place details
  const place = await muvo.getPlace('place-id-123');
  console.log(`${place.place.name} has ${place.review_count} reviews`);

  // Submit review
  const review = await muvo.createReview({
    place_id: 'place-id-123',
    user_email: 'user@example.com',
    signals: ['signal-id-1', 'signal-id-2', 'signal-id-3'],
    source: 'MyApp',
  });
  console.log('Review submitted:', review);
}

/**
 * Example 2: Nearby search
 */
async function example2() {
  const muvo = new MuvoClient({
    apiKey: 'muvo_live_abc123...',
  });

  // Find RV parks near Boulder, CO
  const nearbyPlaces = await muvo.searchNearby(
    40.0150, // Boulder latitude
    -105.2705, // Boulder longitude
    25, // 25km radius
    'RV Park'
  );

  console.log(`Found ${nearbyPlaces.data.length} RV parks nearby`);
}

/**
 * Example 3: React component
 */
function PlaceListComponent() {
  const muvo = useMuvo({ apiKey: 'muvo_live_abc123...' });
  const { places, loading, error } = usePlaces(muvo, { category: 'Restaurant' });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {places.map(place => (
        <div key={place.id}>
          <h3>{place.name}</h3>
          <p>{place.city}, {place.state}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================
// EXPORT
// ============================================

export default MuvoClient;
