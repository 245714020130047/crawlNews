import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container-fluid bg-dark" style="min-height: 100vh;">
      <div class="row justify-content-center align-items-center" style="min-height: 100vh;">
        <div class="col-md-4">
          <div class="text-center mb-4">
            <h1 class="text-primary text-uppercase">VN<span class="text-white font-weight-normal">News</span></h1>
          </div>
          <div class="bg-white rounded p-4">
            <h4 class="text-uppercase font-weight-bold mb-4 text-center">Đăng ký</h4>
            @if (error()) {
              <div class="alert alert-danger">{{ error() }}</div>
            }
            <div class="form-group">
              <label>Tên đăng nhập</label>
              <input type="text" class="form-control" [(ngModel)]="username">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" class="form-control" [(ngModel)]="email">
            </div>
            <div class="form-group">
              <label>Mật khẩu</label>
              <input type="password" class="form-control" [(ngModel)]="password">
            </div>
            <button class="btn btn-primary btn-block font-weight-bold" (click)="onRegister()" [disabled]="loading()">
              {{ loading() ? 'Đang xử lý...' : 'Đăng ký' }}
            </button>
            <p class="text-center mt-3 mb-0">
              Đã có tài khoản? <a routerLink="/login" class="text-primary">Đăng nhập</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  onRegister() {
    if (!this.username || !this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');
    this.authService.register(this.username, this.email, this.password).subscribe({
      next: (res) => {
        this.authService.handleAuthResponse(res);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Đăng ký thất bại');
        this.loading.set(false);
      }
    });
  }
}
