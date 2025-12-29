import { Header } from '@/components/Header';
import { HeroSection } from '@/components/home/HeroSection';
import { ValueChecklist } from '@/components/home/ValueChecklist';
import { SocialProof } from '@/components/home/SocialProof';
import { HowMuvoDifferent } from '@/components/home/HowMuvoDifferent';
import { MembershipsSection } from '@/components/home/MembershipsSection';
import { TrendingSection } from '@/components/home/TrendingSection';
import { BlogSection } from '@/components/home/BlogSection';
import { HowReviewsWork } from '@/components/home/HowReviewsWork';
import { usePlaces } from '@/hooks/usePlaces';

const Index = () => {
  const { data: places } = usePlaces();
  
  // Get trending places
  const trendingPlaces = places?.slice(0, 4) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      <Header />
      
      {/* Hero Section with Search */}
      <HeroSection />
      
      {/* Value Checklist - overlaps hero */}
      <ValueChecklist />
      
      {/* Social Proof */}
      <SocialProof />
      
      {/* How MUVO is Different */}
      <HowMuvoDifferent />
      
      {/* All Your Memberships */}
      <MembershipsSection />
      
      {/* Trending Near You */}
      <TrendingSection places={trendingPlaces} />
      
      {/* From the MUVO Blog */}
      <BlogSection />
      
      {/* How MUVO Reviews Work (full explanation) */}
      <HowReviewsWork />
    </div>
  );
};

export default Index;
