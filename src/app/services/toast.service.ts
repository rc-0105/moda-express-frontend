import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private messages = new Subject<string>();
  get messages$(): Observable<string> { return this.messages.asObservable(); }

  show(message: string, duration = 3000) {
    this.messages.next(message);
    // duration handling is done by subscribers (they can auto-hide)
  }
}
