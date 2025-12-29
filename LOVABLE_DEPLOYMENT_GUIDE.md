# MUVO - Lovable Deployment Guide

## 🎯 What You're Deploying

A complete tap-based review platform that replaces star ratings with frequency-based signals. Users tap what stood out, what the vibe was like, and what didn't work - takes 10 seconds instead of writing essays.

---

## 📦 Package Contents

### Core Components (Ready to Use)
1. **HowReviewsWork.tsx** - Onboarding screens with all improvements
   - "Start Tapping, Stop Typing"
   - "THE DIFFERENCE" comparison
   - Transparency message
   - Mobile-optimized

2. **ReviewSubmit.tsx** - Three-category tap interface
   - 👍 What Stood Out (blue)
   - ⭐ What's it like (gray)
   - ⚠️ What didn't work (orange)
   - Multi-select signals
   - Submit to Supabase

3. **PlaceDetail.tsx** - Place page with aggregated signals
   - Shows signal counts by category
   - Top signals displayed
   - Review count and recency
   - "Leave a Review" CTA

### Database
4. **supabase-schema.sql** - Complete database schema
   - Places, reviews, signals tables
   - Aggregated signals view
   - Row Level Security (RLS)
   - Seed data (45 signals across 3 categories)

### Documentation
5. **MAPS_INTEGRATION.md** - Maps implementation guide
6. **MUVO_STATUS.md** - Development status
7. **This file** - Deployment instructions

---

## 🚀 Step-by-Step Deployment

### Phase 1: Supabase Setup (15 minutes)

#### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Name it "muvo" (or your choice)
4. Choose a region close to your users
5. Set a strong database password (save it!)
6. Wait for project to initialize (~2 minutes)

#### 1.2 Run Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the editor
5. Click "Run"
6. Wait for completion (~30 seconds)
7. Verify tables created: Go to **Table Editor** → Should see:
   - places
   - reviews
   - signals
   - review_signals

#### 1.3 Get Supabase Credentials
1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep secret!)

---

### Phase 2: Lovable Project Setup (10 minutes)

#### 2.1 Create/Open Lovable Project
1. Go to [lovable.dev](https://lovable.dev)
2. Create new project or open existing MUVO project
3. Choose React + TypeScript template

#### 2.2 Add Environment Variables
In Lovable project settings, add:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

#### 2.3 Install Dependencies
Tell Lovable to install:
```
@supabase/supabase-js
lucide-react
```

---

### Phase 3: Add Components (20 minutes)

#### 3.1 Copy Core Components
Upload these files to Lovable:

**src/components/home/HowReviewsWork.tsx**
- The complete onboarding component
- Already has all improvements
- No changes needed

**src/components/ReviewSubmit.tsx**
- Review submission interface
- Replace mock data with Supabase calls (see below)

**src/components/PlaceDetail.tsx**
- Place detail page
- Replace mock data with Supabase calls (see below)

#### 3.2 Create Supabase Client
Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### 3.3 Connect ReviewSubmit to Supabase
In `ReviewSubmit.tsx`, replace the TODO section:

```typescript
import { supabase } from '@/lib/supabase';

// In handleSubmit function:
try {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    toast({ title: 'Please sign in to leave a review', variant: 'destructive' });
    return;
  }

  // Create review
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .insert({ place_id: placeId, user_id: user.id })
    .select()
    .single();

  if (reviewError) throw reviewError;

  // Add signals
  const signalInserts = Array.from(selectedSignals).map(signalId => ({
    review_id: review.id,
    signal_id: signalId,
  }));

  const { error: signalsError } = await supabase
    .from('review_signals')
    .insert(signalInserts);

  if (signalsError) throw signalsError;

  // Refresh aggregated signals
  await supabase.rpc('refresh_aggregated_signals');

  toast({ title: 'Review submitted!', description: `You tapped ${selectedSignals.size} signals.` });
  navigate(`/place/${placeId}`);
} catch (error) {
  console.error(error);
  toast({ title: 'Error submitting review', variant: 'destructive' });
}
```

#### 3.4 Connect PlaceDetail to Supabase
In `PlaceDetail.tsx`, replace mock data with:

```typescript
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

// In component:
const [place, setPlace] = useState<Place | null>(null);
const [signals, setSignals] = useState<AggregatedSignal[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchData() {
    try {
      // Fetch place
      const { data: placeData } = await supabase
        .from('place_summary')
        .select('*')
        .eq('id', placeId)
        .single();

      setPlace(placeData);

      // Fetch aggregated signals
      const { data: signalsData } = await supabase
        .from('aggregated_signals')
        .select('*')
        .eq('place_id', placeId)
        .gt('count', 0)
        .order('count', { ascending: false });

      setSignals(signalsData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  fetchData();
}, [placeId]);
```

---

### Phase 4: Routing & Navigation (10 minutes)

#### 4.1 Update App Routes
In your main routing file (e.g., `App.tsx` or `router.tsx`):

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HowReviewsWork } from '@/components/home/HowReviewsWork';
import { PlaceDetail } from '@/components/PlaceDetail';
import { ReviewSubmit } from '@/components/ReviewSubmit';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowReviewsWork />} />
        <Route path="/place/:placeId" element={<PlaceDetail />} />
        <Route path="/review/:placeId" element={<ReviewSubmit />} />
        {/* Add more routes */}
      </Routes>
    </BrowserRouter>
  );
}
```

#### 4.2 Add Navigation
Create a bottom navigation bar or header with links to:
- Home
- Map (to be implemented)
- Profile
- How It Works

---

### Phase 5: Authentication (15 minutes)

#### 5.1 Enable Supabase Auth
In Supabase dashboard:
1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Optional: Enable **Google** or **GitHub** for social login

#### 5.2 Add Auth to Lovable
Create `src/components/Auth.tsx`:

```typescript
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert('Check your email for confirmation link!');
    setLoading(false);
  };

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold">Sign In to MUVO</h2>
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="flex gap-2">
        <Button onClick={handleSignIn} disabled={loading}>Sign In</Button>
        <Button onClick={handleSignUp} variant="outline" disabled={loading}>Sign Up</Button>
      </div>
    </div>
  );
}
```

#### 5.3 Protect Review Routes
Wrap ReviewSubmit in an auth check:

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  navigate('/auth');
  return;
}
```

