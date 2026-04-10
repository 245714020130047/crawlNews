import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrawlJobService } from '../../core/services/crawl-job.service';
import { CrawlJob, CrawlResult, Page } from '../../models/api.models';

@Component({
  selector: 'app-admin-crawl-data',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container py-6">
      <div class="page-header">
        <h1 class="text-2xl font-bold text-gray-900">Dữ liệu Crawl</h1>
        <p class="text-gray-500 mt-1">Lịch sử các lần crawl tin tức</p>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl border border-gray-100 p-4 mt-4 mb-6 flex flex-wrap gap-3 items-center">
        <select [(ngModel)]="statusFilter" (ngModelChange)="onFilterChange()"
                class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tất cả trạng thái</option>
          <option value="SUCCESS">Thành công</option>
          <option value="FAILED">Thất bại</option>
          <option value="PARTIAL">Một phần</option>
          <option value="RUNNING">Đang chạy</option>
          <option value="PENDING">Chờ</option>
        </select>
      </div>

      <!-- Jobs table -->
      <div *ngIf="loading" class="flex flex-col gap-2">
        <div *ngFor="let i of [1,2,3,4,5]" class="skeleton h-12 w-full rounded-xl"></div>
      </div>

      <div *ngIf="!loading" class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th class="px-5 py-3 text-left">ID</th>
              <th class="px-5 py-3 text-left">Nguồn</th>
              <th class="px-5 py-3 text-center">Loại</th>
              <th class="px-5 py-3 text-center">Trạng thái</th>
              <th class="px-5 py-3 text-right">Mới</th>
              <th class="px-5 py-3 text-right">Cập nhật</th>
              <th class="px-5 py-3 text-right">Bỏ qua</th>
              <th class="px-5 py-3 text-right">Lỗi</th>
              <th class="px-5 py-3 text-center">Thời gian</th>
              <th class="px-5 py-3 text-center">Bắt đầu</th>
              <th class="px-5 py-3 text-center"></th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let job of jobs">
              <tr class="border-t border-gray-50 hover:bg-gray-50">
                <td class="px-5 py-3 text-gray-400 text-xs">#{{ job.id }}</td>
                <td class="px-5 py-3">
                  <span [class]="'source-badge source-badge--' + job.source?.slug">
                    {{ job.source?.name }}
                  </span>
                </td>
                <td class="px-5 py-3 text-center text-xs text-gray-500">
                  {{ jobTypeLabel(job.jobType) }}
                </td>
                <td class="px-5 py-3 text-center">
                  <span [class]="statusClass(job.status)">{{ statusLabel(job.status) }}</span>
                </td>
                <td class="px-5 py-3 text-right text-green-600 font-medium">{{ job.articlesNew }}</td>
                <td class="px-5 py-3 text-right text-blue-600">{{ job.articlesUpdated }}</td>
                <td class="px-5 py-3 text-right text-gray-400">{{ job.articlesSkipped }}</td>
                <td class="px-5 py-3 text-right text-red-500">{{ job.articlesFailed }}</td>
                <td class="px-5 py-3 text-center text-xs text-gray-500">
                  {{ job.durationMs ? (job.durationMs / 1000 | number:'1.1-1') + 's' : '–' }}
                </td>
                <td class="px-5 py-3 text-center text-xs text-gray-500">
                  {{ job.startedAt ? (job.startedAt | date:'dd/MM HH:mm:ss') : '–' }}
                </td>
                <td class="px-5 py-3 text-center">
                  <button (click)="toggleResults(job)"
                          class="text-xs text-blue-600 hover:underline">
                    {{ expandedJobId === job.id ? 'Ẩn' : 'Chi tiết' }}
                  </button>
                </td>
              </tr>

              <!-- Results detail row -->
              <tr *ngIf="expandedJobId === job.id"
                  class="bg-gray-50 border-t border-gray-100">
                <td colspan="11" class="px-5 py-3">
                  <div *ngIf="resultsLoading" class="text-sm text-gray-400">Đang tải...</div>
                  <div *ngIf="!resultsLoading && results.length === 0"
                       class="text-sm text-gray-400">Không có kết quả.</div>
                  <table *ngIf="!resultsLoading && results.length > 0" class="w-full text-xs">
                    <thead class="text-gray-400 uppercase">
                      <tr>
                        <th class="py-1 text-left">URL</th>
                        <th class="py-1 text-center w-28">Kết quả</th>
                        <th class="py-1 text-left">Lỗi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let r of results" class="border-t border-gray-100">
                        <td class="py-1 max-w-md truncate text-gray-600">{{ r.articleUrl }}</td>
                        <td class="py-1 text-center">
                          <span [class]="resultTypeClass(r.resultType)">{{ r.resultType }}</span>
                        </td>
                        <td class="py-1 text-red-400">{{ r.errorMessage }}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </ng-container>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div *ngIf="!loading && totalPages > 1"
           class="flex justify-center items-center gap-2 mt-6">
        <button (click)="goToPage(currentPage - 1)"
                [disabled]="currentPage === 0"
                class="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-50">
          ‹
        </button>
        <span class="text-sm text-gray-500">Trang {{ currentPage + 1 }}/{{ totalPages }}</span>
        <button (click)="goToPage(currentPage + 1)"
                [disabled]="currentPage >= totalPages - 1"
                class="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-50">
          ›
        </button>
      </div>
    </div>
  `
})
export class AdminCrawlDataComponent implements OnInit {
  jobs: CrawlJob[] = [];
  results: CrawlResult[] = [];
  loading = true;
  resultsLoading = false;
  expandedJobId: number | null = null;

  statusFilter = '';
  currentPage = 0;
  totalPages = 0;

  constructor(private crawlJobService: CrawlJobService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    const params: Record<string, string | number> = { page: this.currentPage, size: 20 };
    if (this.statusFilter) params['status'] = this.statusFilter;

    this.crawlJobService.getJobs(params).subscribe({
      next: (page: Page<CrawlJob>) => {
        this.jobs = page.content;
        this.totalPages = page.totalPages;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.load();
  }

  toggleResults(job: CrawlJob): void {
    if (this.expandedJobId === job.id) {
      this.expandedJobId = null;
      return;
    }
    this.expandedJobId = job.id;
    this.resultsLoading = true;
    this.results = [];
    this.crawlJobService.getJobResults(job.id).subscribe({
      next: (page) => { this.results = page.content; this.resultsLoading = false; },
      error: () => { this.resultsLoading = false; }
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  statusLabel(s: string): string {
    const m: Record<string, string> = {
      SUCCESS: 'Thành công', FAILED: 'Thất bại', PARTIAL: 'Một phần',
      RUNNING: 'Đang chạy', PENDING: 'Chờ'
    };
    return m[s] ?? s;
  }

  statusClass(s: string): string {
    const base = 'inline-block px-2 py-0.5 rounded-full text-xs ';
    const m: Record<string, string> = {
      SUCCESS: base + 'bg-green-100 text-green-700',
      FAILED: base + 'bg-red-100 text-red-700',
      PARTIAL: base + 'bg-orange-100 text-orange-700',
      RUNNING: base + 'bg-blue-100 text-blue-700',
      PENDING: base + 'bg-gray-100 text-gray-500'
    };
    return m[s] ?? base + 'bg-gray-100 text-gray-500';
  }

  jobTypeLabel(t: string): string {
    const m: Record<string, string> = { SCHEDULED: 'Tự động', MANUAL: 'Thủ công', RETRY: 'Thử lại' };
    return m[t] ?? t;
  }

  resultTypeClass(t: string): string {
    const base = 'inline-block px-1.5 py-0.5 rounded text-xs ';
    const m: Record<string, string> = {
      NEW: base + 'bg-green-100 text-green-700',
      UPDATED: base + 'bg-blue-100 text-blue-700',
      SKIPPED: base + 'bg-gray-100 text-gray-500',
      FAILED: base + 'bg-red-100 text-red-700',
      DEDUPED: base + 'bg-purple-100 text-purple-600'
    };
    return m[t] ?? base + 'bg-gray-100 text-gray-500';
  }
}
