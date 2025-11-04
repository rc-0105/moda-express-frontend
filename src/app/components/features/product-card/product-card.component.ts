import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../models/product.model';

@Component({
  standalone: true,
  selector: 'app-product-card',
  imports: [CommonModule],
  template: `
    <div class="card h-100">
      <img [src]="product.imagen_url || 'assets/uploads/placeholder.png'" class="card-img-top" alt="{{product.nombre}}" />
      <div class="card-body d-flex flex-column">
        <h5 class="card-title">{{ product.nombre }}</h5>
        <p class="card-text text-muted small mb-2">{{ product.descripcion }}</p>
        <div class="mt-auto d-flex justify-content-between align-items-center">
          <strong class="text-primary">{{ product.precio | currency:'COP':'symbol':'1.0-0' }}</strong>
          <button class="btn btn-sm btn-outline-primary">Ver</button>
        </div>
      </div>
    </div>
  `
})
export class ProductCardComponent {
  @Input() product!: Product;
}
