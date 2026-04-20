import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  template: `
    <!-- Navbar (Sticky, no Topbar) -->
    <div class="container-fluid p-0">
      <nav class="navbar navbar-expand-lg bg-dark navbar-dark py-2 py-lg-0 px-lg-5 navbar-sticky"
           [class.scrolled]="isScrolled()">
        <!-- Social icons (moved from topbar) -->
        <div class="d-none d-lg-flex align-items-center mr-3">
          <a class="nav-link text-body px-1" href="#"><small class="fab fa-facebook-f"></small></a>
          <a class="nav-link text-body px-1" href="#"><small class="fab fa-twitter"></small></a>
          <a class="nav-link text-body px-1" href="#"><small class="fab fa-youtube"></small></a>
          <a class="nav-link text-body px-1" href="#"><small class="fab fa-instagram"></small></a>
        </div>

        <a routerLink="/" class="navbar-brand d-block d-lg-none">
          <h1 class="m-0 display-4 text-uppercase text-primary">VN<span class="text-white font-weight-normal">News</span></h1>
        </a>

        <button type="button" class="navbar-toggler" (click)="isCollapsed = !isCollapsed">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="navbar-collapse" [class.collapse]="isCollapsed" [class.show]="!isCollapsed">
          <!-- Brand for desktop -->
          <a routerLink="/" class="navbar-brand d-none d-lg-block mr-4">
            <h1 class="m-0 text-uppercase text-primary" style="font-size: 1.8rem;">VN<span class="text-white font-weight-normal">News</span></h1>
          </a>

          <div class="navbar-nav mr-auto py-0">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}"
               class="nav-item nav-link">Trang chủ</a>
            @for (cat of categories(); track cat.id) {
              <a [routerLink]="['/category', cat.slug]" routerLinkActive="active"
                 class="nav-item nav-link">{{ cat.name }}</a>
            }
          </div>

          <!-- Search -->
          <div class="input-group ml-auto d-none d-lg-flex" style="width: 100%; max-width: 300px;">
            <input type="text" class="form-control border-0" placeholder="Tìm kiếm..."
                   [(ngModel)]="searchQuery" (keyup.enter)="onSearch()">
            <div class="input-group-append">
              <button class="input-group-text bg-primary text-dark border-0 px-3" (click)="onSearch()">
                <i class="fa fa-search"></i>
              </button>
            </div>
          </div>

          <!-- Login/User (moved from topbar) -->
          <div class="navbar-nav ml-3">
            @if (authService.isLoggedIn()) {
              <div class="nav-item dropdown">
                <a class="nav-link dropdown-toggle text-white" href="#" (click)="$event.preventDefault(); showUserMenu = !showUserMenu">
                  <i class="fas fa-user mr-1"></i> {{ authService.currentUser()?.username }}
                </a>
                @if (showUserMenu) {
                  <div class="dropdown-menu dropdown-menu-right show">
                    @if (authService.isAdmin()) {
                      <a class="dropdown-item" routerLink="/admin">
                        <i class="fas fa-cog mr-2"></i>Quản trị
                      </a>
                    }
                    <a class="dropdown-item" href="#" (click)="$event.preventDefault(); authService.logout()">
                      <i class="fas fa-sign-out-alt mr-2"></i>Đăng xuất
                    </a>
                  </div>
                }
              </div>
            } @else {
              <a routerLink="/login" class="nav-item nav-link text-white">
                <i class="fas fa-sign-in-alt mr-1"></i> Đăng nhập
              </a>
            }
          </div>
        </div>
      </nav>
    </div>
  `
})
export class NavbarComponent {
  categories = signal<Category[]>([]);
  isCollapsed = true;
  isScrolled = signal(false);
  searchQuery = '';
  showUserMenu = false;

  constructor(
    public authService: AuthService,
    private categoryService: CategoryService,
    private router: Router
  ) {
    this.categoryService.getAll().subscribe(cats => this.categories.set(cats));
  }

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled.set(window.scrollY > 50);
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery.trim() } });
      this.searchQuery = '';
    }
  }
}
