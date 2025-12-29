import { useQuery } from '@tanstack/react-query';

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  description: string;
  icon: string;
}

// WMO Weather interpretation codes
const weatherCodeToDescription: Record<number, { description: string; dayIcon: string; nightIcon: string }> = {
  0: { description: 'Clear', dayIcon: '☀️', nightIcon: '🌙' },
  1: { description: 'Mainly clear', dayIcon: '🌤️', nightIcon: '🌙' },
  2: { description: 'Partly cloudy', dayIcon: '⛅', nightIcon: '☁️' },
  3: { description: 'Overcast', dayIcon: '☁️', nightIcon: '☁️' },
  45: { description: 'Foggy', dayIcon: '🌫️', nightIcon: '🌫️' },
  48: { description: 'Rime fog', dayIcon: '🌫️', nightIcon: '🌫️' },
  51: { description: 'Light drizzle', dayIcon: '🌧️', nightIcon: '🌧️' },
  53: { description: 'Drizzle', dayIcon: '🌧️', nightIcon: '🌧️' },
  55: { description: 'Heavy drizzle', dayIcon: '🌧️', nightIcon: '🌧️' },
  56: { description: 'Freezing drizzle', dayIcon: '🌨️', nightIcon: '🌨️' },
  57: { description: 'Heavy freezing drizzle', dayIcon: '🌨️', nightIcon: '🌨️' },
  61: { description: 'Light rain', dayIcon: '🌧️', nightIcon: '🌧️' },
  63: { description: 'Rain', dayIcon: '🌧️', nightIcon: '🌧️' },
  65: { description: 'Heavy rain', dayIcon: '🌧️', nightIcon: '🌧️' },
  66: { description: 'Freezing rain', dayIcon: '🌨️', nightIcon: '🌨️' },
  67: { description: 'Heavy freezing rain', dayIcon: '🌨️', nightIcon: '🌨️' },
  71: { description: 'Light snow', dayIcon: '❄️', nightIcon: '❄️' },
  73: { description: 'Snow', dayIcon: '❄️', nightIcon: '❄️' },
  75: { description: 'Heavy snow', dayIcon: '❄️', nightIcon: '❄️' },
  77: { description: 'Snow grains', dayIcon: '❄️', nightIcon: '❄️' },
  80: { description: 'Light showers', dayIcon: '🌦️', nightIcon: '🌧️' },
  81: { description: 'Showers', dayIcon: '🌦️', nightIcon: '🌧️' },
  82: { description: 'Heavy showers', dayIcon: '🌧️', nightIcon: '🌧️' },
  85: { description: 'Light snow showers', dayIcon: '🌨️', nightIcon: '🌨️' },
  86: { description: 'Snow showers', dayIcon: '🌨️', nightIcon: '🌨️' },
  95: { description: 'Thunderstorm', dayIcon: '⛈️', nightIcon: '⛈️' },
  96: { description: 'Thunderstorm with hail', dayIcon: '⛈️', nightIcon: '⛈️' },
  99: { description: 'Severe thunderstorm', dayIcon: '⛈️', nightIcon: '⛈️' },
};

function getWeatherInfo(code: number, isDay: boolean): { description: string; icon: string } {
  const info = weatherCodeToDescription[code] || { description: 'Unknown', dayIcon: '🌡️', nightIcon: '🌡️' };
  return {
    description: info.description,
    icon: isDay ? info.dayIcon : info.nightIcon,
  };
}

async function fetchWeather(latitude: number, longitude: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code,is_day&temperature_unit=fahrenheit&wind_speed_unit=mph`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }
  
  const data = await response.json();
  const current = data.current;
  const isDay = current.is_day === 1;
  const weatherInfo = getWeatherInfo(current.weather_code, isDay);
  
  return {
    temperature: Math.round(current.temperature_2m),
    windSpeed: Math.round(current.wind_speed_10m),
    weatherCode: current.weather_code,
    isDay,
    description: weatherInfo.description,
    icon: weatherInfo.icon,
  };
}

export function useWeather(latitude: number, longitude: number, enabled = true) {
  return useQuery({
    queryKey: ['weather', latitude, longitude],
    queryFn: () => fetchWeather(latitude, longitude),
    enabled: enabled && !!latitude && !!longitude,
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    retry: 1,
  });
}