---

### Phase 6: Maps Integration (Optional - 30 minutes)

Follow the detailed guide in `MAPS_INTEGRATION.md`:
1. Get Google Maps API key
2. Add to environment variables
3. Install `@googlemaps/js-api-loader`
4. Create Map component
5. Create MapView page
6. Connect to Supabase for nearby places

---

### Phase 7: Testing (20 minutes)

#### 7.1 Create Test Data
In Supabase SQL Editor:

```sql
-- Add a test place
INSERT INTO places (name, address, city, state, category, latitude, longitude, description)
VALUES (
  'Test Restaurant',
  '123 Main St',
  'San Francisco',
  'CA',
  'restaurant',
  37.7749,
  -122.4194,
  'A great place to test MUVO reviews!'
);

-- Get the place ID
SELECT id FROM places WHERE name = 'Test Restaurant';
```

#### 7.2 Test Flow
1. Visit home page → Click "How It Works"
2. Read through onboarding screens
3. Navigate to place detail page (use test place ID)
4. Click "Leave a Review"
5. Sign in (if not already)
6. Tap signals across all three categories
7. Submit review
8. Verify signals appear on place page
9. Check Supabase tables for data

---

### Phase 8: Polish & Launch (30 minutes)

#### 8.1 Add MUVO Logo
1. Upload logo to Lovable assets
2. Add to header/navigation
3. Update favicon

#### 8.2 Mobile Optimization
- Test on mobile device or Chrome DevTools
- Ensure tap targets are at least 44x44px
- Check bottom navigation doesn't overlap content
- Verify modals/sheets work on mobile

#### 8.3 SEO & Meta Tags
Add to `index.html`:
```html
<title>MUVO - Tap-Based Reviews</title>
<meta name="description" content="Honest reviews in 10 seconds. Tap what stood out, what the vibe was like, and what didn't work." />
<meta property="og:image" content="/muvo-og-image.png" />
```

#### 8.4 Deploy!
1. In Lovable, click "Deploy"
2. Choose your domain or use Lovable subdomain
3. Wait for build (~2 minutes)
4. Test live site
5. Share with friends!

---

## 🎨 Customization Tips

### Change Colors
The MUVO blue (#008fc0) is used throughout. To change:
1. Find all instances of `#008fc0`
2. Replace with your brand color
3. Update signal colors if needed (blue, gray, orange)

### Add More Signals
In Supabase SQL Editor:
```sql
INSERT INTO signals (name, category, emoji, color, place_types)
VALUES ('Your Signal', 'what_stood_out', '👍', 'blue', ARRAY['all']);
```

### Customize Place Categories
Add more categories in the places table:
- 'cafe', 'hotel', 'attraction', 'service', etc.
- Update signal place_types to match

---

## 🐛 Troubleshooting

### "Supabase client not initialized"
- Check environment variables are set correctly
- Restart Lovable dev server

### "Review submission failed"
- Check user is authenticated
- Verify place_id exists in places table
- Check browser console for errors

### "Signals not showing"
- Run `SELECT refresh_aggregated_signals();` in Supabase
- Check review_signals table has data
- Verify RLS policies allow reading

### "Map not loading"
- Check Google Maps API key is valid
- Verify API key restrictions allow your domain
- Check browser console for errors

---

## 📊 Post-Launch

### Monitor Usage
- Supabase dashboard → Database → Table Editor
- Check review count growth
- See which signals are most popular

### Refresh Aggregated Signals
Set up a cron job in Supabase:
```sql
SELECT cron.schedule(
  'refresh-signals',
  '0 * * * *', -- Every hour
  'SELECT refresh_aggregated_signals()'
);
```

### Add Analytics
- Google Analytics for page views
- Supabase logs for API usage
- Track conversion: views → reviews

---

## 🎉 You're Done!

You now have a complete MUVO review platform deployed on Lovable with:
- ✅ Onboarding screens
- ✅ Three-category tap reviews
- ✅ Aggregated signal display
- ✅ User authentication
- ✅ Database with RLS
- ✅ Mobile-optimized UI

**Next steps:**
1. Add more places (manually or via import)
2. Implement maps for discovery
3. Add user profiles
4. Build business owner dashboard
5. Launch marketing campaign!

---

## 📞 Need Help?

- Lovable docs: [docs.lovable.dev](https://docs.lovable.dev)
- Supabase docs: [supabase.com/docs](https://supabase.com/docs)
- React Router: [reactrouter.com](https://reactrouter.com)

Good luck with your launch! 🚀
