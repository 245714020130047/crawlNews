import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'CrawlNews - Trang chủ'
  },
  {
    path: 'articles',
    loadComponent: () => import('./features/news/news-list/news-list.component').then(m => m.NewsListComponent),
    title: 'CrawlNews - Danh sách tin'
  },
  {
    path: 'articles/:id',
    loadComponent: () => import('./features/news/news-detail/news-detail.component').then(m => m.NewsDetailComponent),
    title: 'CrawlNews - Chi tiết'
  },
  {
    path: 'categories',
    loadComponent: () => import('./features/news/category/category-list.component').then(m => m.CategoryListComponent),
    title: 'CrawlNews - Chuyên mục'
  },
  {
    path: 'categories/:slug',
    loadComponent: () => import('./features/news/category/category-articles.component').then(m => m.CategoryArticlesComponent),
    title: 'CrawlNews - Chuyên mục'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Admin - Dashboard'
  },
  {
    path: 'admin/sources',
    loadComponent: () => import('./features/admin-sources/admin-sources.component').then(m => m.AdminSourcesComponent),
    title: 'Admin - Nguồn crawl'
  },
  {
    path: 'admin/categories',
    loadComponent: () => import('./features/admin-categories/admin-categories.component').then(m => m.AdminCategoriesComponent),
    title: 'Admin - Chuyên mục'
  },
  {
    path: 'admin/crawl-jobs',
    loadComponent: () => import('./features/admin-crawl-data/admin-crawl-data.component').then(m => m.AdminCrawlDataComponent),
    title: 'Admin - Crawl Jobs'
  },
  {
    path: 'admin/summaries',
    loadComponent: () => import('./features/admin-summaries/admin-summaries.component').then(m => m.AdminSummariesComponent),
    title: 'Admin - AI Summaries'
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
