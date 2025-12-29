import { PlaceCategory } from '@/hooks/usePlaces';

// MUVO Brand Colors
export const MUVO_BRAND = {
  blue: '#10A9D6',
  bluePressed: '#0D8FB7',
  blueTint: '#E8F6FB',
  textPrimary: '#111111',
  textSecondary: '#6B7280',
  background: '#FFFFFF',
  softBackground: '#F8FAFC',
  border: '#E5E7EB',
} as const;

// Category color mapping (HEX) - EXPANDED FOR RV LIFE
export const CATEGORY_COLORS: Record<string, string> = {
  // === PLACES TO STAY ===
  'RV Campground': '#2563EB',        // Deep Blue
  'Luxury RV Resort': '#7C3AED',     // Purple
  'RV Resort': '#7C3AED',            // Purple (alias)
  'Boondocking': '#16A34A',          // Forest Green
  'Overnight Parking': '#EAB308',    // Amber
  'Street Parking': '#F59E0B',       // Orange-Amber
  'State Park': '#22C55E',           // Green
  'National Park': '#16A34A',        // Forest Green
  'County / Regional Park': '#22C55E', // Green
  'Rest Area / Travel Plaza': '#0EA5E9', // Sky
  'Fairgrounds / Event Grounds': '#F97316', // Orange
  'Business Allowing Overnight': '#EAB308', // Amber
  
  // === RV SERVICES ===
  'Dump Station': '#F97316',         // Orange
  'Water Fill': '#06B6D4',           // Cyan
  'Fresh Water': '#06B6D4',          // Cyan (alias)
  'Propane': '#EF4444',              // Red
  'Laundromat': '#3B82F6',           // Blue
  'Showers': '#3B82F6',              // Blue
  'RV Repair': '#8B5CF6',            // Violet
  'Mechanics': '#8B5CF6',            // Violet (alias)
  
  // === HOOKUPS ===
  'Electric Hookups': '#7C3AED',     // Purple
  'Sewer Hookups': '#7C3AED',        // Purple
  
  // === PET FRIENDLY ===
  'Dog Park': '#84CC16',             // Lime
  'Dog Friendly Place': '#65A30D',   // Green-Lime
  'Pet Friendly': '#84CC16',         // Lime (alias)
  
  // === OTHER SERVICES ===
  'Tire Service': '#8B5CF6',         // Violet
  'Gas Station': '#EF4444',          // Red
  'Wi-Fi': '#A855F7',                // Purple alt
  
  // === NATURE & EXPERIENCES ===
  'Scenic Viewpoint': '#EC4899',     // Pink
  'Hiking Trailhead': '#22C55E',     // Green
  'Beach Access': '#0EA5E9',         // Sky
  
  // === OTHER ===
  'Groceries': '#14B8A6',            // Teal
  'RV Storage': '#64748B',           // Slate
  'Caution': '#111827',              // Near Black
};

// Icon names for each category (lucide icons)
export const CATEGORY_ICONS: Record<string, string> = {
  // === PLACES TO STAY ===
  'RV Campground': 'Tent',
  'Luxury RV Resort': 'Sparkles',
  'RV Resort': 'Sparkles',
  'Boondocking': 'Mountain',
  'Overnight Parking': 'ParkingCircle',
  'Street Parking': 'Car',
  'State Park': 'Trees',
  'National Park': 'TreePine',
  'County / Regional Park': 'Trees',
  'Rest Area / Travel Plaza': 'CircleParking',
  'Fairgrounds / Event Grounds': 'Flag',
  'Business Allowing Overnight': 'Store',
  
  // === RV SERVICES ===
  'Dump Station': 'Droplets',
  'Water Fill': 'Droplet',
  'Fresh Water': 'Droplet',
  'Propane': 'Flame',
  'Laundromat': 'WashingMachine',
  'Showers': 'ShowerHead',
  'RV Repair': 'Wrench',
  'Mechanics': 'Wrench',
  
  // === HOOKUPS ===
  'Electric Hookups': 'Zap',
  'Sewer Hookups': 'Droplets',
  
  // === PET FRIENDLY ===
  'Dog Park': 'Dog',
  'Dog Friendly Place': 'Dog',
  'Pet Friendly': 'Dog',
  
  // === OTHER SERVICES ===
  'Tire Service': 'Circle',
  'Gas Station': 'Fuel',
  'Wi-Fi': 'Wifi',
  
  // === NATURE & EXPERIENCES ===
  'Scenic Viewpoint': 'Eye',
  'Hiking Trailhead': 'Footprints',
  'Beach Access': 'Waves',
  
  // === OTHER ===
  'Groceries': 'ShoppingCart',
  'RV Storage': 'Warehouse',
};

