import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ArticleService } from '../../core/services/article.service';
import { HomePayload, NewsArticle, SourceHealthMini } from '../../models/api.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container py-6">

      <!-- Loading state -->
      <div *ngIf="loading" class="flex flex-col gap-6">
        <div class="skeleton h-64 w-full rounded-xl"></div>
        <div class="news-grid">
          <div *ngFor="let i of [1,2,3,4]" class="news-card">
            <div class="skeleton h-48 w-full"></div>
            <div class="p-4 flex flex-col gap-2">
              <div class="skeleton h-4 w-3/4"></div>
              <div class="skeleton h-3 w-full"></div>
              <div class="skeleton h-3 w-5/6"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error state -->
      <div *ngIf="error && !loading" class="text-center py-16">
        <p class="text-red-500 text-lg">{{ error }}</p>
        <button (click)="loadData()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
          Thử lại
        </button>
      </div>

      <!-- Content -->
      <div *ngIf="!loading && !error && payload">

        <!-- Source health mini bar -->
        <div class="flex flex-wrap gap-2 mb-6">
          <span *ngFor="let s of payload.sources"
                [class]="'source-badge source-badge--' + s.slug">
            <span class="w-1.5 h-1.5 rounded-full inline-block"
                  [class]="s.isActive ? 'bg-green-500' : 'bg-red-400'"></span>
            {{ s.name }}
            <span class="text-xs opacity-70" *ngIf="s.lastCrawledAt">
              · {{ s.lastCrawledAt | date:'HH:mm' }}
            </span>
          </span>
        </div>

        <!-- Hero section -->
        <section class="mb-8" *ngIf="payload.hero?.length">
          <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <!-- Main hero (big) -->
            <div class="lg:col-span-3">
              <a [routerLink]="['/articles', payload.hero[0].id]"
                 class="hero-banner block no-underline" style="min-height:360px">
                <img *ngIf="payload.hero[0].imageUrl"
                     [src]="payload.hero[0].imageUrl"
                     [alt]="payload.hero[0].imageAlt || payload.hero[0].title"
                     class="hero-banner__image object-cover" />
                <div *ngIf="!payload.hero[0].imageUrl"
                     class="hero-banner__image bg-gradient-to-br from-blue-500 to-purple-600"></div>
                <div class="hero-banner__overlay"></div>
                <div class="hero-banner__content">
                  <span [class]="'source-badge source-badge--' + payload.hero[0].source?.slug + ' mb-2'">
                    {{ payload.hero[0].source?.name }}
                  </span>
                  <h2 class="hero-banner__title mt-2">{{ payload.hero[0].title }}</h2>
                  <p class="text-gray-300 text-sm mt-2 line-clamp-2">{{ payload.hero[0].excerpt }}</p>
                  <!-- AI summary -->
                  <div *ngIf="payload.hero[0].isSummarized"
                       class="mt-3 p-2 bg-white/10 rounded text-xs text-blue-200 flex items-start gap-2">
                    <span>✨</span>
                    <span>AI tóm tắt sẵn có</span>
                  </div>
                  <p class="text-gray-400 text-xs mt-2">
                    {{ payload.hero[0].publishedAt | date:'dd/MM/yyyy HH:mm' }}
                  </p>
                </div>
              </a>
            </div>

            <!-- Hero sidebar (4 articles) -->
            <div class="lg:col-span-2 feed-strip">
              <a *ngFor="let article of payload.hero.slice(1, 5)"
                 [routerLink]="['/articles', article.id]"
                 class="feed-strip__item no-underline">
                <img *ngIf="article.imageUrl" [src]="article.imageUrl"
                     [alt]="article.title" class="feed-strip__thumb" />
                <div *ngIf="!article.imageUrl"
                     class="feed-strip__thumb bg-gray-200 rounded-lg flex-shrink-0"></div>
                <div class="flex-1 min-w-0">
                  <p class="feed-strip__title">{{ article.title }}</p>
                  <div class="flex items-center gap-2 mt-1">
                    <span [class]="'source-badge source-badge--' + article.source?.slug">
                      {{ article.source?.name }}
                    </span>
                    <span class="text-xs text-gray-400">{{ article.publishedAt | date:'dd/MM HH:mm' }}</span>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </section>

        <!-- Trending + Latest -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <!-- Main feed -->
          <div class="lg:col-span-3">
            <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>🕐</span> Tin mới nhất
            </h2>
            <div class="news-grid">
              <a *ngFor="let article of payload.feed"
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
                    <span>·</span>
                    <span>{{ article.publishedAt | date:'dd/MM HH:mm' }}</span>
                    <span *ngIf="article.isSummarized"
                          class="summary-badge ml-auto">✨ AI</span>
                  </div>
                </div>
              </a>
            </div>
            <div class="mt-6 text-center">
              <a routerLink="/articles"
                 class="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors no-underline text-sm font-medium">
                Xem tất cả tin tức →
              </a>
            </div>
          </div>

          <!-- Sidebar: trending + per-source -->
          <div class="lg:col-span-1">
            <!-- Trending -->
            <div class="bg-white rounded-xl border border-gray-100 p-4 mb-4">
              <h3 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>🔥</span> Trending 48h
              </h3>
              <div class="flex flex-col">
                <a *ngFor="let article of payload.trending; let i = index"
                   [routerLink]="['/articles', article.id]"
                   class="trending-item no-underline">
                  <span class="trending-item__rank"
                        [class]="i < 3 ? 'trending-item__rank--top3' : 'trending-item__rank--rest'">
                    {{ i + 1 }}
                  </span>
                  <p class="text-sm text-gray-800 leading-snug line-clamp-2">{{ article.title }}</p>
                </a>
              </div>
            </div>

            <!-- Per-source strips -->
            <div *ngFor="let source of payload.sources | slice:0:3"
                 class="bg-white rounded-xl border border-gray-100 p-4 mb-4">
              <h3 class="font-semibold mb-3 flex items-center justify-between">
                <span [class]="'source-badge source-badge--' + source.slug">{{ source.name }}</span>
                <a [routerLink]="['/articles']" [queryParams]="{sourceId: source.id}"
                   class="text-xs text-blue-600 no-underline">Tất cả</a>
              </h3>
              <div class="feed-strip">
                <a *ngFor="let article of getSourceArticles(source.slug)"
                   [routerLink]="['/articles', article.id]"
                   class="no-underline text-gray-700 text-sm py-1 border-b border-gray-100 last:border-0 leading-snug hover:text-blue-600 transition-colors line-clamp-2">
                  {{ article.title }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class HomeComponent implements OnInit {
  payload: HomePayload | null = null;
  loading = true;
  error: string | null = null;

  constructor(private articleService: ArticleService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;
    this.articleService.getHome().subscribe({
      next: (data) => {
        this.payload = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Không thể tải dữ liệu. Vui lòng thử lại.';
        this.loading = false;
        console.error('[HomeComponent] Error loading home data', err);
      }
    });
  }

  getSourceArticles(slug: string): NewsArticle[] {
    return this.payload?.perSource?.[slug] ?? [];
  }
}
