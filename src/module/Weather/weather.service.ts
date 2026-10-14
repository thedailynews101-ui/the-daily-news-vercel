import config from "../../config";

export type WeatherCondition = "sunny" | "cloudy" | "rainy" | "stormy" | "snowy" | "windy";

export type WeatherSnapshot = {
  location: string;
  temperatureC: number;
  condition: WeatherCondition;
  high: number;
  low: number;
  updatedAt: string;
};

/** Map Open-Meteo WMO weather codes to our widget conditions. */
const mapWmoCode = (code: number): WeatherCondition => {
  if (code === 0) return "sunny";
  if (code >= 1 && code <= 3) return "cloudy";
  if (code === 45 || code === 48) return "cloudy";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rainy";
  if (code >= 71 && code <= 77) return "snowy";
  if (code >= 95 && code <= 99) return "stormy";
  if (code >= 85 && code <= 86) return "snowy";
  return "cloudy";
};

const fallbackWeather = (): WeatherSnapshot => ({
  location: config.weather.locationLabel,
  temperatureC: 26,
  condition: "cloudy",
  high: 31,
  low: 25,
  updatedAt: new Date().toISOString(),
});

export const getWeatherSnapshot = async (): Promise<WeatherSnapshot> => {
  const { lat, lon, locationLabel } = config.weather;
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
    `&timezone=auto`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return fallbackWeather();
    }

    const data = (await response.json()) as {
      current?: {
        temperature_2m?: number;
        weather_code?: number;
        wind_speed_10m?: number;
        time?: string;
      };
      daily?: {
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
      };
    };

    const temp = data.current?.temperature_2m;
    const code = data.current?.weather_code;
    if (typeof temp !== "number" || typeof code !== "number") {
      return fallbackWeather();
    }

    let condition = mapWmoCode(code);
    const wind = data.current?.wind_speed_10m ?? 0;
    if (wind >= 40 && condition === "sunny") {
      condition = "windy";
    }

    const high = data.daily?.temperature_2m_max?.[0];
    const low = data.daily?.temperature_2m_min?.[0];

    return {
      location: locationLabel,
      temperatureC: Math.round(temp),
      condition,
      high: typeof high === "number" ? Math.round(high) : Math.round(temp + 2),
      low: typeof low === "number" ? Math.round(low) : Math.round(temp - 2),
      updatedAt: data.current?.time ?? new Date().toISOString(),
    };
  } catch {
    return fallbackWeather();
  }
};
