import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar';
import { CurrentWeatherComponent } from '../../components/current-weather/current-weather';
import { WeatherService, WeatherData } from '../../services/weather';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NavbarComponent, CurrentWeatherComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {

  weatherData: WeatherData | null = null;
  isLoading = false;
  error = '';

  constructor(private weatherService: WeatherService) { }

  onCitySearch(city: string) {
    if (!city) return;
    this.isLoading = true;
    this.error = '';
    this.weatherData = null;

    this.weatherService.getWeather(city).subscribe({
      next: (data) => {
        this.weatherData = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 404) {
          this.error = `CITY "${city.toUpperCase()}" NOT FOUND`;
        } else if (err.status === 401) {
          this.error = 'INVALID API KEY';
        } else {
          this.error = 'CONNECTION ERROR — TRY AGAIN';
        }
      }
    });
  }
}