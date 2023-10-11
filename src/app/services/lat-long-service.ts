import { BehaviorSubject, skipUntil, skipWhile } from 'rxjs';
import { Stops } from './data/stop';

export interface LatLong {
  lat: number;
  lng: number;
}

export interface BusStop {
  stop_code: number | string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  distance?: number;
}
export class LatLongService {
  private $data = new BehaviorSubject<LatLong>({} as LatLong);
  setLatLong(lat: LatLong) {
    this.$data.next(lat);
  }
  getLatLong() {
    return this.$data.asObservable().pipe(
      skipWhile((e) => {
        return Object.keys(e).length === 0;
      })
    );
  }

  calcDist(arg1: LatLong, arg2: LatLong) {
    const R = 6371e3; // metres
    const φ1 = (arg1.lat * Math.PI) / 180; // φ, λ in radians
    const φ2 = (arg2.lng * Math.PI) / 180;
    const Δφ = ((arg2.lat - arg1.lat) * Math.PI) / 180;
    const Δλ = ((arg2.lng - arg1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return (R * c) / 1000;
  }

  toRadians(val: number) {
    return (val * Math.PI) / 180;
  }
  nearest(currentLocation: LatLong, n = 5): Promise<BusStop[]> {
    return new Promise((resolve, reject) => {
      const matched = Stops.filter((stop) => {
        return (
          this.calcDist(currentLocation, {
            lat: stop.stop_lat,
            lng: stop.stop_lon,
          }) <= n
        );
      });
      resolve(matched);
    });
  }
  getStops(currentLocation: LatLong, q: string) {
    return Stops.filter(
      (e: BusStop) =>
        e.stop_name.toLowerCase().includes(q.toLowerCase()) ||
        (parseInt(q) && e.stop_code === parseInt(q))
    )
      .map((e: BusStop) => {
        e.distance = this.calcDist(currentLocation, {
          lat: e.stop_lat,
          lng: e.stop_lon,
        });
        return e;
      })
      .sort((a, b) => {
        if (a.distance && b.distance) {
          return a.distance - b.distance;
        }
        return -1;
      })
      .slice(0, 10);
  }
}
