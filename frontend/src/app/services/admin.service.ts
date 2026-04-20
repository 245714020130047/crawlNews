import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { Article, Category, DashboardData, PageResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl}/dashboard`);
  }

  // Articles
  getArticles(page = 0, size = 20, search?: string): Observable<PageResponse<Article>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('search', search);
    return this.http.get<PageResponse<Article>>(`${this.apiUrl}/articles`, { params });
  }

  updateArticle(id: number, data: Partial<Article>): Observable<Article> {
    return this.http.put<Article>(`${this.apiUrl}/articles/${id}`, data);
  }

  deleteArticle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/articles/${id}`);
  }

  summarizeArticle(id: number): Observable<Article> {
    return this.http.post<Article>(`${this.apiUrl}/articles/${id}/summarize`, {});
  }

  // Categories
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  createCategory(data: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, data);
  }

  updateCategory(id: number, data: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, data);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
  }

  // Users
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  updateUserRole(id: number, role: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/users/${id}/role`, { role });
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  // Schedulers
  getSchedulers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/schedulers`);
  }

  toggleScheduler(id: number | string, enabled: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/schedulers/${id}/toggle`, { enabled });
  }

  // Crawl
  getCrawlConfigs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/crawl/configs`);
  }

  getCrawlLogs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/crawl/logs`);
  }

  triggerCrawl(): Observable<any> {
    return this.http.post(`${this.apiUrl}/crawl/trigger`, {});
  }

  toggleCrawlConfig(id: number, enabled: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/crawl/configs/${id}/toggle`, { enabled });
  }

  // Analytics
  getViewsByDay(days = 30): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/analytics/views`, {
      params: new HttpParams().set('days', days)
    });
  }

  getViewsByCountry(days = 30): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/analytics/countries`, {
      params: new HttpParams().set('days', days)
    });
  }

  // IP Blacklist
  getAnalytics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics`);
  }

  getTopArticles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/analytics/top-articles`);
  }

  getIpBlacklist(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ip-blacklist`);
  }

  removeFromBlacklist(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/ip-blacklist/${id}`);
  }

  getBlacklist(page = 0, size = 20): Observable<PageResponse<any>> {
    return this.http.get<PageResponse<any>>(`${this.apiUrl}/ip-blacklist`, {
      params: new HttpParams().set('page', page).set('size', size)
    });
  }

  blockIp(ipAddress: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/ip-blacklist`, { ipAddress, reason });
  }

  unblockIp(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/ip-blacklist/${id}`);
  }
}
