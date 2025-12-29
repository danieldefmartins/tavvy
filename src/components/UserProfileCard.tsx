import { Award, CheckCircle, Mail, MapPin, Calendar, AtSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Profile } from '@/hooks/useAuth';
import { TrustedBadge } from './TrustedBadge';
import { ContributorLevelBadge } from './ContributorLevelBadge';
import { ReviewerMedalBadge } from './ReviewerMedalBadge';
import { format } from 'date-fns';

const TRAVELER_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  rv_full_timer: { label: 'RV Full-Timer', icon: '🚐' },
  weekend_rver: { label: 'Weekend RVer', icon: '🏕️' },
  van_life: { label: 'Van Life', icon: '🚌' },
  tent_camper: { label: 'Tent Camper', icon: '⛺' },
  just_exploring: { label: 'Just Exploring', icon: '🧭' },
};

interface UserProfileCardProps {
  profile: Profile;
}

export function UserProfileCard({ profile }: UserProfileCardProps) {
  const travelerInfo = profile.traveler_type ? TRAVELER_TYPE_LABELS[profile.traveler_type] : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span>{profile.full_name || profile.display_name || 'User'}</span>
              {profile.is_pro && <TrustedBadge />}
            </CardTitle>
            {profile.username && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <AtSign className="w-3 h-3" />
                {profile.username}
              </p>
            )}
          </div>
          {profile.contributor_level && (
            <ContributorLevelBadge level={profile.contributor_level} size="sm" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Badges Row */}
        <div className="flex flex-wrap gap-2">
          {travelerInfo && (
            <Badge variant="secondary" className="gap-1">
              <span>{travelerInfo.icon}</span>
              {travelerInfo.label}
            </Badge>
          )}
          {profile.reviewer_medal && profile.reviewer_medal !== 'none' && (
            <ReviewerMedalBadge medal={profile.reviewer_medal} size="sm" />
          )}
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {profile.home_base && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {profile.home_base}
            </div>
          )}
          {profile.created_at && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Since {format(new Date(profile.created_at), 'MMM yyyy')}
            </div>
          )}
        </div>

        {/* Email Status */}
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{profile.email}</span>
          {profile.email_verified && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="w-3 h-3 text-success" />
              Verified
            </Badge>
          )}
        </div>

        {/* Contribution Stats */}
        <div className="p-4 bg-secondary/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {profile.total_reviews_count}
                </p>
                <p className="text-xs text-muted-foreground">Reviews</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {profile.contribution_score}
                </p>
                <p className="text-xs text-muted-foreground">Contributions</p>
              </div>
            </div>
            {profile.is_pro && (
              <div className="flex flex-col items-center gap-1 p-3 bg-primary/10 rounded-lg">
                <Award className="w-8 h-8 text-primary" />
                <span className="text-xs font-medium text-primary">Trusted</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
