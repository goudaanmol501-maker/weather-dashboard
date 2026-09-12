import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
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
export class HomeComponent implements OnInit {

  private weatherService = inject(WeatherService);
  private cdr = inject(ChangeDetectorRef);

  weatherData = signal<WeatherData | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string>('');

  ngOnInit(): void {
    this.onCitySearch('London');
  }

  onCitySearch(city: string) {
    console.log('City searched:', city); 
    if (!city) return;
    this.isLoading.set(true);
    this.error.set('');
    this.weatherData.set(null);
    this.cdr.markForCheck();

    this.weatherService.getWeather(city).subscribe({
      next: (data) => {
        console.log('weather data', data);
        this.weatherData.set(data);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Weather fetch error:', err);
        this.isLoading.set(false);
        if (err.status === 404) {
          this.error.set(`CITY "${city.toUpperCase()}" NOT FOUND`);
        } else if (err.status === 401) {
          this.error.set('INVALID API KEY');
        } else {
          this.error.set('CONNECTION ERROR — TRY AGAIN');
        }
        this.cdr.markForCheck();
      }
    });
  }
}