import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/shared/header/header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <app-header></app-header>
    <main class="py-4">
      <div class="container">
        <router-outlet></router-outlet>
      </div>
    </main>
  `,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('modaexpress-frontend');
}
