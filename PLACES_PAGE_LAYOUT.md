# MUVO Places Page - Layout Analysis

**Source:** https://muvo.app/places  
**Date:** December 28, 2024

---

## 📱 **Overall Layout Structure**

### **Header (Top Navigation)**
- **Back button** (left)
- **MUVO logo** (center)
- **Notification bell** (top right)
- **Saved places heart icon** (top right)

### **View Toggle Bar**
- **List button** (selected state)
- **Map button**

### **Filters Bar**
- **Sort dropdown**: "Recently updated" (default)
- **Filters button**: Opens filter modal

### **Results Header**
- **Count**: "25 places near you"

### **Place Cards (Scrollable List)**
- Vertical scrolling list of place cards
- Each card is a complete unit

---

## 🎴 **Place Card Design**

### **Card Structure:**

```
┌─────────────────────────────────────┐
│ [Photo]                             │
│                                     │
│ Place Name                          │
│ Signal 1 ×95  Signal 2 ×42  Signal 3 ×8 │
│                                     │
│ Category • Distance • Status        │
│                                     │
│ [📞] [🌐] [📷] [📤]                 │
└─────────────────────────────────────┘
```

### **Card Components:**

1. **Place Photo** (top)
   - Full-width image
   - Rounded corners
   - Aspect ratio ~16:9

2. **Place Name** (bold, large)
   - Example: "Sedona Luxury RV Resort"

3. **Signal Pills** (3 signals shown)
   - **Format**: `Signal Name ×Count`
   - **Colors**:
     - Blue background = Positive signal
     - Gray background = Neutral signal
     - Orange/Red background = Negative signal
   - **Layout**: Horizontal row, wrapping if needed
   - **Examples**:
     - "Spacious Sites ×95" (blue)
     - "Brand New ×42" (blue)
     - "Too Noisy ×8" (orange)

4. **Metadata Line**
   - **Format**: `Category • Distance • Status`
   - **Example**: "Luxury RV Resort • 99.8 mi • Open"
   - Gray text, smaller font

5. **Action Buttons** (bottom row)
   - **📞 Call** button
   - **🌐 Website** button
   - **📷 Instagram** button (if available)
   - **📤 Share** button
   - Icon-only buttons, evenly spaced

---

## 🎨 **Visual Design**

### **Colors:**
- **Background**: White/light gray
- **Card background**: White with subtle shadow
- **Positive signals**: Blue (#008fc0 - MUVO brand color)
- **Neutral signals**: Gray
- **Negative signals**: Orange/red
- **Text**: Dark gray/black

### **Typography:**
- **Place name**: Bold, ~18-20px
- **Signals**: Medium weight, ~14px
- **Metadata**: Regular, ~12-14px, gray

### **Spacing:**
- Cards have consistent padding (~16px)
- Signals have small gaps between them (~8px)
- Action buttons evenly distributed

### **Shadows:**
- Subtle card shadow for depth
- No heavy drop shadows

---

## 📊 **Signal Display Logic**

### **3-Signal Rule:**
Each card shows **exactly 3 signals**:
1. **Top positive** (highest count)
2. **Top neutral** (if exists, otherwise 2nd positive)
3. **Top negative** (if exists, otherwise 3rd positive)

### **Signal Format:**
- **Name**: 1-3 words (e.g., "Spacious Sites", "Brand New", "Too Noisy")
- **Count**: ×N format (e.g., "×95", "×42", "×8")
- **Color coding**: Immediate visual feedback

---

## 🔍 **Filters & Sorting**

### **Sort Options:**
- Recently updated (default)
- Highest rated
- Most reviewed
- Nearest first
- Alphabetical

### **Filters** (button opens modal):
- Category (RV Resort, Campground, etc.)
- Distance range
- Open now
- Amenities
- Price range
- Membership accepted

---

## 📱 **Mobile Optimization**

### **Responsive Behavior:**
- Full-width cards on mobile
- Touch-friendly button sizes
- Smooth scrolling
- Pull-to-refresh support

### **Performance:**
- Lazy loading (load more as you scroll)
- Image optimization
- Fast card rendering

---

## 🎯 **Key Features**

### **1. Distance Display**
- Shows distance from user's location
- Updates based on location
- "0 mi" for very close places

### **2. Open/Closed Status**
- "Open" (green)
- "Closed" (red)
- "Opens at X" (gray)

### **3. Category Labels**
- Clear business type
- Examples:
  - "Luxury RV Resort"
  - "RV Campground"
  - "County / Regional Park"
  - "Overnight Parking"
  - "Rest Area / Travel Plaza"
  - "National Park"
  - "State Park"
  - "Boondocking"

### **4. Social Proof**
- Signal counts show popularity
- Higher counts = more reviews
- Mix of positive/negative = transparency

---

## 🔗 **Interactions**

### **Card Click:**
- Entire card is clickable
- Navigates to place detail page

### **Action Buttons:**
- **Call**: Opens phone dialer
- **Website**: Opens external browser
- **Instagram**: Opens Instagram app/web
- **Share**: Native share sheet

### **Scroll Behavior:**
- Infinite scroll (load more)
- Smooth momentum scrolling
- Back-to-top button (after scrolling)

---

## 💡 **Design Principles**

### **1. Scanability**
- Quick visual scan shows:
  - Place name
  - Top signals (what people say)
  - Distance
  - Status (open/closed)

### **2. Transparency**
- Shows both positive AND negative
- No hiding bad reviews
- Honest signal counts

### **3. Actionability**
- One-tap call, website, share
- Quick access to key actions
- No buried functionality

### **4. Consistency**
- Every card has same structure
- Predictable layout
- Easy to compare places

---

## 🎯 **What Makes This Layout Work**

### **✅ Strengths:**
1. **3-signal summary** - Perfect amount of info
2. **Color coding** - Instant visual feedback
3. **Distance + status** - Key decision factors
4. **Action buttons** - One-tap access
5. **Clean design** - Not cluttered
6. **Mobile-first** - Touch-optimized

### **🎨 Visual Hierarchy:**
1. Place name (most prominent)
2. Signals (what people say)
3. Category/distance/status
4. Action buttons

---

## 📝 **Implementation Notes**

### **Component Structure:**
```tsx
<PlaceCard>
  <PlaceImage />
  <PlaceName />
  <SignalPills>
    <SignalPill category="positive" />
    <SignalPill category="neutral" />
    <SignalPill category="negative" />
  </SignalPills>
  <PlaceMetadata>
    <Category />
    <Distance />
    <Status />
  </PlaceMetadata>
  <ActionButtons>
    <CallButton />
    <WebsiteButton />
    <InstagramButton />
    <ShareButton />
  </ActionButtons>
</PlaceCard>
```

### **Data Requirements:**
- Place name, photo, category
- Top 3 signals (1 positive, 1 neutral, 1 negative)
- Distance from user
- Open/closed status
- Contact info (phone, website, Instagram)

---

## 🚀 **This Layout Should Be Preserved**

**Why:**
- Clean and scannable
- Shows transparency (good + bad)
- Mobile-optimized
- Action-oriented
- Consistent with MUVO brand

**When building Schema B integration:**
- Keep this exact card structure
- Preserve 3-signal display logic
- Maintain color coding
- Keep action buttons

---

**This is the gold standard for the places listing page!** ✨
