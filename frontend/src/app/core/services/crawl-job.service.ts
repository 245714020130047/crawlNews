import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, CrawlJob, CrawlResult, Page } from '../../models/api.models';

@Injectable({ providedIn: 'root' })
export class CrawlJobService {
  private readonly base = '/api/admin/crawl-jobs';

  constructor(private http: HttpClient) {}

  getJobs(params: Record<string, string | number> = {}): Observable<Page<CrawlJob>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => httpParams = httpParams.set(k, String(v)));
    return this.http.get<ApiResponse<Page<CrawlJob>>>(this.base, { params: httpParams })
      .pipe(map(r => r.data));
  }

  getJobById(id: number): Observable<CrawlJob> {
    return this.http.get<ApiResponse<CrawlJob>>(`${this.base}/${id}`)
      .pipe(map(r => r.data));
  }

  getJobResults(id: number): Observable<Page<CrawlResult>> {
    return this.http.get<ApiResponse<Page<CrawlResult>>>(`${this.base}/${id}/results`)
      .pipe(map(r => r.data));
  }
}
