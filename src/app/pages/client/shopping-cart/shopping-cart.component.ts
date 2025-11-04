import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { CartService, CartItem } from '../../../services/cart.service';

@Component({
  standalone: true,
  selector: 'app-shopping-cart',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.css']
})
export class ShoppingCartComponent implements OnInit, OnDestroy {
  public cartService = inject(CartService);
  private router = inject(Router);

  items: CartItem[] = [];
  loading = false;
  error: string | null = null;

  private sub = new Subscription();

  // fixed shipping example
  shippingCost = 10000;

  ngOnInit(): void {
    this.sub.add(this.cartService.items$.subscribe((items: CartItem[]) => {
      this.items = items;
    }));
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  increment(item: CartItem) {
    const max = (item.stock ?? 1);
    if (item.cantidad < max) {
      this.cartService.updateQty(item.variantId, item.cantidad + 1);
    }
  }

  decrement(item: CartItem) {
    if (item.cantidad > 1) {
      this.cartService.updateQty(item.variantId, item.cantidad - 1);
    }
  }

  onQtyChange(item: CartItem, value: number) {
    const qty = Math.max(1, Math.min(item.stock ?? 1, Math.floor(Number(value) || 1)));
    this.cartService.updateQty(item.variantId, qty);
  }

  remove(item: CartItem) {
    if (confirm('¿Eliminar este ítem del carrito?')) {
      this.cartService.removeItem(item.variantId);
    }
  }

  clearCart() {
    if (confirm('¿Vaciar el carrito?')) {
      this.cartService.clearCart();
    }
  }

  getSubtotal(item: CartItem) { return ((item as any).precio ?? 0) * (item.cantidad ?? 0); }

  getTotal() {
    const subtotal = this.cartService.getTotal();
    const shipping = subtotal > 0 ? this.shippingCost : 0;
    return subtotal + shipping;
  }

  continueShopping() { this.router.navigate(['/client/products']); }

  checkout() { this.router.navigate(['/checkout']); }
}
