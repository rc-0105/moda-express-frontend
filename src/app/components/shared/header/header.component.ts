import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService, CartItem } from '../../../services/cart.service';

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom">
      <div class="container">
        <a class="navbar-brand" routerLink="/">ModaExpress</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMain">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navMain">
          <ul class="navbar-nav ms-auto align-items-center">
            <li class="nav-item"><a class="nav-link" routerLink="/client/products">Catálogo</a></li>
            <li class="nav-item position-relative">
              <a class="nav-link" routerLink="/client/cart">Carrito</a>
              <span *ngIf="cartCount > 0" class="badge bg-danger position-absolute top-0 start-100 translate-middle">{{ cartCount }}</span>
            </li>
            <li class="nav-item"><a class="nav-link" routerLink="/client/orders">Mis pedidos</a></li>
          </ul>
        </div>
      </div>
    </nav>
  `
})
export class HeaderComponent implements OnDestroy {
  cartCount = 0;
  private sub = new Subscription();

  constructor(private cartService: CartService) {
    this.sub.add(this.cartService.items$.subscribe((items: CartItem[]) => {
      this.cartCount = items?.reduce((s: number, i: CartItem) => s + (i.cantidad ?? 0), 0) ?? 0;
    }));
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }
}

