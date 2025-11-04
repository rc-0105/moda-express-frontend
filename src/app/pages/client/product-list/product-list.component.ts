import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

import { ProductService, ProductQueryParams, PaginatedProductsResponse } from '../../../services/api/product.service';
import { Product } from '../../../models/product.interface';
import { ProductCardComponent } from '../../../components/ui/product-card/product-card';
import { LoadingSpinnerComponent } from '../../../components/ui/loading-spinner/loading-spinner.component';
import { CartService } from '../../../services/cart.service';

@Component({
  standalone: true,
  selector: 'app-product-list-page',
  imports: [CommonModule, FormsModule, RouterModule, ProductCardComponent, LoadingSpinnerComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListPageComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private router = inject(Router);

  products: Product[] = [];
  page = 1;
  size = 20;
  total = 0;
  loading = false;
  error: string | null = null;

  q = '';
  categoria: number | null = null;
  talla: string | null = null;
  color: string | null = null;
  sort: string | null = null;

  sizeOptions = [12, 20, 48];
  categories: Array<{ id: number; name: string }> = [];
  tallas: string[] = [];
  colores: string[] = [];

  private search$ = new Subject<string>();
  private sub = new Subscription();

  ngOnInit(): void {
    // wire search debounce
    this.sub.add(
      this.search$.pipe(debounceTime(300), distinctUntilChanged(), switchMap(q => {
        this.page = 1;
        return this.loadProducts();
      })).subscribe()
    );

    // load categories and initial products
    this.productService.getCategories().subscribe(c => this.categories = c);
    this.loadProducts().subscribe();
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  // central method: returns an observable for callers (used by search pipeline)
  loadProducts() {
    this.error = null;
    this.loading = true;
    const params: ProductQueryParams = { page: this.page, size: this.size, q: this.q || undefined, categoria: this.categoria || undefined, talla: this.talla || undefined, color: this.color || undefined };
    return this.productService.getProducts(params).pipe(switchMap((resp: PaginatedProductsResponse) => {
      this.loading = false;
      if (resp?.status === 'ok' && resp.data) {
        this.products = resp.data.items || [];
        this.page = resp.data.page || this.page;
        this.size = resp.data.size || this.size;
        this.total = resp.data.total || 0;
        this.extractFilters(this.products);
      } else {
        this.error = 'Respuesta inesperada del servicio';
      }
      return [] as any;
    }));
  }

  onSearchInput(v: string) { this.search$.next(v); }

  applyFilters() { this.page = 1; this.loadProducts().subscribe(); }
  clearFilters() { this.q=''; this.categoria=null; this.talla=null; this.color=null; this.page=1; this.loadProducts().subscribe(); }

  changeSize(s: number) { if (s===this.size) return; this.size=s; this.page=1; this.loadProducts().subscribe(); }

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

  goToPage(p:number){ if (p===this.page) return; this.page=p; this.loadProducts().subscribe(); }
  prevPage(){ if (this.page>1){ this.page--; this.loadProducts().subscribe(); } }
  nextPage(){ if (this.page < this.totalPages){ this.page++; this.loadProducts().subscribe(); } }

  extractFilters(items: Product[]) {
    const tallaSet = new Set<string>();
    const colorSet = new Set<string>();
    items.forEach(p => p.variants?.forEach(v => { if (v.talla) tallaSet.add(v.talla); if (v.color) colorSet.add(v.color); }));
    this.tallas = Array.from(tallaSet.values()); this.colores = Array.from(colorSet.values());
  }

  onAddFromCard(event: { varianteId?: number, cantidad: number }) {
    const variantId = event?.varianteId; const cantidad = event?.cantidad ?? 1;
    if (!variantId) { window.alert('Seleccione una variante'); return; }
    this.cartService.addItem(variantId, cantidad);
    window.alert('Añadido al carrito');
  }

  viewDetails(productId: number) { this.router.navigate(['/client/products', productId]); }

  retry() { this.loadProducts().subscribe(); }
}

