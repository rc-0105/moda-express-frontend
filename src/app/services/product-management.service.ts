import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { FORCE_MOCK } from '../app.config';

export interface Variant { id?: number; talla: string; color: string; stock: number; sku: string }
export interface ProductMgmt { id?: number; nombre: string; descripcion?: string; precio: number; categoria?: string; variantes?: Variant[] }

const STORAGE_KEY = 'moda_mock_products_v1';

@Injectable({ providedIn: 'root' })
export class ProductManagementService {
  private readonly MOCK_URL = '/assets/mock/products.json';

  constructor(private http: HttpClient) {}

  private initMockOnce() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // load initial from assets
        this.http.get<any>(this.MOCK_URL).pipe(
          map(r => r?.data?.items || []),
          catchError(() => of([]))
        ).subscribe(items => {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        });
      }
    } catch (e) {
      // ignore
    }
  }

  private readStore(): ProductMgmt[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private writeStore(items: ProductMgmt[]) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }

  getProducts(q?: string, page = 1, size = 10): Observable<{ items: ProductMgmt[]; total: number; page: number; size: number }> {
    if (!FORCE_MOCK) {
      // call backend
      const params: any = { page: String(page), size: String(size) };
      if (q) params.q = q;
      return this.http.get<any>('/api/products', { params }).pipe(
        map(r => ({ items: r?.data?.items || [], total: r?.data?.total || 0, page, size })),
        catchError(() => of({ items: [], total: 0, page, size }))
      );
    }

    // mock backed by localStorage
    this.initMockOnce();
    const all = this.readStore();
    let filtered = all.slice();
    if (q) {
      const qq = q.toLowerCase();
      filtered = filtered.filter(p => (p.nombre || '').toLowerCase().includes(qq) || (p.categoria || '').toLowerCase().includes(qq));
    }
    const total = filtered.length;
    const start = (page - 1) * size;
    const paged = filtered.slice(start, start + size);
    return of({ items: paged, total, page, size });
  }

  getProductById(id: number): Observable<ProductMgmt | undefined> {
    if (!FORCE_MOCK) {
      return this.http.get<any>(`/api/products/${id}`).pipe(map(r => r?.data));
    }
    this.initMockOnce();
    const found = this.readStore().find(p => p.id === id);
    return of(found);
  }

  createProduct(payload: ProductMgmt): Observable<ProductMgmt> {
    if (!FORCE_MOCK) {
      return this.http.post<any>('/api/products', payload).pipe(map(r => r?.data));
    }
    this.initMockOnce();
    const items = this.readStore();
    const id = (items.reduce((m, x) => Math.max(m, x.id || 0), 0) || 0) + 1;
    const created = { ...payload, id };
    items.unshift(created);
    this.writeStore(items);
    return of(created);
  }

  updateProduct(id: number, payload: ProductMgmt): Observable<ProductMgmt | null> {
    if (!FORCE_MOCK) {
      return this.http.put<any>(`/api/products/${id}`, payload).pipe(map(r => r?.data));
    }
    this.initMockOnce();
    const items = this.readStore();
    const idx = items.findIndex(p => p.id === id);
    if (idx === -1) return of(null);
    const updated = { ...items[idx], ...payload, id };
    items[idx] = updated;
    this.writeStore(items);
    return of(updated);
  }

  deleteProduct(id: number): Observable<boolean> {
    if (!FORCE_MOCK) {
      return this.http.delete<any>(`/api/products/${id}`).pipe(map(() => true), catchError(() => of(false)));
    }
    this.initMockOnce();
    let items = this.readStore();
    const idx = items.findIndex(p => p.id === id);
    if (idx === -1) return of(false);
    items.splice(idx, 1);
    this.writeStore(items);
    return of(true);
  }
}
