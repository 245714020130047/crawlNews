import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ArticleService } from '../../../core/services/article.service';
import { NewsArticle, NewsSummary } from '../../../models/api.models';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container py-6">

      <!-- Back link -->
      <a routerLink="/articles"
         class="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4 no-underline">
        ← Quay lại danh sách
      </a>

      <!-- Loading -->
      <div *ngIf="loading" class="max-w-3xl mx-auto">
        <div class="skeleton h-8 w-3/4 mb-4"></div>
        <div class="skeleton h-5 w-1/3 mb-6"></div>
        <div class="skeleton h-72 w-full rounded-xl mb-6"></div>
        <div *ngFor="let i of [1,2,3,4,5]" class="skeleton h-4 w-full mb-2"></div>
      </div>

      <!-- Error -->
      <div *ngIf="error && !loading" class="text-center py-16">
        <p class="text-red-500 text-lg">{{ error }}</p>
        <a routerLink="/articles"
           class="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg no-underline">
          Về danh sách
        </a>
      </div>

      <!-- Article -->
      <article *ngIf="!loading && !error && article" class="max-w-3xl mx-auto">

        <!-- Category + Source badges -->
        <div class="flex flex-wrap gap-2 mb-3">
          <span *ngIf="article.category"
                class="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
            {{ article.category.name }}
          </span>
          <span [class]="'source-badge source-badge--' + article.source?.slug">
            {{ article.source?.name }}
          </span>
        </div>

        <!-- Title -->
        <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mb-3">
          {{ article.title }}
        </h1>

        <!-- Meta -->
        <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-6">
          <span>{{ article.publishedAt | date:'EEEE, dd/MM/yyyy HH:mm' }}</span>
          <span *ngIf="article.viewCount">· {{ article.viewCount | number }} lượt xem</span>
          <a *ngIf="article.sourceUrl" [href]="article.sourceUrl" target="_blank" rel="noopener noreferrer"
             class="text-blue-600 hover:underline flex items-center gap-1">
            <span>Bài gốc</span>
            <span class="text-xs">↗</span>
          </a>
        </div>

        <!-- AI Summary block -->
        <div *ngIf="article.isSummarized && summary" class="ai-summary mb-6">
          <div class="ai-summary__badge">
            <span>✨</span>
            <span>Tóm tắt bởi AI ({{ summary.modelName }})</span>
          </div>
          <p class="ai-summary__text">{{ summary.bulletSummary }}</p>
          <div *ngIf="summary.sentiment"
               class="mt-2 text-xs text-gray-500 flex items-center gap-2">
            <span>Cảm xúc: <strong>{{ sentimentLabel(summary.sentiment) }}</strong></span>
            <span *ngIf="summary.sentimentScore">
              ({{ summary.sentimentScore | number:'1.0-2' }})
            </span>
          </div>
        </div>

        <!-- Trigger summary button (not yet summarized) -->
        <div *ngIf="!article.isSummarized && !summaryRequested" class="mb-6">
          <button (click)="requestSummary()"
                  [disabled]="summarizing"
                  class="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
            <span *ngIf="!summarizing">✨ Tóm tắt bằng AI</span>
            <span *ngIf="summarizing">⏳ Đang xử lý...&nbsp;</span>
          </button>
        </div>
        <div *ngIf="summaryRequested && !article.isSummarized" class="mb-6 p-3 bg-purple-50 rounded-lg text-sm text-purple-700">
          Đã gửi yêu cầu tóm tắt. Kết quả sẽ xuất hiện trong ít phút.
        </div>

        <!-- Cover image -->
        <figure *ngIf="article.imageUrl" class="mb-6">
          <img [src]="article.imageUrl"
               [alt]="article.imageAlt || article.title"
               class="w-full rounded-xl object-cover max-h-96" />
          <figcaption *ngIf="article.imageAlt"
                      class="text-xs text-gray-400 mt-2 text-center">
            {{ article.imageAlt }}
          </figcaption>
        </figure>

        <!-- Excerpt -->
        <p *ngIf="article.excerpt"
           class="text-lg text-gray-600 font-medium mb-6 border-l-4 border-blue-400 pl-4 italic">
          {{ article.excerpt }}
        </p>

        <!-- Body content -->
        <div *ngIf="sanitizedContent"
             class="article-content"
             [innerHTML]="sanitizedContent">
        </div>

        <!-- Tags -->
        <div *ngIf="article.tags?.length" class="mt-8 flex flex-wrap gap-2">
          <span *ngFor="let tag of article.tags"
                class="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200 cursor-default">
            #{{ tag }}
          </span>
        </div>

        <!-- Footer: source link -->
        <div class="mt-8 pt-6 border-t border-gray-200">
          <p class="text-sm text-gray-500">
            Nguồn:
            <a *ngIf="article.sourceUrl" [href]="article.sourceUrl" target="_blank" rel="noopener noreferrer"
               class="text-blue-600 hover:underline">{{ article.source?.name }}</a>
            <span *ngIf="!article.sourceUrl">{{ article.source?.name }}</span>
          </p>
        </div>
      </article>
    </div>
  `
})
export class NewsDetailComponent implements OnInit {
  article: NewsArticle | null = null;
  summary: NewsSummary | null = null;
  sanitizedContent: SafeHtml | null = null;

  loading = true;
  error: string | null = null;
  summarizing = false;
  summaryRequested = false;

  constructor(
    private articleService: ArticleService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) this.loadArticle(id);
    });
  }

  loadArticle(id: string): void {
    this.loading = true;
    this.error = null;
    this.articleService.getArticleById(id).subscribe({
      next: (article) => {
        this.article = article;
        if (article.bodyHtml) {
          this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(article.bodyHtml);
        }
        if (article.isSummarized) {
          this.loadSummary(id);
        } else {
          this.loading = false;
        }
      },
      error: () => {
        this.error = 'Không tìm thấy bài viết.';
        this.loading = false;
      }
    });
  }

  loadSummary(id: string): void {
    this.articleService.getArticleSummary(id).subscribe({
      next: (s) => {
        this.summary = s;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  requestSummary(): void {
    if (!this.article) return;
    this.summarizing = true;
    this.articleService.triggerSummarize(String(this.article.id)).subscribe({
      next: () => {
        this.summarizing = false;
        this.summaryRequested = true;
      },
      error: () => {
        this.summarizing = false;
      }
    });
  }

  sentimentLabel(s: string): string {
    const map: Record<string, string> = { POSITIVE: 'Tích cực', NEGATIVE: 'Tiêu cực', NEUTRAL: 'Trung tính' };
    return map[s] ?? s;
  }
}
