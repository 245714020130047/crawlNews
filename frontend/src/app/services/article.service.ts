import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';
import { Article, PageResponse } from '../models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ArticleService {
  private readonly apiUrl = `${environment.apiUrl}/articles`;

  constructor(private http: HttpClient) {}

  getLatest(page = 0, size = 10): Observable<PageResponse<Article>> {
    return this.http.get<PageResponse<Article>>(this.apiUrl, {
      params: new HttpParams().set('page', page).set('size', size)
    });
  }

  getByCategory(slug: string, page = 0, size = 10): Observable<PageResponse<Article>> {
    return this.http.get<PageResponse<Article>>(`${this.apiUrl}/category/${slug}`, {
      params: new HttpParams().set('page', page).set('size', size)
    });
  }

  getTrending(page = 0, size = 5): Observable<PageResponse<Article>> {
    return this.http.get<PageResponse<Article>>(`${this.apiUrl}/trending`, {
      params: new HttpParams().set('page', page).set('size', size)
    });
  }

  search(q: string, page = 0, size = 10): Observable<PageResponse<Article>> {
    return this.http.get<PageResponse<Article>>(`${this.apiUrl}/search`, {
      params: new HttpParams().set('q', q).set('page', page).set('size', size)
    });
  }

  getBySlug(slug: string): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/${slug}`);
  }

  summarize(id: number): Observable<Article> {
    return this.http.post<Article>(`${this.apiUrl}/${id}/summarize`, {});
  }

  getImageUrl(url: string): string {
    if (!url) return 'assets/placeholder.jpg';
    return `${environment.apiUrl}/proxy/image?url=${encodeURIComponent(url)}`;
  }
}
