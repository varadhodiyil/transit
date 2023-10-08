import { Component, OnInit } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { WeatherService } from 'src/app/services/api-service.service';
import { HeaderService } from 'src/app/services/header.service';
import { LatLongService } from 'src/app/services/lat-long-service';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  currentTab = '';
  constructor(
    private weatherService: WeatherService,
    private headrService: HeaderService,
    private latLongService: LatLongService
  ) {}

  ngOnInit() {
    this.headrService.getTitle().subscribe((d) => {
      this.currentTab = d;
    });
    this.getCordinates().then((d) => {});
  }

  getCordinates = async () => {
    const coordinates = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
    }).then((d) => {
      return d.coords;
    });

    this.latLongService.setLatLong({
      lat: coordinates.latitude,
      lng: coordinates.longitude,
    });
    this.weatherService
      .getWeather(coordinates.latitude, coordinates.longitude)
      .subscribe((d: any) => {
        this.currentTab = `${d['main']['feels_like']}\xB0 C - ${d['weather'][0]['description']} - ${d['wind']['speed']} km/h `;
      });
  };
}
