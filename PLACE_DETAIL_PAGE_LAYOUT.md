# MUVO Place Detail Page - Layout Analysis

**Source:** https://muvo.app/place/10bfb36c-1106-4379-88dc-64bf6b26f06d  
**Example:** Yellowstone National Park  
**Date:** December 28, 2024

---

## 📱 **Overall Page Structure**

The place detail page follows a vertical scroll layout with distinct sections:

1. **Hero Section** (top)
2. **Key Info Bar**
3. **Signal Summary**
4. **Contact & Actions**
5. **Multiple Entrances** (conditional)
6. **Community Reviews Section**
7. **Photos Section**
8. **Bottom Navigation**

---

## 🎨 **Section-by-Section Breakdown**

### **1. Hero Section** (Top)

**Components:**
- **Large hero image** (full-width, ~40% viewport height)
- **Back button** (top left, overlaid on image)
- **Share button** (top right, overlaid on image)
- **Save/heart button** (top right, overlaid on image)

**Visual:**
- Stunning landscape/place photo
- Gradient overlay at bottom for text readability
- **Place name overlaid** at bottom of image (white text, large, bold)

**Example:**
```
┌────────────────────────────────────┐
│  [←]              [📤] [♥]         │
│                                    │
│     [HERO IMAGE]                   │
│                                    │
│  Yellowstone National Park         │
└────────────────────────────────────┘
```

---

### **2. Key Info Bar** (Below Hero)

**Layout:** Horizontal scrollable pills/badges

**Components:**
- **Membership badge**: "Included with: State / Regional Park Pass"
- **Distance**: "762.8 mi"
- **Price indicator**: "$" (1-4 dollar signs)
- **Status**: "Open now" or "Closed" with hours
- **Season**: "Year-round" or seasonal info

**Visual:**
- Small rounded pills
- Light background
- Icon + text
- Horizontally scrollable if many badges

**Example:**
```
[🎫 Included with: State Park Pass] [📍 762.8 mi] [$] [🟢 Open now] [📅 Year-round]
```

---

### **3. Signal Summary** (Expandable)

**Three Categories** (collapsible sections):

#### **A. What Stood Out** (Positive - Blue)
- Shows top positive signals
- **Format**: `Signal Name ×Count`
- **Example**: "Spacious Sites ×150"
- **"+X more" button** to expand

#### **B. What's it like** (Neutral - Gray)
- Shows top neutral signals
- **Example**: "Rustic ×85"
- **"+X more" button** to expand

#### **C. What didn't work** (Negative - Orange/Red)
- Shows top negative signals
- **Example**: "Sites Crowded ×10"
- **"+X more" button** to expand

**Visual:**
```
┌────────────────────────────────────┐
│ 👍 What Stood Out                  │
│ Spacious Sites ×150  [+4 more]     │
├────────────────────────────────────┤
│ ⭐ What's it like                  │
│ Rustic ×85  [+1 more]              │
├────────────────────────────────────┤
│ ⚠️ What didn't work                │
│ Sites Crowded ×10                  │
└────────────────────────────────────┘
```

---

### **4. Contact & Actions**

**Contact Info:**
- **Phone**: (307) 555-0123 (clickable, opens dialer)
- **Website**: www.nps.gov/yell (clickable, opens browser)
- **Instagram**: @yellowstonenps (if available)
- **Email**: contact@place.com (if available)

**Action Buttons** (large, prominent):
- **Navigate button** (primary CTA)
  - May show multiple entrance options if available
  - Each entrance has its own "Navigate" button

**Visual:**
```
┌────────────────────────────────────┐
│ 📞 (307) 555-0123                  │
│ 🌐 www.nps.gov/yell                │
│ 📷 @yellowstonenps                 │
│                                    │
│ [🧭 Navigate]                      │
└────────────────────────────────────┘
```

---

### **5. Multiple Entrances** (Conditional Section)

**Only shows if place has multiple entrances**

**Components:**
- **Section title**: "Entrances" or "Multiple Entrances"
- **List of entrances** with:
  - Entrance name/label
  - Address or description
  - **Navigate button** for each
  - Distance from user (if different)

**Example** (for large venues like airports, national parks, malls):
```
┌────────────────────────────────────┐
│ 📍 Entrances                       │
├────────────────────────────────────┤
│ North Entrance                     │
│ Gardiner, MT                       │
│ [🧭 Navigate]                      │
├────────────────────────────────────┤
│ West Entrance                      │
│ West Yellowstone, MT               │
│ [🧭 Navigate]                      │
├────────────────────────────────────┤
│ South Entrance                     │
│ Jackson, WY                        │
│ [🧭 Navigate]                      │
└────────────────────────────────────┘
```

