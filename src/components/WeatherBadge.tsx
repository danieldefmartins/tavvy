import { Wind, Thermometer } from 'lucide-react';
import { useWeather, WeatherData } from '@/hooks/useWeather';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

interface WeatherBadgeProps {
  latitude: number;
  longitude: number;
  variant?: 'compact' | 'full' | 'card';
  className?: string;
}

export function WeatherBadge({ latitude, longitude, variant = 'compact', className }: WeatherBadgeProps) {
  const { data: weather, isLoading, error } = useWeather(latitude, longitude);

  if (error) {
    return null; // Silently fail - weather is optional
  }

  if (isLoading) {
    if (variant === 'compact') {
      return <Skeleton className={cn("h-5 w-20 rounded-full", className)} />;
    }
    return <Skeleton className={cn("h-8 w-32 rounded-lg", className)} />;
  }

  if (!weather) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div 
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full",
          "bg-background/80 backdrop-blur-sm text-xs font-medium",
          className
        )}
        title={`${weather.description} - ${weather.temperature}°F, Wind: ${weather.windSpeed} mph`}
      >
        <span>{weather.icon}</span>
        <span>{weather.temperature}°</span>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div 
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg",
          "bg-secondary/50 text-sm",
          className
        )}
      >
        <span className="text-lg">{weather.icon}</span>
        <span className="font-medium">{weather.temperature}°F</span>
        <span className="text-muted-foreground">•</span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <Wind className="w-3.5 h-3.5" />
          {weather.windSpeed} mph
        </span>
        <span className="text-muted-foreground">•</span>
        <span className="text-muted-foreground">{weather.description}</span>
      </div>
    );
  }

  // Card variant - for place detail page
  return (
    <div 
      className={cn(
        "bg-card border border-border rounded-lg p-4",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{weather.icon}</span>
          <div>
            <div className="text-2xl font-bold">{weather.temperature}°F</div>
            <div className="text-sm text-muted-foreground">{weather.description}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Wind className="w-4 h-4" />
            <span className="font-medium">{weather.windSpeed} mph</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {weather.isDay ? 'Daytime' : 'Nighttime'}
          </div>
        </div>
      </div>
    </div>
  );
}
