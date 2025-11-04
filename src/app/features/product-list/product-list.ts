// src/app/features/product-list/product-list.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { ProductService, ProductQueryParams, PaginatedProductsResponse } from '../../services/api/product.service';
import { Product } from '../../models/product.interface';
import { LoadingSpinnerComponent } from '../../components/ui/loading-spinner/loading-spinner.component';
import { ProductCardComponent } from '../../components/ui/product-card/product-card';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule, LoadingSpinnerComponent, ProductCardComponent],
  templateUrl: './product-list.html',
  styles: [`
:focus { outline: 3px solid rgba(0,123,255,0.25); outline-offset: 2px; }
.card-img-top { height: 180px; object-fit: cover; }
.pagination .page-link { min-width: 44px; }
`]
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);

  products: Product[] = [];
  page = 1;
  size = 20;
  total = 0;
  loading = false;
  error: string | null = null;

  q = '';
  categoria: string | null = null;
  talla: string | null = null;
  color: string | null = null;

  sizeOptions = [12, 20, 48];

  categories: Array<{ id: number, name: string }> = [];
  tallas: string[] = [];
  colores: string[] = [];

  ngOnInit(): void { this.loadProducts(); }

  private buildParams(): ProductQueryParams {
    return { page: this.page, size: this.size, q: this.q || undefined, categoria: this.categoria || undefined, talla: this.talla || undefined, color: this.color || undefined };
  }

  loadProducts(): void {
    this.error = null;
    this.loading = true;
    const params = this.buildParams();
    this.productService.getProducts(params).subscribe({
      next: (resp: PaginatedProductsResponse) => {
        this.loading = false;
        if (resp?.status === 'ok' && resp.data) {
          this.products = resp.data.items || [];
          this.page = resp.data.page || this.page;
          this.size = resp.data.size || this.size;
          this.total = resp.data.total || 0;
          this.extractFilters(this.products);
        } else {
          this.error = 'Respuesta inesperada del servicio';
          // attempt local fallback to avoid blank UI
          this.fetchLocalMockFallback();
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.message ? `Error: ${err.message}` : 'Error al cargar productos';
        // Try to recover by loading the local mock file directly (bypass ProductService)
        this.fetchLocalMockFallback();
      }
    });
  }

  // Try to fetch the local mock JSON directly with fetch; if that fails, provide a tiny embedded sample
  private async fetchLocalMockFallback() {
    try {
      const res = await fetch('/assets/mock/products.json');
      if (res.ok) {
        const raw = await res.json();
        const items = raw?.data?.items ?? [];
        if (Array.isArray(items) && items.length > 0) {
          this.products = items;
          this.total = items.length;
          this.extractFilters(items);
          this.error = null; // clear previous error
          return;
        }
      }
    } catch (e) {
      // ignore and fall through to embedded sample
    }

    // Embedded small sample to ensure UI is visible during dev
    this.products = [
      { id: 1, nombre: 'Camiseta Blanca Classic', precio: 45000, descripcion: 'Camiseta 100% algodón', imagen_url: 'assets/uploads/camiseta-blanca.jpg', variants: [] },
      { id: 2, nombre: 'Hoodie Negra Urban', precio: 85000, descripcion: 'Buzo con capota', imagen_url: 'assets/uploads/hoodie-negra.jpg', variants: [] },
      { id: 3, nombre: 'Jeans Slim Fit Azul', precio: 120000, descripcion: 'Jeans corte slim', imagen_url: 'assets/uploads/jeans-azul.jpg', variants: [] }
    ];
    this.total = this.products.length;
    this.extractFilters(this.products);
    // keep the error visible but UI will show the embedded sample
  }

  private extractFilters(items: Product[]) {
    const catMap = new Map<number, string>();
    const tallaSet = new Set<string>();
    const colorSet = new Set<string>();
    items.forEach(p => {
      if (p.categoriaId) catMap.set(p.categoriaId, `Categoría ${p.categoriaId}`);
      p.variants?.forEach(v => { if (v.talla) tallaSet.add(v.talla); if (v.color) colorSet.add(v.color); });
    });
    this.categories = Array.from(catMap.entries()).map(([id, name]) => ({ id, name }));
    this.tallas = Array.from(tallaSet.values());
    this.colores = Array.from(colorSet.values());
  }

  onFilterApply(): void { this.page = 1; this.loadProducts(); }
  clearFilters(): void { this.q=''; this.categoria=null; this.talla=null; this.color=null; this.page=1; this.loadProducts(); }
  changeSize(s: number) { if (s===this.size) return; this.size=s; this.page=1; this.loadProducts(); }

  get totalPages(): number { return Math.max(1, Math.ceil(this.total / this.size)); }

  pagesArray(): number[] {
    const total = this.totalPages; const arr: number[] = [];
    const maxShow = 7;
    if (total <= maxShow) { for (let i=1;i<=total;i++) arr.push(i); return arr; }
    let start = Math.max(1, this.page - 2), end = Math.min(total, this.page + 2);
    if (this.page <= 2) { start = 1; end = 5; } else if (this.page >= total - 1) { start = total - 4; end = total; }
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }

  goToPage(p:number){ if (p===this.page) return; this.page=p; this.loadProducts(); }
  prevPage(){ if (this.page>1){ this.page--; this.loadProducts(); } }
  nextPage(){ if (this.page < this.totalPages){ this.page++; this.loadProducts(); } }
  retry(){ this.loadProducts(); }

  onAddFromCard(event: { varianteId?: number, cantidad: number }) {
  // event.cantidad y event.varianteId vienen del ProductCardComponent (stub)
  const variantId = event?.varianteId;
  const cantidad = event?.cantidad ?? 1;

  // Si tenemos variantId, intentar validar stock a partir de this.products
  if (variantId) {
    let foundVariantStock: number | null = null;
    for (const prod of this.products) {
      const v = prod.variants?.find(x => x.id === variantId);
    if (v) { foundVariantStock = v.stock ?? null; break; }
    }
    if (foundVariantStock !== null) {
      if (cantidad > foundVariantStock) {
        // Feedback simple: alert (puedes reemplazar por Toast/Modal)
        window.alert(`No hay suficiente stock. Disponible: ${foundVariantStock}`);
        return;
      }
    }
  }

  // Por ahora: log de la intención. Aquí integrar CartService.addItemToCart(userId, ...)
  console.log('[ProductList] add requested', { variantId, cantidad });
  }
}
