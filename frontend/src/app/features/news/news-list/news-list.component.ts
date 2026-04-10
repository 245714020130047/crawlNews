import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ArticleService } from '../../../core/services/article.service';
import { CategoryService } from '../../../core/services/category.service';
import { SourceService } from '../../../core/services/source.service';
import { NewsArticle, Category, NewsSource, Page } from '../../../models/api.models';

@Component({
  selector: 'app-news-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-container py-6">
      <div class="page-header">
        <h1 class="text-2xl font-bold text-gray-900">Tin tức</h1>
        <p class="text-gray-500 mt-1">Tổng hợp tin tức từ các báo lớn</p>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl border border-gray-100 p-4 mt-4 mb-6">
        <div class="flex flex-wrap gap-3 items-center">
          <!-- Search -->
          <div class="flex-1 min-w-48">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Tìm kiếm tin tức..."
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Source filter -->
          <select
            [(ngModel)]="selectedSourceId"
            (ngModelChange)="onFilterChange()"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tất cả nguồn</option>
            <option *ngFor="let s of sources" [value]="s.id">{{ s.name }}</option>
          </select>

          <!-- Category filter -->
          <select
            [(ngModel)]="selectedCategoryId"
            (ngModelChange)="onFilterChange()"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tất cả chuyên mục</option>
            <option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</option>
          </select>

          <!-- Sort -->
          <select
            [(ngModel)]="sort"
            (ngModelChange)="onFilterChange()"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="publishedAt,desc">Mới nhất</option>
            <option value="publishedAt,asc">Cũ nhất</option>
            <option value="viewCount,desc">Xem nhiều nhất</option>
          </select>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div *ngIf="loading" class="news-grid">
        <div *ngFor="let i of [1,2,3,4,5,6,8,9,10,12]" class="news-card">
          <div class="skeleton" style="height:180px"></div>
          <div class="p-4 flex flex-col gap-2">
            <div class="skeleton h-4 w-3/4"></div>
            <div class="skeleton h-3 w-full"></div>
            <div class="skeleton h-3 w-1/2"></div>
          </div>
        </div>
      </div>

      <!-- Article grid -->
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
              <span *ngIf="article.category" class="text-xs text-gray-500">
                · {{ article.category.name }}
              </span>
              <span class="text-xs text-gray-400">
                · {{ article.publishedAt | date:'dd/MM HH:mm' }}
              </span>
              <span *ngIf="article.isSummarized" class="summary-badge ml-auto">✨ AI</span>
            </div>
          </div>
        </a>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && articles.length === 0" class="text-center py-16">
        <p class="text-gray-400 text-lg">Không tìm thấy bài viết nào.</p>
        <button *ngIf="searchQuery || selectedSourceId || selectedCategoryId"
                (click)="clearFilters()"
                class="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
          Xóa bộ lọc
        </button>
      </div>

      <!-- Pagination -->
      <div *ngIf="!loading && totalPages > 1"
           class="flex justify-center items-center gap-2 mt-8">
        <button (click)="goToPage(0)"
                [disabled]="currentPage === 0"
                class="px-3 py-1 border rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50">
          «
        </button>
        <button (click)="goToPage(currentPage - 1)"
                [disabled]="currentPage === 0"
                class="px-3 py-1 border rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50">
          ‹
        </button>

        <ng-container *ngFor="let p of pageRange()">
          <button (click)="goToPage(p)"
                  [class]="p === currentPage
                    ? 'px-3 py-1 border rounded text-sm bg-blue-600 text-white border-blue-600'
                    : 'px-3 py-1 border rounded text-sm hover:bg-gray-50'">
            {{ p + 1 }}
          </button>
        </ng-container>

        <button (click)="goToPage(currentPage + 1)"
                [disabled]="currentPage >= totalPages - 1"
                class="px-3 py-1 border rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50">
          ›
        </button>
        <button (click)="goToPage(totalPages - 1)"
                [disabled]="currentPage >= totalPages - 1"
                class="px-3 py-1 border rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50">
          »
        </button>

        <span class="text-sm text-gray-500 ml-2">
          Trang {{ currentPage + 1 }}/{{ totalPages }} ({{ totalElements }} bài)
        </span>
      </div>
    </div>
  `
})
export class NewsListComponent implements OnInit, OnDestroy {
  articles: NewsArticle[] = [];
  sources: NewsSource[] = [];
  categories: Category[] = [];

  loading = true;
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 12;

  searchQuery = '';
  selectedSourceId = '';
  selectedCategoryId = '';
  sort = 'publishedAt,desc';

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private articleService: ArticleService,
    private categoryService: CategoryService,
    private sourceService: SourceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Read initial query params
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.searchQuery = params.get('q') ?? '';
      this.selectedSourceId = params.get('sourceId') ?? '';
      this.selectedCategoryId = params.get('categoryId') ?? '';
      this.currentPage = Number(params.get('page') ?? 0);
      this.loadArticles();
    });

    // Debounce search
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 0;
      this.syncRoute();
    });

    // Load filter options
    this.sourceService.getSources().subscribe(s => this.sources = s);
    this.categoryService.getCategories().subscribe(c => this.categories = c);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadArticles(): void {
    this.loading = true;
    const params: Record<string, string | number> = {
      page: this.currentPage,
      size: this.pageSize,
      sort: this.sort
    };
    if (this.searchQuery) params['q'] = this.searchQuery;
    if (this.selectedSourceId) params['sourceId'] = this.selectedSourceId;
    if (this.selectedCategoryId) params['categoryId'] = this.selectedCategoryId;

    this.articleService.getArticles(params).subscribe({
      next: (page: Page<NewsArticle>) => {
        this.articles = page.content;
        this.totalPages = page.totalPages;
        this.totalElements = page.totalElements;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.syncRoute();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedSourceId = '';
    this.selectedCategoryId = '';
    this.currentPage = 0;
    this.syncRoute();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.syncRoute();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  pageRange(): number[] {
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages - 1, this.currentPage + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  private syncRoute(): void {
    const queryParams: Record<string, string | number | null> = {
      page: this.currentPage > 0 ? this.currentPage : null,
      q: this.searchQuery || null,
      sourceId: this.selectedSourceId || null,
      categoryId: this.selectedCategoryId || null
    };
    this.router.navigate([], { queryParams, queryParamsHandling: 'merge' });
  }
}
