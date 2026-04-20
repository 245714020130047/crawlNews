import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { AuthResponse } from '../models';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  currentUser = signal<{ username: string; role: string } | null>(this.loadUser());
  isLoggedIn = signal(!!this.getAccessToken());
  isAdmin = signal(this.loadUser()?.role === 'ADMIN');

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { username, password });
  }

  register(username: string, email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, { username, email, password });
  }

  handleAuthResponse(response: AuthResponse) {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify({ username: response.username, role: response.role }));
    this.currentUser.set({ username: response.username, role: response.role });
    this.isLoggedIn.set(true);
    this.isAdmin.set(response.role === 'ADMIN');
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    this.isAdmin.set(false);
    this.router.navigate(['/']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken });
  }

  private loadUser(): { username: string; role: string } | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}
