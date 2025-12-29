import { useState } from 'react';

import thousandTrailsLogo from '@/assets/memberships/thousand-trails.png';
import koaLogo from '@/assets/memberships/koa.jpg';
import goodSamLogo from '@/assets/memberships/good-sam.png';
import passportAmericaLogo from '@/assets/memberships/passport-america.jpeg';
import harvestHostsLogo from '@/assets/memberships/harvest-hosts.png';
import boondockersLogo from '@/assets/memberships/boondockers-welcome.png';
import escapeesLogo from '@/assets/memberships/escapees.png';
import rodLogo from '@/assets/memberships/resorts-of-distinction.jpeg';
import nationalParksLogo from '@/assets/memberships/national-parks.svg';

type MembershipLogo = {
  id: string;
  name: string;
  logo?: string;
};

// Membership logos - use local assets when available; fallback to monogram tiles
const memberships: MembershipLogo[] = [
  { id: 'thousand_trails', name: 'Thousand Trails', logo: thousandTrailsLogo },
  { id: 'koa', name: 'KOA', logo: koaLogo },
  { id: 'good_sam', name: 'Good Sam', logo: goodSamLogo },
  { id: 'passport_america', name: 'Passport America', logo: passportAmericaLogo },
  { id: 'harvest_hosts', name: 'Harvest Hosts', logo: harvestHostsLogo },
  { id: 'boondockers', name: 'Boondockers Welcome', logo: boondockersLogo },
  { id: 'escapees', name: 'Escapees RV Club', logo: escapeesLogo },
  { id: 'rod', name: 'Resorts of Distinction', logo: rodLogo },
  { id: 'national_parks', name: 'National Parks', logo: nationalParksLogo },
];

function getMonogram(name: string) {
  const words = name.replace(/[^a-zA-Z0-9 ]/g, '').split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
  return letters || name.slice(0, 2).toUpperCase();
}

export function MembershipsSection() {
  const [failedLogos, setFailedLogos] = useState<Set<string>>(() => new Set());

  return (
    <section className="py-8 sm:py-10 px-4" aria-labelledby="memberships-heading">
      <div className="max-w-md mx-auto text-center">
        <h2 id="memberships-heading" className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          All Your Memberships in One App
        </h2>
        <p className="text-base text-muted-foreground mb-8">
          Filter by what you already have
        </p>

        {/* Membership Logos Grid - 2 cols on mobile, 3 on larger */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {memberships.map((membership) => {
            const showFallback = !membership.logo || failedLogos.has(membership.id);

            return (
              <div
                key={membership.id}
                className="bg-card rounded-xl border border-border p-4 flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors"
              >
                <div className="w-full max-w-[140px] h-20 rounded-lg bg-muted/40 flex items-center justify-center p-2">
                  {!showFallback ? (
                    <img
                      src={membership.logo}
                      alt={`${membership.name} membership logo`}
                      className="w-full h-full object-contain"
                      decoding="async"
                      onError={() => {
                        setFailedLogos((prev) => new Set(prev).add(membership.id));
                      }}
                    />
                  ) : (
                    <div className="w-full h-full rounded-md bg-muted flex items-center justify-center">
                      <span className="text-sm font-bold text-muted-foreground tracking-wide">
                        {getMonogram(membership.name)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Always show label so the section never appears empty */}
                <span className="text-sm text-foreground font-semibold leading-tight">
                  {membership.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