**When NOT to show:**
- Small businesses with one location
- Places with single entrance

---

### **6. Community Reviews Section**

**Header:**
- **Title**: "Community Reviews"
- **Review count**: "Based on X reviews"
- **"Add Review" button** (prominent, blue)

**Review List:**
- Shows recent reviews
- Each review shows:
  - User avatar
  - Username
  - Date
  - Signals they tapped (with counts)
  - Optional text comment
  - Helpful/report buttons

**Empty State:**
- "No reviews yet"
- "Be the first to review!"
- Large "Add Review" CTA

**Visual:**
```
┌────────────────────────────────────┐
│ Community Reviews (150 reviews)    │
│                                    │
│ [+ Add Your Review]                │
├────────────────────────────────────┤
│ 👤 John D. • 2 days ago           │
│ Spacious Sites ×3                  │
│ Rustic ×2                          │
│ "Amazing experience!"              │
│ [👍 Helpful] [🚩 Report]           │
├────────────────────────────────────┤
│ 👤 Sarah M. • 1 week ago          │
│ Felt Safe ×3                       │
│ Well Designed ×2                   │
│ Sites Crowded ×1                   │
│ [👍 Helpful] [🚩 Report]           │
└────────────────────────────────────┘
```

---

### **7. Photos Section**

**Header:**
- **Title**: "Photos"
- **Photo count**: "X photos"
- **"Add Photos" button** (if logged in)

**Photo Grid:**
- **3-column grid** on mobile
- **4-5 columns** on tablet/desktop
- Tap to open full-screen gallery
- Shows first 12-15 photos
- "View all X photos" button

**Empty State:**
- "No photos yet"
- "Sign in to add photos"
- Placeholder image

**Visual:**
```
┌────────────────────────────────────┐
│ Photos (45 photos)                 │
│                                    │
│ [📷 Add Photos]                    │
├────────────────────────────────────┤
│ [img] [img] [img]                  │
│ [img] [img] [img]                  │
│ [img] [img] [img]                  │
│                                    │
│ [View all 45 photos]               │
└────────────────────────────────────┘
```

---

### **8. Membership Section** (Conditional)

**Only shows if place accepts memberships**

**Components:**
- **Section title**: "Accepted Memberships" or "Discounts Available"
- **List of memberships**:
  - Membership logo/icon
  - Membership name
  - Discount/benefit description
  - "Learn more" link

**Example:**
```
┌────────────────────────────────────┐
│ 🎫 Accepted Memberships            │
├────────────────────────────────────┤
│ [🏕️] Good Sam Club                 │
│ 10% off nightly rate               │
│ [Learn more]                       │
├────────────────────────────────────┤
│ [🚐] Passport America              │
│ 50% off Sun-Thu                    │
│ [Learn more]                       │
└────────────────────────────────────┘
```

**When NOT to show:**
- Place doesn't accept any memberships
- No discount programs available

---

### **9. Hours of Operation** (Conditional)

**Only shows if place has specific hours**

**Components:**
- **Section title**: "Hours"
- **Current status**: "Open now" or "Closed"
- **Today's hours** (highlighted)
- **Expandable** full week schedule

**Example:**
```
┌────────────────────────────────────┐
│ 🕐 Hours                           │
│ Open now • Closes at 10:00 PM      │
├────────────────────────────────────┤
│ Today    8:00 AM - 10:00 PM        │
│ Mon      8:00 AM - 10:00 PM        │
│ Tue      8:00 AM - 10:00 PM        │
│ ...                                │
│ [Show full week]                   │
└────────────────────────────────────┘
```

**When NOT to show:**
- 24/7 places
- Seasonal places (show season instead)
- Boondocking spots

---

### **10. Bottom Navigation** (Fixed)

**5-tab bottom nav:**
- **Map** (home icon)
- **Places** (list icon)
- **Add** (+ icon, center, elevated)
- **Saved** (heart icon)
- **Profile** (user icon)

**Current tab highlighted**

---

## 🎯 **Conditional Sections Logic**

### **Always Show:**
1. Hero image + name
2. Key info bar
3. Signal summary (3 categories)
4. Contact info
5. Navigate button
6. Community Reviews
7. Photos
8. Bottom nav

