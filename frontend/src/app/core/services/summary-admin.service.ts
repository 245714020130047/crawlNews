import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, SummaryJob, NewsSummary, SummarySettings, Page } from '../../models/api.models';

@Injectable({ providedIn: 'root' })
export class SummaryAdminService {
  private readonly base = '/api/admin/summaries';

  constructor(private http: HttpClient) {}

  getJobs(params: Record<string, string | number> = {}): Observable<Page<SummaryJob>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => httpParams = httpParams.set(k, String(v)));
    return this.http.get<ApiResponse<Page<SummaryJob>>>(`${this.base}/jobs`, { params: httpParams })
      .pipe(map(r => r.data));
  }

  retry(articleId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${articleId}/retry`, {});
  }

  updateSummary(articleId: number, body: Partial<NewsSummary>): Observable<NewsSummary> {
    return this.http.put<ApiResponse<NewsSummary>>(`${this.base}/${articleId}`, body)
      .pipe(map(r => r.data));
  }

  getSettings(): Observable<SummarySettings> {
    return this.http.get<ApiResponse<SummarySettings>>(`${this.base}/settings`)
      .pipe(map(r => r.data));
  }

  updateSettings(settings: SummarySettings): Observable<SummarySettings> {
    return this.http.put<ApiResponse<SummarySettings>>(`${this.base}/settings`, settings)
      .pipe(map(r => r.data));
  }
}
