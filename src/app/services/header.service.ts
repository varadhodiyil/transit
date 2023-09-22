import { BehaviorSubject, Observable } from 'rxjs';

export class HeaderService {
  private $data = new BehaviorSubject('');
  setTitle(title: string) {
    this.$data.next(title);
  }
  getTitle() {
    return this.$data.asObservable();
  }
}
