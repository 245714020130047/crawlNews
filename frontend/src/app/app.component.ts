import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="min-h-screen flex flex-col">
      <!-- Top Navigation -->
      <nav class="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div class="page-container">
          <div class="flex items-center justify-between h-14">
            <!-- Logo -->
            <a routerLink="/home" class="flex items-center gap-2 text-blue-600 font-bold text-xl no-underline">
              <span class="text-2xl">📰</span>
              <span>CrawlNews</span>
            </a>

            <!-- Main nav links -->
            <div class="hidden md:flex items-center gap-1">
              <a routerLink="/home" routerLinkActive="text-blue-600 bg-blue-50"
                 class="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium no-underline">
                Trang chủ
              </a>
              <a routerLink="/articles" routerLinkActive="text-blue-600 bg-blue-50"
                 class="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium no-underline">
                Tin tức
              </a>
              <a routerLink="/categories" routerLinkActive="text-blue-600 bg-blue-50"
                 class="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium no-underline">
                Chuyên mục
              </a>
            </div>

            <!-- Admin links -->
            <div class="flex items-center gap-2">
              <div class="hidden lg:flex items-center gap-1 border-l border-gray-200 pl-3">
                <a routerLink="/dashboard" routerLinkActive="text-blue-600"
                   class="px-3 py-1.5 rounded text-gray-500 hover:text-gray-900 text-xs font-medium no-underline">
                  Dashboard
                </a>
                <a routerLink="/admin/sources" routerLinkActive="text-blue-600"
                   class="px-3 py-1.5 rounded text-gray-500 hover:text-gray-900 text-xs font-medium no-underline">
                  Nguồn
                </a>
                <a routerLink="/admin/summaries" routerLinkActive="text-blue-600"
                   class="px-3 py-1.5 rounded text-gray-500 hover:text-gray-900 text-xs font-medium no-underline">
                  AI Summary
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Page content -->
      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer class="bg-gray-900 text-gray-400 py-8 mt-12">
        <div class="page-container text-center text-sm">
          <p>© 2026 CrawlNews - Tổng hợp tin tức từ VnExpress, Tuổi Trẻ, Thanh Niên, Dân Trí, Kenh14</p>
          <p class="mt-1 text-xs text-gray-600">Dữ liệu được crawl tuân thủ robots.txt theo từng nguồn</p>
        </div>
      </footer>
    </div>
  `,
})
export class AppComponent {}
