import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  variantId: number;
  productId?: number;
  nombre?: string;
  imagen_url?: string;
  talla?: string;
  color?: string;
  precio: number;
  cantidad: number;
  stock?: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private storageKey = 'moda_cart';
  private _items$ = new BehaviorSubject<CartItem[]>(this.load());

  get items$() { return this._items$.asObservable(); }

  private load(): CartItem[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const parsed: any[] = raw ? JSON.parse(raw) : [];
      // Ensure required numeric fields have defaults so templates/types are safe
      return parsed.map(p => ({
        variantId: p.variantId,
        productId: p.productId,
        nombre: p.nombre,
        imagen_url: p.imagen_url,
        talla: p.talla,
        color: p.color,
        precio: (p.precio ?? 0),
        cantidad: (p.cantidad ?? 1),
        stock: p.stock
      } as CartItem));
    } catch {
      return [];
    }
  }

  private save(items: CartItem[]) {
    try { localStorage.setItem(this.storageKey, JSON.stringify(items)); } catch {}
    this._items$.next(items);
  }

  getCart(): CartItem[] { return this._items$.getValue(); }

  addItem(variantId: number, cantidad = 1, productId?: number, meta?: Partial<CartItem>) {
    const items = this.getCart();
    const idx = items.findIndex(i => i.variantId === variantId);
    if (idx >= 0) {
      items[idx].cantidad += cantidad;
    } else {
      const item: CartItem = {
        variantId,
        productId,
        cantidad,
        nombre: meta?.nombre,
        imagen_url: meta?.imagen_url,
        talla: meta?.talla,
        color: meta?.color,
        precio: meta?.precio ?? 0,
        stock: meta?.stock
      };
      items.push(item);
    }
    this.save(items);
  }

  updateItem(variantId: number, cantidad: number) {
    const items = this.getCart();
    const idx = items.findIndex(i => i.variantId === variantId);
    if (idx >= 0) {
      items[idx].cantidad = cantidad;
      if (items[idx].cantidad <= 0) items.splice(idx, 1);
      this.save(items);
    }
  }

  clear() { this.save([]); }

  // New convenience methods expected by UI
  removeItem(variantId: number) {
    const items = this.getCart();
    const idx = items.findIndex(i => i.variantId === variantId);
    if (idx >= 0) {
      items.splice(idx, 1);
      this.save(items);
    }
  }

  clearCart() { this.clear(); }

  updateQty(variantId: number, cantidad: number) { this.updateItem(variantId, cantidad); }

  getTotal(): number {
    const items = this.getCart();
    return items.reduce((sum, it) => sum + ((it as any).precio ?? 0) * (it.cantidad ?? 0), 0);
  }
}
