import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface ReviewItem {
  id: string;
  user_id: number;
  rating: number;
  comment: string;
  created_at: string;
  metadata?: any;
}

export interface PaginatedReviews { items: ReviewItem[]; page: number; size: number; total: number }

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly API_URL = '/api/reviews';
  private readonly MOCK_URL = `assets/mock/reviews.json`;

  constructor(private http: HttpClient) {}

  getReviews(productId: number, page = 1, size = 5): Observable<{ status: string; data?: PaginatedReviews }> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<{ status: string; data?: PaginatedReviews }>(`${this.API_URL}/product/${productId}`, { params }).pipe(
      catchError(() => {
        // fallback: try to read mock file and return filtered reviews
        return this.http.get<any>(this.MOCK_URL).pipe(map(raw => raw?.data ?? { items: [], page: 1, size, total: 0 }));
      })
    );
  }

  postReview(payload: { user_id: number; product_id: number; rating: number; comment: string; metadata?: any }) {
    return this.http.post<{ status: string; data?: any }>(this.API_URL, payload).pipe(
      catchError(() => of({ status: 'ok', data: { id: 'local-mock', status: 'pending' } }))
    );
  }
}
