import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FORCE_MOCK } from '../app.config';

export interface ApiResponse<T> { status: string; data?: T; error?: any }

export interface OrderItem { producto?: string; nombre?: string; variante?: string; cantidad: number; precio_unitario?: number; subtotal?: number; imagen_url?: string }
export interface Order { id: number; usuario_id: number; fecha: string; subtotal?: number; iva?: number; envio?: number; total: number; estado: string; puntos_ganados?: number; direccion?: any; pago?: any; envio_info?: any; items?: OrderItem[] }

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly API_URL = '/api/orders';

  constructor(private http: HttpClient) {}

  createOrder(payload: any): Observable<ApiResponse<any>> {
    if (FORCE_MOCK) {
      // simulate success
      return of({ status: 'ok', data: { pedido_id: Math.floor(Math.random() * 900) + 100, estado: 'CONFIRMADO' } });
    }

    return this.http.post<ApiResponse<any>>(this.API_URL, payload).pipe(
      catchError(err => of({ status: 'error', error: err }))
    );
  }

  // Returns all orders for a user (mock: reads assets/mock/orders.json)
  getOrdersByUser(userId: number, page = 1, size = 10): Observable<ApiResponse<{ items: Order[]; total: number }>> {
    if (FORCE_MOCK) {
      return this.http.get<Order[]>('/assets/mock/orders.json').pipe(
        map(list => {
          const items = (list || []).filter(o => o.usuario_id === userId);
          return { status: 'ok', data: { items, total: items.length } } as ApiResponse<{ items: Order[]; total: number }>;
        }),
        catchError(err => of({ status: 'error', error: err }))
      );
    }

    // In real backend, the API could accept pagination params
    const params = { page: String(page), size: String(size) };
    return this.http.get<ApiResponse<{ items: Order[]; total: number }>>(`${this.API_URL}/user/${userId}`, { params }).pipe(
      catchError(err => of({ status: 'error', error: err }))
    );
  }

  // Return recent orders for admin dashboard
  getRecentOrders(limit = 10): Observable<ApiResponse<{ items: any[] }>> {
    if (FORCE_MOCK) {
      return this.http.get<any>('/assets/mock/orders.json').pipe(
        map(r => ({ status: 'ok', data: { items: (r?.data?.items || []).slice(0, limit) } } as ApiResponse<{ items: any[] }>)),
        catchError(() => of({ status: 'error', error: 'error' } as ApiResponse<{ items: any[] }>))
      );
    }

    return this.http.get<ApiResponse<{ items: any[] }>>(`${this.API_URL}`, { params: { recent: 'true', limit: String(limit) } }).pipe(
      catchError(err => of({ status: 'error', error: err } as ApiResponse<{ items: any[] }>))
    );
  }

  // Admin: get orders with optional filters (mock supports estado and q and pagination)
  getOrders(params: { page?: number; size?: number; estado?: string; q?: string } = {}): Observable<ApiResponse<{ items: any[]; total: number }>> {
    const page = params.page ?? 1;
    const size = params.size ?? 10;
    if (FORCE_MOCK) {
      return this.http.get<any>('/assets/mock/orders.json').pipe(
        map(r => {
          const list = r?.data || [];
          let filtered = list.slice();
          if (params.estado) filtered = filtered.filter((o: any) => String(o.estado).toUpperCase() === String(params.estado).toUpperCase());
          if (params.q) {
            const q = String(params.q).toLowerCase();
            filtered = filtered.filter((o: any) => String(o.id).includes(q) || (o.usuario_nombre || '').toLowerCase().includes(q));
          }
          const total = filtered.length;
          const start = (page - 1) * size;
          const items = filtered.slice(start, start + size);
          return { status: 'ok', data: { items, total } } as ApiResponse<{ items: any[]; total: number }>;
        }),
        catchError(err => of({ status: 'error', error: err }))
      );
    }

    const httpParams: any = { page: String(page), size: String(size) };
    if (params.estado) httpParams.estado = params.estado;
    if (params.q) httpParams.q = params.q;
    return this.http.get<ApiResponse<{ items: any[]; total: number }>>('/api/orders', { params: httpParams }).pipe(
      catchError(err => of({ status: 'error', error: err }))
    );
  }

  // Update order status (PATCH). In mock mode returns success without persisting.
  updateOrderStatus(orderId: number, newStatus: string): Observable<ApiResponse<any>> {
    if (FORCE_MOCK) {
      return of({ status: 'ok', data: { id: orderId, estado: newStatus } });
    }
    return this.http.patch<ApiResponse<any>>(`${this.API_URL}/${orderId}/status`, { estado: newStatus }).pipe(
      catchError(err => of({ status: 'error', error: err }))
    );
  }

  getOrderDetail(orderId: number): Observable<ApiResponse<Order>> {
    if (FORCE_MOCK) {
      return this.http.get<Order[]>('/assets/mock/order_details.json').pipe(
        map(list => {
          const found = (list || []).find(o => o.id === orderId);
          if (found) return { status: 'ok', data: found } as ApiResponse<Order>;
          return { status: 'error', error: 'Not found' } as ApiResponse<Order>;
        }),
        catchError(err => of({ status: 'error', error: err }))
      );
    }

    return this.http.get<ApiResponse<Order>>(`${this.API_URL}/${orderId}`).pipe(
      catchError(err => of({ status: 'error', error: err }))
    );
  }
}
