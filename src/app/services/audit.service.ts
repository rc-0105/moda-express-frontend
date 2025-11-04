import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FORCE_MOCK } from '../app.config';

export interface AuditEntry { id?: number; pedido_id: number; old_status: string; new_status: string; changed_by: string; changed_at: string }

@Injectable({ providedIn: 'root' })
export class AuditService {
  constructor(private http: HttpClient) {}

  getAuditForOrder(orderId: number): Observable<AuditEntry[] | null> {
    if (FORCE_MOCK) {
      return this.http.get<AuditEntry[]>('/assets/mock/audit_orders.json').pipe(
        map(list => (list || []).filter(a => a.pedido_id === orderId).sort((a,b) => +new Date(b.changed_at) - +new Date(a.changed_at))),
        catchError(() => of(null))
      );
    }

    return this.http.get<AuditEntry[]>('/api/audit/orders', { params: { orderId: String(orderId) } }).pipe(
      map(list => (list || []).sort((a,b) => +new Date(b.changed_at) - +new Date(a.changed_at))),
      catchError(() => of(null))
    );
  }

  // Paginated / filtered fetch for audit entries
  getAuditOrders(params: { page?: number; size?: number; start?: string; end?: string; orderId?: number; q?: string } = {}): Observable<{ status: string; data: { items: AuditEntry[]; total: number } } | null> {
    const page = params.page || 1;
    const size = params.size || 10;

    if (FORCE_MOCK) {
      return this.http.get<AuditEntry[]>('/assets/mock/audit_pedido_mock.json').pipe(
        map(list => {
          let items = (list || []).slice();
          // filters
          if (params.orderId) items = items.filter(i => i.pedido_id === params.orderId);
          if (params.q) items = items.filter(i => JSON.stringify(i).toLowerCase().includes((params.q || '').toLowerCase()));
          if (params.start) items = items.filter(i => new Date(i.changed_at) >= new Date(params.start!));
          if (params.end) items = items.filter(i => new Date(i.changed_at) <= new Date(params.end!));
          const total = items.length;
          const startIdx = (page - 1) * size;
          const pageItems = items.slice(startIdx, startIdx + size);
          return { status: 'ok', data: { items: pageItems, total } };
        }),
        catchError(() => of(null))
      );
    }

    // Real API call
    const httpParams: any = {};
    if (params.start) httpParams.start = params.start;
    if (params.end) httpParams.end = params.end;
    if (params.orderId) httpParams.orderId = String(params.orderId);
    if (params.q) httpParams.q = params.q;
    httpParams.page = String(page);
    httpParams.size = String(size);

    return this.http.get<any>('/api/audit/orders', { params: httpParams }).pipe(
      map(r => ({ status: r?.status || 'ok', data: { items: r?.data || [], total: (r?.total || r?.data?.length || 0) } })),
      catchError(() => of(null))
    );
  }
}
