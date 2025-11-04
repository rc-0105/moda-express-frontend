import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ProductService, ProductQueryParams, PaginatedProductsResponse } from '../../../services/api/product.service';
import { Product } from '../../../models/product.interface';
import { ProductCardComponent } from '../../../components/ui/product-card/product-card';
import { LoadingSpinnerComponent } from '../../../components/ui/loading-spinner/loading-spinner.component';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, RouterModule, FormsModule, ProductCardComponent, LoadingSpinnerComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  featured: Product[] = [];
  topSellers: Product[] = [];
  newest: Product[] = [];

  loadingFeatured = false;
  loadingTop = false;
  loadingNewest = false;

  error: string | null = null;

  categories = [
    { id: 2, name: 'Camisetas', icon: '🧥' },
    { id: 3, name: 'Buzos', icon: '🧢' },
    { id: 4, name: 'Jeans', icon: '👖' },
    { id: 9, name: 'Accesorios', icon: '🧣' }
  ];

  testimonials = [
    { id: 1, author: 'María R.', text: 'Excelente calidad y envío rápido.', rating: 5 },
    { id: 2, author: 'Carlos P.', text: 'Buena atención al cliente y productos como en la foto.', rating: 4 }
  ];

  constructor(private router: Router, private productService: ProductService) {}

  ngOnInit(): void {
    this.loadFeatured();
    this.loadTopSellers();
    this.loadNewest();
  }

  openCatalog(categoriaId?: number) {
    const query: any = {};
    if (categoriaId) query.categoria = categoriaId;
    this.router.navigate(['/client/products'], { queryParams: query });
  }

  private loadFeatured() {
    this.loadingFeatured = true;
    this.productService.getProducts({ page: 1, size: 8, q: undefined, categoria: undefined } as ProductQueryParams).subscribe({
      next: (resp: PaginatedProductsResponse) => {
        this.loadingFeatured = false;
        if (resp?.status === 'ok' && resp.data) {
          this.featured = resp.data.items || [];
        } else {
          this.error = 'No se pudieron cargar productos destacados.';
        }
      },
      error: (err) => {
        this.loadingFeatured = false;
        this.error = err?.message ? `Error: ${err.message}` : 'Error al cargar productos destacados';
      }
    });
  }

  private loadTopSellers() {
    this.loadingTop = true;
    // ProductService supports sort params via mock fallback; pass as q param hint
    this.productService.getProducts({ page: 1, size: 6, q: undefined } as ProductQueryParams).subscribe({
      next: (resp) => {
        this.loadingTop = false;
        if (resp?.status === 'ok' && resp.data) {
          this.topSellers = (resp.data.items || []).slice(0,6);
        }
      },
      error: () => { this.loadingTop = false; }
    });
  }

  private loadNewest() {
    this.loadingNewest = true;
    this.productService.getProducts({ page: 1, size: 6 } as ProductQueryParams).subscribe({
      next: (resp) => {
        this.loadingNewest = false;
        if (resp?.status === 'ok' && resp.data) {
          this.newest = (resp.data.items || []).slice(0,6);
        }
      },
      error: () => { this.loadingNewest = false; }
    });
  }

  subscribeEmail(emailInput: HTMLInputElement) {
    const email = emailInput.value?.trim();
    if (!email) {
      emailInput.focus();
      return;
    }
    // UI-only: show a simple alert, no backend integration
    window.alert(`Gracias por suscribirte: ${email}`);
    emailInput.value = '';
  }
}
