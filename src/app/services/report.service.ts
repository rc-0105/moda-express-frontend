import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { FORCE_MOCK } from '../app.config';

export interface SalesMetrics { total_ventas: number; total_pedidos: number; avg_ticket: number; topProducts: any[]; daily: { day: string; total: number }[] }

@Injectable({ providedIn: 'root' })
export class ReportService {
  private cache: { ts: number; data?: SalesMetrics } | null = null;
  private TTL = 1000 * 60 * 30; // 30 minutes

  constructor(private http: HttpClient) {}

  getSalesMetrics(start?: string, end?: string): Observable<SalesMetrics | null> {
    const now = Date.now();
    if (this.cache && (now - this.cache.ts) < this.TTL && this.cache.data) {
      return of(this.cache.data);
    }

    if (FORCE_MOCK) {
      return this.http.get<any>('/assets/mock/reports_sales.json').pipe(
        map((r) => r?.data || null),
        tap(data => { if (data) this.cache = { ts: Date.now(), data }; }),
        catchError(() => of(null))
      );
    }

    const params: any = {};
    if (start) params.start = start;
    if (end) params.end = end;
    return this.http.get<any>('/api/reports/sales', { params }).pipe(
      map(r => r?.data || null),
      tap(data => { if (data) this.cache = { ts: Date.now(), data }; }),
      catchError(() => of(null))
    );
  }

  refreshMetrics(start?: string, end?: string): Observable<SalesMetrics | null> {
    // clear cache and re-fetch
    this.cache = null;
    return this.getSalesMetrics(start, end);
  }
}
