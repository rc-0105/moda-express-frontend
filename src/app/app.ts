import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProductListComponent } from './features/product-list/product-list';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ProductListComponent],
  template: `
    <main>
      <app-product-list></app-product-list>
      <router-outlet></router-outlet>
    </main>
  `,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('modaexpress-frontend');
}
