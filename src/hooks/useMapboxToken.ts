import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMapboxToken() {
  return useQuery({
    queryKey: ['mapbox-token'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error) {
        console.error('Mapbox token error:', error);
        throw new Error('Failed to fetch Mapbox token');
      }
      
      if (!data?.token) {
        throw new Error('Mapbox token not configured');
      }
      
      return data.token as string;
    },
    staleTime: Infinity, // Token doesn't change
    retry: 2,
  });
}
