import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CategoryService } from '../../../core/services/category.service';
import { NewsArticle, Category, Page } from '../../../models/api.models';

@Component({
  selector: 'app-category-articles',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container py-6">
      <a routerLink="/categories"
         class="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4 no-underline">
        ← Tất cả chuyên mục
      </a>

      <!-- Loading header skeleton -->
      <div *ngIf="loading && !category">
        <div class="skeleton h-7 w-48 mb-2"></div>
        <div class="skeleton h-4 w-72 mb-6"></div>
      </div>

      <!-- Category header -->
      <div *ngIf="category" class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span *ngIf="category.icon">{{ category.icon }}</span>
          {{ category.name }}
        </h1>
        <p *ngIf="category.description" class="text-gray-500 mt-1">{{ category.description }}</p>
      </div>

      <!-- Article grid loading -->
      <div *ngIf="loading" class="news-grid">
        <div *ngFor="let i of [1,2,3,4,5,6]" class="news-card">
          <div class="skeleton" style="height:180px"></div>
          <div class="p-4 flex flex-col gap-2">
            <div class="skeleton h-4 w-3/4"></div>
            <div class="skeleton h-3 w-full"></div>
          </div>
        </div>
      </div>

      <!-- Articles -->
      <div *ngIf="!loading && articles.length > 0" class="news-grid">
        <a *ngFor="let article of articles"
           [routerLink]="['/articles', article.id]"
           class="news-card no-underline">
          <img *ngIf="article.imageUrl" [src]="article.imageUrl"
               [alt]="article.title" class="news-card__image" />
          <div *ngIf="!article.imageUrl"
               class="news-card__image bg-gradient-to-br from-gray-200 to-gray-300"></div>
          <div class="news-card__body">
            <h3 class="news-card__title">{{ article.title }}</h3>
            <p class="news-card__excerpt">{{ article.excerpt }}</p>
            <div class="news-card__meta">
              <span [class]="'source-badge source-badge--' + article.source?.slug">
                {{ article.source?.name }}
              </span>
              <span class="text-xs text-gray-400">· {{ article.publishedAt | date:'dd/MM HH:mm' }}</span>
              <span *ngIf="article.isSummarized" class="summary-badge ml-auto">✨ AI</span>
            </div>
          </div>
        </a>
      </div>

      <!-- Empty -->
      <div *ngIf="!loading && articles.length === 0" class="text-center py-16">
        <p class="text-gray-400 text-lg">Chưa có bài viết trong chuyên mục này.</p>
      </div>

      <!-- Load more -->
      <div *ngIf="!loading && hasMore" class="text-center mt-8">
        <button (click)="loadMore()"
                [disabled]="loadingMore"
                class="px-6 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-60">
          {{ loadingMore ? 'Đang tải...' : 'Xem thêm' }}
        </button>
      </div>
    </div>
  `
})
export class CategoryArticlesComponent implements OnInit {
  articles: NewsArticle[] = [];
  category: Category | null = null;

  loading = true;
  loadingMore = false;
  currentPage = 0;
  hasMore = false;

  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.currentPage = 0;
        this.articles = [];
        this.loadArticles(slug);
      }
    });
  }

  loadArticles(slug: string): void {
    this.loading = true;
    this.categoryService.getCategoryArticles(slug, this.currentPage).subscribe({
      next: (page: Page<NewsArticle> & { category?: Category }) => {
        this.articles = page.content;
        this.hasMore = !page.last;
        if ((page as any).category) this.category = (page as any).category;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadMore(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) return;
    this.loadingMore = true;
    this.currentPage++;
    this.categoryService.getCategoryArticles(slug, this.currentPage).subscribe({
      next: (page: Page<NewsArticle>) => {
        this.articles = [...this.articles, ...page.content];
        this.hasMore = !page.last;
        this.loadingMore = false;
      },
      error: () => { this.loadingMore = false; }
    });
  }
}
