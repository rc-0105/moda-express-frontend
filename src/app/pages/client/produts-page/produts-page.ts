// src/app/pages/client/products-page/products-page.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductListPageComponent } from '../product-list/product-list.component';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, ProductListPageComponent],
  template: `
    <div class="container">
      <h1 class="my-4">Productos</h1>
      <app-product-list-page></app-product-list-page>
    </div>
  `
})
export class ProductsPageComponent {}
