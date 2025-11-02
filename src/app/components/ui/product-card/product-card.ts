// src/app/components/ui/product-card/product-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../models/product.interface';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card h-100" role="group" [attr.aria-label]="'Producto ' + (product?.nombre || '')">
      <img [src]="product?.imagen_url || 'assets/images/placeholder.png'"
           [alt]="product?.nombre || 'Imagen de producto'"
           class="card-img-top" />
      <div class="card-body d-flex flex-column">
        <h6 class="card-title mb-1">{{ product?.nombre }}</h6>
        <p class="card-text small text-muted mb-2 text-truncate">{{ product?.descripcion }}</p>
        <div class="mt-auto d-flex justify-content-between align-items-center">
          <div class="fw-bold">{{ product?.precio | number:'1.0-0' }}</div>
          <button class="btn btn-sm btn-primary" (click)="addToCart()" aria-label="Añadir al carrito">
            Añadir
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .card-img-top { height: 180px; object-fit: cover; }
  `]
})
export class ProductCardComponent {
  @Input() product?: Product;
  @Output() add = new EventEmitter<{ varianteId?: number, cantidad: number }>();

  addToCart() {
    const variantId = this.product?.variants?.[0]?.id;
    this.add.emit({ varianteId: variantId, cantidad: 1 });
  }
}