### **Show Only If Applicable:**
1. **Multiple Entrances** → Only if place has 2+ entrances
2. **Memberships** → Only if place accepts memberships
3. **Hours** → Only if place has specific hours (not 24/7 or seasonal)
4. **Price** → Only if relevant (not for free parks)
5. **Instagram** → Only if place has Instagram
6. **Email** → Only if place has email

---

## 🎨 **Visual Design Principles**

### **1. Hero-First**
- Large, beautiful image sets the tone
- Place name overlaid (not separate)
- Immersive experience

### **2. Information Hierarchy**
1. Visual (hero image)
2. Name
3. Key facts (distance, price, status)
4. Signals (what people say)
5. Contact & actions
6. Details (reviews, photos)

### **3. Action-Oriented**
- **Navigate button** is primary CTA
- **Add Review** is secondary CTA
- **Contact buttons** are one-tap

### **4. Progressive Disclosure**
- Show top signals, "+X more" to expand
- Show recent reviews, "View all" for more
- Show sample photos, "View all" for gallery

### **5. Conditional Sections**
- Don't show irrelevant sections
- Adapt to business type
- Keep layout clean

---

## 📱 **Mobile Optimization**

### **Touch Targets:**
- Large buttons (min 44px height)
- Adequate spacing between elements
- Easy thumb reach for primary actions

### **Scrolling:**
- Smooth momentum scrolling
- Sticky bottom nav
- Hero image parallax (optional)

### **Loading:**
- Hero image loads first
- Lazy load photos
- Skeleton screens for reviews

---

## 🔧 **Component Mapping**

### **Existing Components to Use:**
- `PlaceDetail.tsx` - Main container
- `PlacePhotoGallery.tsx` - Photos section
- `PlaceSignalSummary.tsx` - Signal summary
- `PlaceContactInfo.tsx` - Contact section
- `PlaceEntrances.tsx` - Multiple entrances
- `ReviewsSection.tsx` - Reviews list
- `MembershipIncludedBadge.tsx` - Membership badges
- `PlaceStatusBadge.tsx` - Open/closed status

### **Data Requirements:**
- Place name, description, category
- Hero image URL
- Top signals by category (positive, neutral, negative)
- Contact info (phone, website, Instagram, email)
- Entrance locations (if multiple)
- Membership acceptance
- Hours of operation
- Reviews (recent + count)
- Photos (recent + count)
- Distance from user
- Open/closed status

---

## 💡 **Adaptive Layout Examples**

### **Example 1: RV Park**
✅ Shows: Hero, signals, contact, navigate, reviews, photos  
❌ Hides: Multiple entrances (single entrance)  
⚠️ Conditional: Memberships (if accepts Good Sam, Passport America)

### **Example 2: National Park**
✅ Shows: Hero, signals, contact, **multiple entrances**, reviews, photos  
✅ Shows: Season info instead of hours  
❌ Hides: Memberships (government park)

### **Example 3: Restaurant**
✅ Shows: Hero, signals, contact, navigate, **hours**, reviews, photos  
❌ Hides: Multiple entrances, memberships  
✅ Shows: Price indicator ($$$)

### **Example 4: Shopping Mall**
✅ Shows: Hero, signals, **multiple entrances**, hours, reviews, photos  
❌ Hides: Memberships  
✅ Shows: Parking info

---

## 🎯 **Key Takeaways**

### **What Makes This Layout Work:**

1. **Adaptive** - Shows only relevant sections
2. **Visual-first** - Hero image creates impact
3. **Transparent** - Shows all 3 signal categories
4. **Action-oriented** - Navigate is primary CTA
5. **Scalable** - Works for any business type
6. **Mobile-optimized** - Touch-friendly, fast

### **Critical Features:**
- ✅ Conditional sections (entrances, memberships, hours)
- ✅ 3-category signal display
- ✅ Progressive disclosure (+X more)
- ✅ One-tap actions (call, navigate, website)
- ✅ Community-driven (reviews, photos)

---

## 🚀 **Implementation Priority**

### **Phase 1: Core Layout**
1. Hero section
2. Key info bar
3. Signal summary (3 categories)
4. Contact & navigate
5. Reviews section
6. Photos section

### **Phase 2: Conditional Sections**
1. Multiple entrances logic
2. Membership display
3. Hours of operation
4. Adaptive layout rules

### **Phase 3: Polish**
1. Loading states
2. Empty states
3. Error handling
4. Animations

---

**This layout is production-ready and should be preserved!** ✨

**When integrating with Schema B:**
- Keep this exact structure
- Preserve conditional logic
- Maintain visual hierarchy
- Adapt data queries to new schema
