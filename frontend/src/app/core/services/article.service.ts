import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ApiResponse, Page, NewsArticle, HomePayload, NewsSummary, SummaryJob
} from '../../models/api.models';

@Injectable({ providedIn: 'root' })
export class ArticleService {

  constructor(private http: HttpClient) {}

  getHome(): Observable<HomePayload> {
    return this.http.get<ApiResponse<HomePayload>>('/api/public/home')
      .pipe(map(r => r.data));
  }

  getArticles(params: {
    page?: number;
    size?: number;
    sourceId?: number;
    categoryId?: number;
    q?: string;
  } = {}): Observable<Page<NewsArticle>> {
    let httpParams = new HttpParams();
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page);
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size);
    if (params.sourceId) httpParams = httpParams.set('sourceId', params.sourceId);
    if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId);
    if (params.q) httpParams = httpParams.set('q', params.q);

    return this.http.get<ApiResponse<Page<NewsArticle>>>('/api/public/articles', { params: httpParams })
      .pipe(map(r => r.data));
  }

  getArticleById(id: string | number): Observable<NewsArticle> {
    return this.http.get<ApiResponse<NewsArticle>>(`/api/public/articles/${id}`)
      .pipe(map(r => r.data));
  }

  getArticleSummary(id: string | number): Observable<NewsSummary | null> {
    return this.http.get<ApiResponse<NewsSummary>>(`/api/public/articles/${id}/summary`)
      .pipe(map(r => r.data));
  }

  triggerSummarize(id: string | number): Observable<SummaryJob> {
    return this.http.post<ApiResponse<SummaryJob>>(`/api/public/articles/${id}/summarize`, {})
      .pipe(map(r => r.data));
  }
}
