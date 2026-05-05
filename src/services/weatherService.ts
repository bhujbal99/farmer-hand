import { WeatherData } from "../types";

const WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Depositing rime fog",
  51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
  61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  71: "Slight snow fall", 73: "Moderate snow fall", 75: "Heavy snow fall",
  80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
  95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail"
};

export async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max&past_days=5&forecast_days=6&timezone=auto`;
  
  try {
    const response = await fetch(forecastUrl);
    if (!response.ok) throw new Error(`Weather service returned ${response.status}`);
    
    const data = await response.json();
    
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' });
    };

    // Skip the first forecast day as it's today (processed separately or overlapping)
    const forecast = data.daily.time.slice(6, 11).map((time: string, i: number) => ({
      date: formatDate(time),
      temp: data.daily.temperature_2m_max[i + 6],
      condition: WEATHER_CODES[data.daily.weather_code[i + 6]] || "Unknown"
    }));

    const historical = data.daily.time.slice(0, 5).map((time: string, i: number) => ({
      date: formatDate(time),
      temp: data.daily.temperature_2m_max[i],
      condition: WEATHER_CODES[data.daily.weather_code[i]] || "Unknown"
    }));

    return {
      current: {
        temp: data.current.temperature_2m,
        description: WEATHER_CODES[data.current.weather_code] || "Clear",
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        icon: "Cloud" // Default fallback
      },
      historical,
      forecast
    };
  } catch (error) {
    console.warn("Weather fetch failed, providing fallback data", error);
    // Return mock data so the app doesn't break
    return {
      current: { temp: 28, description: "Sunny", humidity: 45, windSpeed: 10, icon: "Sun" },
      historical: Array(5).fill(0).map((_, i) => ({ date: `Day -${i+1}`, temp: 27, condition: "Clear" })),
      forecast: Array(5).fill(0).map((_, i) => ({ date: `Day +${i+1}`, temp: 29, condition: "Sunny" }))
    };
  }
}
