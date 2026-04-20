import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'category/:slug',
    loadComponent: () => import('./pages/category/category.component').then(m => m.CategoryComponent)
  },
  {
    path: 'article/:slug',
    loadComponent: () => import('./pages/article-detail/article-detail.component').then(m => m.ArticleDetailComponent)
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.component').then(m => m.SearchComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'articles',
        loadComponent: () => import('./admin/articles/articles.component').then(m => m.AdminArticlesComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./admin/categories/categories.component').then(m => m.AdminCategoriesComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./admin/users/users.component').then(m => m.AdminUsersComponent)
      },
      {
        path: 'crawl',
        loadComponent: () => import('./admin/crawl/crawl.component').then(m => m.AdminCrawlComponent)
      },
      {
        path: 'schedulers',
        loadComponent: () => import('./admin/schedulers/schedulers.component').then(m => m.AdminSchedulersComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./admin/analytics/analytics.component').then(m => m.AdminAnalyticsComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
