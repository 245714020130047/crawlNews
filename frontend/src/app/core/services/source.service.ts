import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, NewsSource } from '../../models/api.models';

@Injectable({ providedIn: 'root' })
export class SourceService {

  constructor(private http: HttpClient) {}

  getSources(): Observable<NewsSource[]> {
    return this.http.get<ApiResponse<NewsSource[]>>('/api/public/sources')
      .pipe(map(r => r.data));
  }

  adminGetAll(): Observable<NewsSource[]> {
    return this.http.get<ApiResponse<NewsSource[]>>('/api/admin/sources')
      .pipe(map(r => r.data));
  }

  adminCreate(source: Partial<NewsSource>): Observable<NewsSource> {
    return this.http.post<ApiResponse<NewsSource>>('/api/admin/sources', source)
      .pipe(map(r => r.data));
  }

  adminUpdate(id: number, source: Partial<NewsSource>): Observable<NewsSource> {
    return this.http.put<ApiResponse<NewsSource>>(`/api/admin/sources/${id}`, source)
      .pipe(map(r => r.data));
  }

  adminEnable(id: number): Observable<void> {
    return this.http.post<ApiResponse<void>>(`/api/admin/sources/${id}/enable`, {})
      .pipe(map(() => void 0));
  }

  adminDisable(id: number): Observable<void> {
    return this.http.post<ApiResponse<void>>(`/api/admin/sources/${id}/disable`, {})
      .pipe(map(() => void 0));
  }

  adminCrawl(id: number): Observable<void> {
    return this.http.post<ApiResponse<void>>(`/api/admin/sources/${id}/crawl`, {})
      .pipe(map(() => void 0));
  }
}
