import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { LatLong } from './lat-long-service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(protected httpClient: HttpClient) {}
}

export class WeatherService extends ApiService {
  BASE =
    'https://api.openweathermap.org/data/2.5/weather?appid=456d3fef325001aef7f0e6cb34ee8b31&units=metric';
  getWeather(lat: number, long: number) {
    return this.httpClient.get(this.BASE, {
      params: { lat: lat, lon: long },
    });

    return of({
      coord: { lon: -6.3081, lat: 53.3992 },
      weather: [{ id: 701, main: 'Mist', description: 'mist', icon: '50n' }],
      base: 'stations',
      main: {
        temp: 14.24,
        feels_like: 14.25,
        temp_min: 13.99,
        temp_max: 14.62,
        pressure: 1004,
        humidity: 97,
      },
      visibility: 3000,
      wind: { speed: 1.54, deg: 0 },
      clouds: { all: 75 },
      dt: 1694983003,
      sys: {
        type: 1,
        id: 1565,
        country: 'IE',
        sunrise: 1694930497,
        sunset: 1694975901,
      },
      timezone: 3600,
      id: 2964303,
      name: 'Finglas',
      cod: 200,
    });
  }
}

export class BusTimesService extends ApiService {
  getBusTimes(max: LatLong, min: LatLong) {
    return this.httpClient.get('https://bustimes.org/vehicles.json', {
      params: {
        ymax: max.lat,
        xmax: max.lng,
        ymin: min.lat,
        xmin: min.lng,
      },
    });
  }
}
