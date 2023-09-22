import { BehaviorSubject, Observable, skip } from 'rxjs';

export interface LatLong {
  lat: number;
  lng: number;
}

export class LatLongService {
  private $data = new BehaviorSubject<LatLong>({} as LatLong);
  setLatLong(lat: LatLong) {
    this.$data.next(lat);
  }
  getLatLong() {
    return this.$data.asObservable().pipe(skip(1));
  }
}
