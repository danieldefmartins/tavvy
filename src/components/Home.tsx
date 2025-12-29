import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#008fc0] to-[#006a91] text-white px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img 
              src="/muvo-logo.png" 
              alt="MUVO" 
              className="h-16 w-auto"
            />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Reviews That Actually Help
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-white/90 leading-relaxed">
            No star ratings. No penalties. Just honest signals in <span className="font-bold">10 seconds</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              asChild 
              size="lg" 
              className="bg-white text-[#008fc0] hover:bg-gray-100 text-lg px-8 py-6"
            >
              <Link to="/places">
                Discover Places
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
            >
              <Link to="/how-it-works">
                How It Works
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 pt-8 text-sm">
            <div>
              <div className="text-3xl font-bold">10s</div>
              <div className="text-white/80">to review</div>
            </div>
            <div className="w-px bg-white/30" />
            <div>
              <div className="text-3xl font-bold">3</div>
              <div className="text-white/80">categories</div>
            </div>
            <div className="w-px bg-white/30" />
            <div>
              <div className="text-3xl font-bold">100%</div>
              <div className="text-white/80">honest</div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="currentColor" className="text-background"/>
          </svg>
        </div>
      </section>

      {/* How It's Different Section */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Why MUVO is Different
          </h2>
          <p className="text-lg text-muted-foreground">
            Traditional reviews are broken. We fixed them.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <div className="w-12 h-12 rounded-full bg-[#008fc0]/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-[#008fc0]" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Tap, Don't Type
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              No more writing essays. Just tap the signals that stood out. Takes 10 seconds.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <div className="w-12 h-12 rounded-full bg-[#008fc0]/10 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-[#008fc0]" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              No Penalties
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              One bad review doesn't tank the rating. Good qualities still shine through.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <div className="w-12 h-12 rounded-full bg-[#008fc0]/10 flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-[#008fc0]" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              See What Matters
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Spotty WiFi? Only matters if you need to work. Find places that match YOUR needs.
            </p>
          </div>
        </div>
      </section>

      {/* Example Section */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              See It In Action
            </h2>
            <p className="text-lg text-muted-foreground">
              Real signals from real people
            </p>
          </div>

          {/* Mock Place Card */}
          <div className="bg-card rounded-2xl overflow-hidden shadow-lg">
            <div className="relative h-48">
              <img
                src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800"
                alt="Example place"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Mountain View Campground
                </h3>
                <p className="text-muted-foreground">Boulder, CO • 127 reviews</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between bg-[#008fc0] text-white px-4 py-3 rounded-xl">
                  <span className="font-medium">👍 Beautiful Views</span>
                  <span className="text-lg font-bold">×89</span>
                </div>
                <div className="flex items-center justify-between bg-[#008fc0] text-white px-4 py-3 rounded-xl">
                  <span className="font-medium">👍 Clean Bathrooms</span>
                  <span className="text-lg font-bold">×76</span>
                </div>
                <div className="flex items-center justify-between bg-gray-500 text-white px-4 py-3 rounded-xl">
                  <span className="font-medium">⭐ Quiet</span>
                  <span className="text-lg font-bold">×71</span>
                </div>
                <div className="flex items-center justify-between bg-orange-500 text-white px-4 py-3 rounded-xl">
                  <span className="font-medium">⚠️ Spotty WiFi</span>
                  <span className="text-lg font-bold">×23</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground italic pt-2">
                89 people loved the views. 23 noted WiFi issues. Now YOU decide if it's right for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Ready to Make Better Decisions?
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of people using MUVO to find places that match their needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              asChild 
              size="lg" 
              className="bg-[#008fc0] hover:bg-[#007aa8] text-white text-lg px-8 py-6"
            >
              <Link to="/places">
                Start Exploring
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