// Category labels for display (human-readable)
export const CATEGORY_LABELS: Record<string, string> = {
  'RV Campground': 'RV Campground',
  'Luxury RV Resort': 'Luxury RV Resort',
  'Boondocking': 'Boondocking',
  'Overnight Parking': 'Overnight Parking',
  'Street Parking': 'Street Parking',
  'State Park': 'State Park',
  'National Park': 'National Park',
  'County / Regional Park': 'County Park',
  'Rest Area / Travel Plaza': 'Rest Area',
  'Fairgrounds / Event Grounds': 'Fairgrounds',
  'Business Allowing Overnight': 'Business Overnight',
  'Dump Station': 'Dump Station',
  'Water Fill': 'Water Fill',
  'Propane': 'Propane',
  'Laundromat': 'Laundromat',
  'Showers': 'Showers',
  'RV Repair': 'RV Repair',
  'Dog Park': 'Dog Park',
  'Dog Friendly Place': 'Dog Friendly',
};

// Default color for unknown categories
export const DEFAULT_CATEGORY_COLOR = '#64748B'; // Slate

/**
 * Get the color for a given place category
 */
export function getCategoryColor(category: string | undefined | null): string {
  if (!category) return DEFAULT_CATEGORY_COLOR;
  return CATEGORY_COLORS[category] || DEFAULT_CATEGORY_COLOR;
}

/**
 * Get the icon name for a given category
 */
export function getCategoryIconName(category: string | undefined | null): string {
  if (!category) return 'MapPin';
  return CATEGORY_ICONS[category] || 'MapPin';
}

/**
 * Get a readable label for a category
 */
export function getCategoryLabel(category: string | undefined | null): string {
  if (!category) return 'Place';
  return CATEGORY_LABELS[category] || category;
}

/**
 * Get SVG icon for a category (for map pins)
 */
export function getCategoryIconSVG(category: string | undefined | null, size: number = 16, color: string = 'white'): string {
  const iconName = getCategoryIconName(category);
  
  // Map of icon names to their SVG paths (subset of lucide icons)
  const SVG_PATHS: Record<string, string> = {
    'Tent': '<path d="M3.5 21 14 3m0 0 10.5 18M14 3v18"/><path d="M3.5 21h17"/>',
    'Sparkles': '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
    'Mountain': '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
    'ParkingCircle': '<circle cx="12" cy="12" r="10"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
    'Car': '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    'Trees': '<path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M10.3 14H19a3 3 0 0 0-1-5.8V8a3 3 0 0 0-6 0v.2A3 3 0 0 0 10.3 14Z"/>',
    'TreePine': '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/>',
    'CircleParking': '<circle cx="12" cy="12" r="10"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
    'Flag': '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
    'Store': '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>',
    'Droplets': '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>',
    'Droplet': '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
    'Zap': '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    'Wrench': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    'Flame': '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    'Fuel': '<line x1="3" x2="15" y1="22" y2="22"/><line x1="4" x2="14" y1="9" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/>',
    'WashingMachine': '<path d="M3 6h3"/><path d="M17 6h.01"/><rect width="18" height="20" x="3" y="2" rx="2"/><circle cx="12" cy="13" r="5"/><path d="M12 18a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 1 0-5"/>',
    'ShowerHead': '<path d="m4 4 2.5 2.5"/><path d="M13.5 6.5a4.95 4.95 0 0 0-7 7"/><path d="M15 5 5 15"/><path d="M14 17v.01"/><path d="M10 16v.01"/><path d="M13 13v.01"/><path d="M16 10v.01"/><path d="M11 20v.01"/><path d="M17 14v.01"/><path d="M20 11v.01"/>',
    'Wifi': '<path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" x2="12.01" y1="20" y2="20"/>',
    'Dog': '<path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5"/><path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306"/>',
    'Eye': '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    'Footprints': '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/>',
    'Waves': '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
    'ShoppingCart': '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    'Warehouse': '<path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12"/><path d="M6 14h12"/><rect width="12" height="12" x="6" y="10"/>',
    'Circle': '<circle cx="12" cy="12" r="10"/>',
    'MapPin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  };
  
  const path = SVG_PATHS[iconName] || SVG_PATHS['MapPin'];
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: ${size}px; height: ${size}px;">${path}</svg>`;
}

/**
 * Convert hex to RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Get category color with opacity (for backgrounds)
 */
export function getCategoryColorWithOpacity(category: string | undefined | null, opacity: number = 0.12): string {
  const hex = getCategoryColor(category);
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(100, 116, 139, ${opacity})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

/**
 * Determine if text should be white or black for contrast
 */
export function getContrastTextColor(hexColor: string): 'white' | 'black' {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 'white';
  
  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? 'black' : 'white';
}

/**
 * Get all category colors for CSS variables injection
 */
export function getCategoryColorsCSS(): Record<string, string> {
  return Object.entries(CATEGORY_COLORS).reduce((acc, [key, value]) => {
    const cssKey = key.toLowerCase().replace(/[^a-z0-9]/g, '-');
    acc[`--category-${cssKey}`] = value;
    return acc;
  }, {} as Record<string, string>);
}
