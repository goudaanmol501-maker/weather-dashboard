import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentWeatherComponent } from './current-weather';

describe('CurrentWeatherComponent', () => {
  let component: CurrentWeatherComponent;
  let fixture: ComponentFixture<CurrentWeatherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrentWeatherComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrentWeatherComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
