import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// ===== INTERFACES =====

export interface CurrentWeather {
  city: string;
  country: string;
  lat: number;
  lon: number;
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pressure: number;
  visibility: number;
  condition: string;
  description: string;
  icon: string;
  cloudiness: number;
  windSpeed: number;
  windDeg: number;
  windGust: number;
  rain1h: number;
  sunrise: number;
  sunset: number;
  timezone: number;
}

export interface ForecastDay {
  date: string;
  day: string;
  tempMin: number;
  tempMax: number;
  avgTemp: number;
  condition: string;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  rain3h: number;
  pop: number;  // probability of precipitation (0-1)
}

export interface WeatherData {
  current: CurrentWeather;
  forecast: ForecastDay[];
  city: string;
  country: string;
}

@Injectable({ providedIn: 'root' })
export class WeatherService {

  private apiKey = environment.weatherApiKey;
  private apiUrl = environment.weatherApiUrl;
  private units = 'imperial';  // Fahrenheit + mph

  constructor(private http: HttpClient) { }

  // ===== FETCH both endpoints simultaneously =====
  getWeather(city: string): Observable<WeatherData> {

    const current$ = this.http.get<any>(
      `${this.apiUrl}/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=${this.units}`
    );

    const forecast$ = this.http.get<any>(
      `${this.apiUrl}/forecast?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=${this.units}`
    );

    return forkJoin({ current: current$, forecast: forecast$ }).pipe(
      map(({ current, forecast }) => ({
        city: forecast?.city?.name ?? current?.name ?? city,
        country: forecast?.city?.country ?? current?.sys?.country ?? '',
        current: this.mapCurrent(current),
        forecast: this.mapForecast(forecast)
      }))
    );
  }

  // ===== MAP current weather =====
  // based on your exact response fields
  private mapCurrent(data: any): CurrentWeather {
    return {
      // location
      city: data?.name ?? '',
      country: data?.sys?.country ?? '',
      lat: data?.coord?.lat ?? 0,
      lon: data?.coord?.lon ?? 0,

      // temperature — Fahrenheit with units=imperial
      temp: Math.round(data?.main?.temp ?? 0),
      feelsLike: Math.round(data?.main?.feels_like ?? data?.main?.temp ?? 0),
      tempMin: Math.round(data?.main?.temp_min ?? data?.main?.temp ?? 0),
      tempMax: Math.round(data?.main?.temp_max ?? data?.main?.temp ?? 0),

      // atmosphere
      humidity: data?.main?.humidity ?? 0,
      pressure: data?.main?.pressure ?? 1013,
      visibility: data?.visibility !== undefined ? Math.round(data.visibility / 1000) : 10,

      // condition
      condition: data?.weather?.[0]?.main ?? 'Clear',
      description: data?.weather?.[0]?.description ?? 'clear sky',
      icon: data?.weather?.[0]?.icon ?? '01d',
      cloudiness: data?.clouds?.all ?? 0,

      // wind
      windSpeed: Math.round(data?.wind?.speed ?? 0),
      windDeg: data?.wind?.deg ?? 0,
      windGust: data?.wind?.gust ? Math.round(data.wind.gust) : 0,

      // rain — "1h" key (current weather)
      rain1h: data?.rain?.['1h'] ?? 0,

      // sun times — unix timestamps
      sunrise: data?.sys?.sunrise ?? 0,
      sunset: data?.sys?.sunset ?? 0,
      timezone: data?.timezone ?? 0,
    };
  }

  // ===== MAP forecast =====
  // your response has entries every 3hrs — 40 total
  // dt_txt format: "2026-09-07 12:00:00"
  // rain key in forecast is "3h" NOT "1h"!
  private mapForecast(data: any): ForecastDay[] {

    // group all entries by date (YYYY-MM-DD)
    const groups: { [key: string]: any[] } = {};

    data.list.forEach((item: any) => {
      const dateKey = item.dt_txt.split(' ')[0]; // "2026-09-07"
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });

    // for each day — pick best representative entry
    // priority: 12:00 → 09:00 → 15:00 → first available
    const forecast: ForecastDay[] = [];

    Object.keys(groups).slice(0, 5).forEach(dateKey => {
      const entries = groups[dateKey];

      // find noon entry first
      const noon = entries.find((e: any) =>
        e.dt_txt.includes('12:00:00')
      );
      // fallback to 09:00
      const morning = entries.find((e: any) =>
        e.dt_txt.includes('09:00:00')
      );
      // fallback to first entry
      const rep = noon || morning || entries[0];

      // calculate min/max across all entries for that day
      const temps = entries.map((e: any) => e.main.temp);
      const minTemp = Math.round(Math.min(...temps));
      const maxTemp = Math.round(Math.max(...temps));

      // total rain for the day
      const totalRain = entries.reduce((sum: number, e: any) =>
        sum + (e.rain?.['3h'] ?? 0), 0   // forecast uses "3h" key!
      );

      // max pop (probability of precipitation)
      const maxPop = Math.max(...entries.map((e: any) => e.pop ?? 0));

      forecast.push({
        date: this.formatDate(dateKey),      // "Mon, 07 Sep"
        day: this.getDayName(dateKey),      // "Monday"
        tempMin: minTemp,
        tempMax: maxTemp,
        avgTemp: Math.round(
          entries.reduce((s: number, e: any) =>
            s + e.main.temp, 0) / entries.length
        ),
        condition: rep.weather[0].main,           // "Rain"
        description: rep.weather[0].description,    // "light rain"
        icon: rep.weather[0].icon,           // "10d"
        humidity: rep.main.humidity,             // 74
        windSpeed: Math.round(rep.wind.speed),    // mph
        rain3h: Math.round(totalRain * 10) / 10, // mm
        pop: Math.round(maxPop * 100),      // % chance of rain
      });
    });

    return forecast;
  }

  // ===== HELPERS =====

  // "2026-09-07" → "Mon, 07 Sep"
  formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });
  }

  // "2026-09-07" → "Monday"
  getDayName(dateStr: string): string {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  // unix → "07:15 AM"
  formatTime(unix: number): string {
    return new Date(unix * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // icon code → image URL
  getIconUrl(icon: string): string {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  }

  // wind degree → compass direction
  getWindDirection(deg: number): string {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  }

  // condition → theme color
  getThemeColor(condition: string): string {
    const c = condition.toLowerCase();
    if (c === 'clear') return '#0369a1';
    if (c === 'clouds') return '#374151';
    if (c === 'rain' || c === 'drizzle') return '#1e3a5f';
    if (c === 'thunderstorm') return '#1a1a2e';
    if (c === 'snow') return '#bfdbfe';
    if (c === 'mist' || c === 'fog'
      || c === 'haze') return '#4b5563';
    return '#111827';
  }

  // kelvin to fahrenheit (just in case units param fails)
  kelvinToF(k: number): number {
    return Math.round((k - 273.15) * 9 / 5 + 32);
  }

  // is it raining?
  isRaining(weather: CurrentWeather): boolean {
    return weather.rain1h > 0 ||
      weather.condition.toLowerCase().includes('rain');
  }
}