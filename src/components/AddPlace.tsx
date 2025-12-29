import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  'Restaurant',
  'RV Park',
  'Campground',
  'Cafe',
  'Hotel',
  'Bar',
  'Attraction',
  'Service',
  'Other',
];

export function AddPlace() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    address: '',
    city: '',
    state: '',
    country: 'USA',
    phone: '',
    website: '',
    description: '',
    image_url: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.category || !formData.address || !formData.city || !formData.state) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // In production, geocode the address and insert to Supabase:
      // 
      // // Geocode address
      // const geocoder = new google.maps.Geocoder();
      // const result = await geocoder.geocode({ 
      //   address: `${formData.address}, ${formData.city}, ${formData.state}` 
      // });
      // 
      // const location = result.results[0].geometry.location;
      // 
      // // Get current user
      // const { data: { user } } = await supabase.auth.getUser();
      // 
      // // Insert place
      // const { data: place, error } = await supabase
      //   .from('places')
      //   .insert({
      //     ...formData,
      //     latitude: location.lat(),
      //     longitude: location.lng(),
      //     created_by: user?.id,
      //   })
      //   .select()
      //   .single();
      // 
      // if (error) throw error;
      // 
      // navigate(`/place/${place.id}`);

      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Place added!',
        description: 'Thanks for contributing to MUVO.',
      });

      navigate('/places');
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error adding place',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-[#008fc0] text-white px-4 py-6">
        <h1 className="text-2xl font-bold">Add a Place</h1>
        <p className="text-sm text-white/80 mt-1">
          Help others discover great places
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground">
            Place Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Mountain View Campground"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category" className="text-foreground">
            Category <span className="text-red-500">*</span>
          </Label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address" className="text-foreground">
            Street Address <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="address"
              name="address"
              type="text"
              placeholder="123 Main Street"
              value={formData.address}
              onChange={handleChange}
              className="pl-10"
              required
            />
          </div>
        </div>

        {/* City & State */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city" className="text-foreground">
              City <span className="text-red-500">*</span>
            </Label>
            <Input
              id="city"
              name="city"
              type="text"
              placeholder="Boulder"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state" className="text-foreground">
              State <span className="text-red-500">*</span>
            </Label>
            <Input
              id="state"
              name="state"
              type="text"
              placeholder="CO"
              value={formData.state}
              onChange={handleChange}
              maxLength={2}
              required
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-foreground">
            Phone Number
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website" className="text-foreground">
            Website
          </Label>
          <Input
            id="website"
            name="website"
            type="url"
            placeholder="https://example.com"
            value={formData.website}
            onChange={handleChange}
          />
        </div>

        {/* Image URL */}
        <div className="space-y-2">
          <Label htmlFor="image_url" className="text-foreground">
            Image URL
          </Label>
          <div className="relative">
            <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="image_url"
              name="image_url"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={formData.image_url}
              onChange={handleChange}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Optional: Add a photo URL (Unsplash, Imgur, etc.)
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-foreground">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Tell us about this place..."
            value={formData.description}
            onChange={handleChange}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Optional: Add a brief description
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#008fc0] hover:bg-[#007aa8] text-white text-lg py-6"
            size="lg"
          >
            {loading ? 'Adding Place...' : 'Add Place'}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          By adding a place, you agree to provide accurate information.
        </p>
      </form>
    </div>
  );
}
