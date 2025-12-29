import { Phone, Globe, Mail, MapPin, Facebook, Instagram } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaceContactInfoProps {
  address?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  className?: string;
}

export function PlaceContactInfo({
  address,
  addressLine1,
  addressLine2,
  city,
  state,
  zipCode,
  country,
  phone,
  email,
  website,
  facebookUrl,
  instagramUrl,
  className,
}: PlaceContactInfoProps) {
  // Build formatted address
  const formattedAddress = buildFormattedAddress({
    address,
    addressLine1,
    addressLine2,
    city,
    state,
    zipCode,
    country,
  });

  // Check if we have any contact info to display
  const hasContactInfo = formattedAddress || phone || website || email || facebookUrl || instagramUrl;

  if (!hasContactInfo) {
    return null;
  }

  return (
    <section className={cn("animate-fade-in", className)}>
      <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary" />
        Contact & Info
      </h2>
      
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        {/* Address */}
        {formattedAddress && (
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(formattedAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-foreground hover:text-primary transition-colors"
            >
              {formattedAddress}
            </a>
          </div>
        )}

        {/* Phone */}
        {phone && (
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <a
              href={`tel:${phone}`}
              className="text-sm text-foreground hover:text-primary transition-colors"
            >
              {phone}
            </a>
          </div>
        )}

        {/* Email */}
        {email && (
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <a
              href={`mailto:${email}`}
              className="text-sm text-foreground hover:text-primary transition-colors truncate"
            >
              {email}
            </a>
          </div>
        )}

        {/* Website */}
        {website && (
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <a
              href={ensureHttps(website)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline truncate"
            >
              {formatWebsiteDisplay(website)}
            </a>
          </div>
        )}

        {/* Social Media Icons */}
        {(facebookUrl || instagramUrl) && (
          <div className="flex items-center gap-4 pt-2 border-t border-border">
            {facebookUrl && (
              <a
                href={ensureHttps(facebookUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
            )}
            {instagramUrl && (
              <a
                href={ensureHttps(instagramUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// Helper function to build formatted address
function buildFormattedAddress(parts: {
  address?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
}): string | null {
  // If we have a full address field, use it
  if (parts.address) {
    return parts.address;
  }

  // Otherwise build from parts
  const lines: string[] = [];
  
  if (parts.addressLine1) {
    lines.push(parts.addressLine1);
  }
  if (parts.addressLine2) {
    lines.push(parts.addressLine2);
  }
  
  // City, State ZIP
  const cityStateZip: string[] = [];
  if (parts.city) cityStateZip.push(parts.city);
  if (parts.state) {
    if (parts.city) {
      cityStateZip[cityStateZip.length - 1] += ',';
    }
    cityStateZip.push(parts.state);
  }
  if (parts.zipCode) cityStateZip.push(parts.zipCode);
  
  if (cityStateZip.length > 0) {
    lines.push(cityStateZip.join(' '));
  }
  
  if (parts.country && parts.country !== 'USA' && parts.country !== 'US' && parts.country !== 'United States') {
    lines.push(parts.country);
  }
  
  return lines.length > 0 ? lines.join(', ') : null;
}

// Ensure URL has https://
function ensureHttps(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

// Format website for display (remove https:// and trailing slash)
function formatWebsiteDisplay(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
}
