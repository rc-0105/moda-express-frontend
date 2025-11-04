import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { FORCE_MOCK } from '../app.config';

export interface LogEntry { id: string; timestamp: string; service: string; level: string; message: string }

@Injectable({ providedIn: 'root' })
export class LogService {
  constructor(private http: HttpClient) {}

  getRecentLogs(level = 'ERROR', limit = 5): Observable<LogEntry[] | null> {
    if (FORCE_MOCK) {
      return this.http.get<any>('/assets/mock/logs.json').pipe(
        map(r => (r?.data || []).filter((l: LogEntry) => l.level === level).slice(0, limit)),
        catchError(() => of(null))
      );
    }

    return this.http.get<any>(`/api/logs`, { params: { level, limit: String(limit) } }).pipe(
      map(r => r?.data || null),
      catchError(() => of(null))
    );
  }

  // General logs fetch with pagination and filters
  getLogs(params: { level?: string; page?: number; size?: number; start?: string; end?: string; q?: string } = {}): Observable<{ status: string; data: { items: any[]; total: number } } | null> {
    const page = params.page || 1;
    const size = params.size || 10;

    if (FORCE_MOCK) {
      return this.http.get<any[]>('/assets/mock/logs_backend_mock.json').pipe(
        map(list => {
          let items = (list || []).slice();
          if (params.level) items = items.filter(i => (i.level || '').toUpperCase() === (params.level || '').toUpperCase());
          if (params.q) items = items.filter(i => JSON.stringify(i).toLowerCase().includes((params.q || '').toLowerCase()));
          if (params.start) items = items.filter(i => new Date(i.timestamp) >= new Date(params.start!));
          if (params.end) items = items.filter(i => new Date(i.timestamp) <= new Date(params.end!));
          const total = items.length;
          const startIdx = (page - 1) * size;
          const pageItems = items.slice(startIdx, startIdx + size);
          return { status: 'ok', data: { items: pageItems, total } };
        }),
        catchError(() => of(null))
      );
    }

    const httpParams: any = {};
    if (params.level) httpParams.level = params.level;
    if (params.start) httpParams.start = params.start;
    if (params.end) httpParams.end = params.end;
    if (params.q) httpParams.q = params.q;
    httpParams.page = String(page);
    httpParams.size = String(size);

    return this.http.get<any>('/api/logs', { params: httpParams }).pipe(
      map(r => ({ status: r?.status || 'ok', data: { items: r?.data || [], total: (r?.total || r?.data?.length || 0) } })),
      catchError(() => of(null))
    );
  }
}
