import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  @Output() citySearched = new EventEmitter<string>();

  searchQuery = '';
  isFocused = false;

  quickCities = ['New York', 'London', 'Tokyo', 'Dubai', 'Mumbai', 'Sydney', 'Beijing'];
  onSearch() {
    const city = this.searchQuery.trim();
    if (!city) return;
    this.citySearched.emit(city);
  }

  onEnter(event: KeyboardEvent) {
    if (event.key === 'Enter') this.onSearch();
  }

  onQuickSearch(city: string) {
    this.searchQuery = city;
    this.citySearched.emit(city);
  }

  clearSearch() {
    this.searchQuery = '';
  }
}
