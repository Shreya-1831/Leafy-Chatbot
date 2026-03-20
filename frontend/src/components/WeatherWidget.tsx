import React, { useEffect, useState } from 'react';
import { Cloud, Droplets, AlertTriangle, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

interface WeatherData {
  temp: number;
  humidity: number;
  description: string;
  location: string;
}

interface WeatherWidgetProps {
  compact?: boolean;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ compact = false }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      if (!navigator.geolocation) {
        setError(true);
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || 'demo';

          if (API_KEY === 'demo') {
            setWeather({ temp: 24, humidity: 75, description: 'Partly cloudy', location: 'Your Location' });
            setLoading(false);
            return;
          }

          try {
            const response = await axios.get(
              `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
            );
            setWeather({
              temp: Math.round(response.data.main.temp),
              humidity: response.data.main.humidity,
              description: response.data.weather[0].description,
              location: response.data.name,
            });
          } catch (apiError) {
            console.error('Weather API error:', apiError);
            setWeather({ temp: 24, humidity: 75, description: 'Partly cloudy', location: 'Your Location' });
          }

          setLoading(false);
        },
        (geoError) => {
          console.error('Geolocation error:', geoError);
          setWeather({ temp: 24, humidity: 75, description: 'Partly cloudy', location: 'Your Location' });
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(true);
      setLoading(false);
    }
  };

  const isHighFungalRisk = weather && weather.humidity > 70;

  useEffect(() => {
    if (isHighFungalRisk) {
      toast('High humidity detected! Increased risk of fungal diseases.', {
        icon: '⚠️',
        duration: 5000,
      });
    }
  }, [isHighFungalRisk]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error || !weather) return null;

  // ✅ Compact mode — minimal card for sidebar
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-sky-400 to-sky-600 dark:from-sky-600 dark:to-sky-800 rounded-lg p-3 text-white"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Cloud size={14} />
            <span className="text-xs font-medium">Weather</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] opacity-80">
            <MapPin size={10} />
            <span>{weather.location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold leading-none">{weather.temp}°C</p>
            <p className="text-[11px] opacity-80 capitalize mt-0.5">{weather.description}</p>
          </div>
          <div className="flex items-center gap-1">
            <Droplets size={14} />
            <div>
              <p className="text-lg font-bold leading-none">{weather.humidity}%</p>
              <p className="text-[10px] opacity-80">Humidity</p>
            </div>
          </div>
        </div>

        {isHighFungalRisk && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-blossom-500/90 rounded-md p-2 flex items-start gap-1.5 mt-2"
          >
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-medium">High Fungal Disease Risk</p>
              <p className="text-[10px] opacity-90">
                Humidity above 70%. Monitor plants closely for signs of fungal infections.
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // ✅ Full mode — original layout
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-sky-400 to-sky-600 dark:from-sky-600 dark:to-sky-800 rounded-lg shadow-md p-4 text-white"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Cloud size={24} className="mr-2" />
          <h3 className="font-medium">Weather</h3>
        </div>
        <div className="flex items-center text-sm opacity-90">
          <MapPin size={14} className="mr-1" />
          <span>{weather.location}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-3xl font-bold">{weather.temp}°C</p>
          <p className="text-sm opacity-90 capitalize">{weather.description}</p>
        </div>
        <div className="flex items-center">
          <Droplets size={20} className="mr-2" />
          <div>
            <p className="text-2xl font-bold">{weather.humidity}%</p>
            <p className="text-xs opacity-90">Humidity</p>
          </div>
        </div>
      </div>

      {isHighFungalRisk && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-blossom-500/90 rounded-lg p-3 flex items-start"
        >
          <AlertTriangle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium mb-1">High Fungal Disease Risk</p>
            <p className="text-xs opacity-90">
              Humidity above 70%. Monitor plants closely for signs of fungal infections.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default WeatherWidget;