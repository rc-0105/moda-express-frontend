import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { CartService, CartItem } from '../../../services/cart.service';
import { OrderService } from '../../../services/order.service';

@Component({
  standalone: true,
  selector: 'app-checkout',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private router = inject(Router);

  checkoutForm = this.fb.group({
    nombre: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    direccion: ['', [Validators.required]],
    ciudad: ['', [Validators.required]],
    telefono: ['', [Validators.required, Validators.pattern('^[0-9+\-\s]{7,15}$')]],
    metodo_pago: ['contrareembolso', [Validators.required]],
    cardNumber: [''],
    cardExpiry: [''],
    cardCvv: ['']
  });

  cartItems: CartItem[] = [];
  loading = false;
  success = false;
  errorMessage: string | null = null;

  private sub = new Subscription();

  ngOnInit(): void {
    this.sub.add(this.cartService.items$.subscribe((items: CartItem[]) => {
      this.cartItems = items;
    }));
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  get subtotal(): number { return this.cartService.getTotal(); }

  get total(): number {
    const shipping = this.subtotal > 0 ? 10000 : 0;
    return this.subtotal + shipping;
  }

  canSubmit(): boolean {
    if (this.cartItems.length === 0) return false;
    if (this.checkoutForm.invalid) return false;
    // if card payment selected, basic card fields required
    const metodo = this.checkoutForm.value.metodo_pago;
    if (metodo === 'tarjeta') {
      return !!this.checkoutForm.value.cardNumber && !!this.checkoutForm.value.cardExpiry && !!this.checkoutForm.value.cardCvv;
    }
    return true;
  }

  onSubmit() {
    this.errorMessage = null;
    if (!this.canSubmit()) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const payload = {
      usuario_id: 1,
      metodo_pago: this.checkoutForm.value.metodo_pago,
      direccion_envio: this.checkoutForm.value.direccion,
      items: this.cartItems.map(i => ({ variant_id: i.variantId, cantidad: i.cantidad }))
    };

    this.loading = true;
    this.sub.add(this.orderService.createOrder(payload).subscribe(resp => {
      this.loading = false;
      if (resp?.status === 'ok' && resp.data?.pedido_id) {
        this.success = true;
        const pedidoId = resp.data.pedido_id;
        // clear cart
        this.cartService.clearCart();
        // navigate to confirmation
        this.router.navigate(['/order-confirmation', pedidoId]);
      } else {
        this.errorMessage = resp?.error?.message || 'Error creando pedido';
      }
    }, err => {
      this.loading = false;
      this.errorMessage = 'Error en la solicitud';
    }));
  }
}
