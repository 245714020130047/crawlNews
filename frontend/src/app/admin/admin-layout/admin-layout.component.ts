import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <!-- Admin Navbar -->
    <nav class="navbar navbar-dark bg-dark px-4">
      <a routerLink="/" class="navbar-brand">
        <span class="text-primary font-weight-bold">VN</span><span class="text-white">News</span>
        <small class="text-muted ml-2">Admin</small>
      </a>
      <div class="d-flex align-items-center">
        <span class="text-white mr-3">{{ authService.currentUser()?.username }}</span>
        <button class="btn btn-sm btn-outline-primary" (click)="authService.logout()">Đăng xuất</button>
      </div>
    </nav>

    <div class="d-flex">
      <!-- Sidebar -->
      <div class="admin-sidebar">
        <nav class="nav flex-column pt-3">
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}"
             class="nav-link"><i class="fas fa-tachometer-alt"></i>Dashboard</a>
          <a routerLink="/admin/articles" routerLinkActive="active"
             class="nav-link"><i class="fas fa-newspaper"></i>Bài viết</a>
          <a routerLink="/admin/categories" routerLinkActive="active"
             class="nav-link"><i class="fas fa-folder"></i>Chuyên mục</a>
          <a routerLink="/admin/users" routerLinkActive="active"
             class="nav-link"><i class="fas fa-users"></i>Người dùng</a>
          <a routerLink="/admin/crawl" routerLinkActive="active"
             class="nav-link"><i class="fas fa-spider"></i>Crawl</a>
          <a routerLink="/admin/schedulers" routerLinkActive="active"
             class="nav-link"><i class="fas fa-clock"></i>Lịch trình</a>
          <a routerLink="/admin/analytics" routerLinkActive="active"
             class="nav-link"><i class="fas fa-chart-bar"></i>Thống kê</a>
        </nav>
      </div>

      <!-- Content -->
      <div class="admin-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class AdminLayoutComponent {
  constructor(public authService: AuthService) {}
}
