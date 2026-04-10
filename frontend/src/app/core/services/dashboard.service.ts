import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, DashboardOverview } from '../../models/api.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  constructor(private http: HttpClient) {}

  getOverview(): Observable<DashboardOverview> {
    return this.http.get<ApiResponse<DashboardOverview>>('/api/admin/dashboard/overview')
      .pipe(map(r => r.data));
  }

  getCrawlMetrics(): Observable<any> {
    return this.http.get<ApiResponse<any>>('/api/admin/dashboard/crawl-metrics')
      .pipe(map(r => r.data));
  }

  getSummaryMetrics(): Observable<any> {
    return this.http.get<ApiResponse<any>>('/api/admin/dashboard/summary-metrics')
      .pipe(map(r => r.data));
  }

  getSourceHealth(): Observable<any> {
    return this.http.get<ApiResponse<any>>('/api/admin/dashboard/source-health')
      .pipe(map(r => r.data));
  }
}
