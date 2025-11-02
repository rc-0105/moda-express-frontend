// src/app/pages/client/products-page/products-page.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductListComponent } from '../../../features/product-list/product-list';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, ProductListComponent],
  template: `
    <div class="container">
      <h1 class="my-4">Productos</h1>
      <app-product-list></app-product-list>
    </div>
  `
})
export class ProductsPageComponent {}
