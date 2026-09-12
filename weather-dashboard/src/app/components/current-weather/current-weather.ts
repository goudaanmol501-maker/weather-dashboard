import { Component, Input } from '@angular/core';
import { CurrentWeather, WeatherService } from '../../services/weather';
import { UpperCasePipe } from '@angular/common';
@Component({
  selector: 'app-current-weather',
  imports: [UpperCasePipe],
  templateUrl: './current-weather.html',
  styleUrl: './current-weather.css',
})
export class CurrentWeatherComponent {
  @Input() weather!: CurrentWeather;

  constructor(public weatherService: WeatherService) { }

  getWindArrowStyle(): string {
    return this.weather ? `transform: rotate(${this.weather.windDeg}deg)` : '';
  }

  getVisibilityLabel(): string {
    if (!this.weather) return '';
    const v = this.weather.visibility;
    if (v >= 10) return 'Excellent';
    if (v >= 5) return 'Good';
    if (v >= 2) return 'Moderate';
    return 'Poor';
  }

  getHumidityLabel(): string {
    if (!this.weather) return '';
    const h = this.weather.humidity;
    if (h >= 80) return 'Very High';
    if (h >= 60) return 'High';
    if (h >= 40) return 'Moderate';
    return 'Low';
  }

  getPressureLabel(): string {
    if (!this.weather) return '';
    const p = this.weather.pressure;
    if (p >= 1020) return 'High';
    if (p >= 1000) return 'Normal';
    return 'Low';
  }

  getConditionGradient(): string {
    if (!this.weather || !this.weather.condition) {
      return 'linear-gradient(135deg, #0a0f1a, #111827, #1f2937)';
    }
    const c = this.weather.condition.toLowerCase();
    if (c === 'clear')
      return 'linear-gradient(135deg, #0c4a6e, #0369a1, #0ea5e9)';
    if (c === 'clouds')
      return 'linear-gradient(135deg, #1f2937, #374151, #4b5563)';
    if (c === 'rain' || c === 'drizzle')
      return 'linear-gradient(135deg, #0f172a, #1e3a5f, #1e40af)';
    if (c === 'thunderstorm')
      return 'linear-gradient(135deg, #0f0f1a, #1a1a2e, #16213e)';
    if (c === 'snow')
      return 'linear-gradient(135deg, #e0f2fe, #bae6fd, #7dd3fc)';
    if (c === 'mist' || c === 'fog' || c === 'haze')
      return 'linear-gradient(135deg, #374151, #4b5563, #6b7280)';
    return 'linear-gradient(135deg, #0a0f1a, #111827, #1f2937)';
  }
}
