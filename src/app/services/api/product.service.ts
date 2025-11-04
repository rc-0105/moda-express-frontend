import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, retry, switchMap } from 'rxjs/operators';
import { Product } from '../../models/product.interface';
import { FORCE_MOCK } from '../../app.config';

export interface ProductQueryParams {
  page?: number;
  size?: number;
  q?: string;
  categoria?: string | number;
  talla?: string;
  color?: string;
}

export interface PaginatedData<T> { items: T[]; page: number; size: number; total: number; }
export interface PaginatedProductsResponse { status: 'ok'|'error'; data?: PaginatedData<Product>; message?: string; }

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly API_URL = '/api/products';
  private readonly MOCK_URL = 'assets/mock/products.json';

  constructor(private http: HttpClient) {}

  // High-level method used by UI to fetch paginated products (from API or mock fallback)
  getProducts(params: ProductQueryParams = {}): Observable<PaginatedProductsResponse> {
    const page = params.page ?? 1;
    const size = params.size ?? 20;

    if (FORCE_MOCK) {
      return this.loadMock(params);
    }

    let httpParams = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    if (params.q) httpParams = httpParams.set('q', String(params.q));
    if (params.categoria) httpParams = httpParams.set('categoria', String(params.categoria));
    if (params.talla) httpParams = httpParams.set('talla', String(params.talla));
    if (params.color) httpParams = httpParams.set('color', String(params.color));

    return this.http.get<PaginatedProductsResponse>(this.API_URL, { params: httpParams }).pipe(
      retry(1),
      switchMap(resp => {
        if (resp && resp.status === 'ok' && resp.data) {
          return of(resp);
        }
        // backend returned unexpected shape -> fallback mock
        console.warn('[ProductService] Backend returned unexpected response, falling back to mock.');
        return this.loadMock(params);
      }),
      catchError(err => {
        console.warn('[ProductService] Backend failed, falling back to mock.', err);
        return this.loadMock(params);
      })
    );
  }

  // Convenience methods for components that need lists or single item
  getAll(): Observable<Product[]> {
    return this.getProducts({ page: 1, size: 1000 }).pipe(map(r => r.data?.items ?? []));
  }

  getById(id: number): Observable<Product | undefined> {
    return this.getAll().pipe(map(items => items.find(p => p.id === id)));
  }

  // Try to fetch a single product by id from backend; fallback to mock if API fails
  getProductById(id: number): Observable<Product | undefined> {
    if (FORCE_MOCK) {
      return this.getById(id);
    }
    return this.http.get<any>(`${this.API_URL}/${id}`).pipe(
      map(resp => resp?.data as Product),
      catchError(() => this.getById(id))
    );
  }

  // Optional: get recommendations; backend may provide this endpoint
  getRecommendations(productId: number): Observable<Product[]> {
    if (FORCE_MOCK) {
      // simple mock: return first 4 products excluding current
      return this.getAll().pipe(map(items => items.filter(p => p.id !== productId).slice(0, 4)));
    }

    return this.http.get<any>(`${this.API_URL}/${productId}/recommendations`).pipe(
      map(resp => resp?.data?.items ?? []),
      catchError(() => this.getAll().pipe(map(items => items.filter(p => p.id !== productId).slice(0, 4))))
    );
  }

  // Derive categories from mock data or backend response; returns id/name pairs
  getCategories(): Observable<Array<{ id: number; name: string }>> {
    // Try to use cached full list
    return this.getAll().pipe(map(items => {
      const map = new Map<number, string>();
      items.forEach(p => {
        if (p.categoriaId && !map.has(p.categoriaId)) {
          map.set(p.categoriaId, `Categoría ${p.categoriaId}`);
        }
      });
      return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }));
  }

  private loadMock(params: ProductQueryParams): Observable<PaginatedProductsResponse> {
    const page = params.page ?? 1;
    const size = params.size ?? 20;

    return this.http.get<any>(this.MOCK_URL).pipe(
      map(raw => {
        const allItems: Product[] = raw?.data?.items ?? [];

        let filtered = allItems.slice();
        if (params.q) {
          const q = String(params.q).toLowerCase();
          filtered = filtered.filter(p =>
            (p.nombre || '').toLowerCase().includes(q) ||
            (p.descripcion || '').toLowerCase().includes(q)
          );
        }
        if (params.categoria) {
          filtered = filtered.filter(p => String(p.categoriaId) === String(params.categoria));
        }
        if (params.talla) {
          filtered = filtered.filter(p => p.variants?.some(v => v.talla === params.talla));
        }
        if (params.color) {
          filtered = filtered.filter(p => p.variants?.some(v => v.color === params.color));
        }

        const total = filtered.length;
        const start = (page - 1) * size;
        const paged = filtered.slice(start, start + size);

        return { status: 'ok', data: { items: paged, page, size, total } } as PaginatedProductsResponse;
      }),
      catchError(err => {
        return throwError(() => new Error('No se pudo cargar el mock local (assets/mock/products.json)'));
      })
    );
  }
}
