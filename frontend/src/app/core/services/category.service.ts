import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ApiResponse, Category, NewsArticle, Page
} from '../../models/api.models';

@Injectable({ providedIn: 'root' })
export class CategoryService {

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<ApiResponse<Category[]>>('/api/public/categories')
      .pipe(map(r => r.data));
  }

  getCategoryArticles(slug: string, page = 0, size = 20): Observable<Page<NewsArticle>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<Page<NewsArticle>>>(`/api/public/categories/${slug}`, { params })
      .pipe(map(r => r.data));
  }

  // Admin category operations
  adminGetAll(): Observable<Category[]> {
    return this.http.get<ApiResponse<Category[]>>('/api/admin/categories')
      .pipe(map(r => r.data));
  }

  adminCreate(data: Partial<Category> & { parentId?: number | null }): Observable<Category> {
    return this.http.post<ApiResponse<Category>>('/api/admin/categories', data)
      .pipe(map(r => r.data));
  }

  adminUpdate(id: number, data: Partial<Category> & { parentId?: number | null }): Observable<Category> {
    return this.http.put<ApiResponse<Category>>(`/api/admin/categories/${id}`, data)
      .pipe(map(r => r.data));
  }

  adminToggle(id: number): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`/api/admin/categories/${id}/toggle`, {})
      .pipe(map(() => void 0));
  }
}
