import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SummaryAdminService } from '../../core/services/summary-admin.service';
import { SummaryJob, NewsSummary, SummarySettings, Page } from '../../models/api.models';

@Component({
  selector: 'app-admin-summaries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container py-6">
      <div class="page-header flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Quản lý AI Summary</h1>
          <p class="text-gray-500 mt-1">Hàng đợi tóm tắt và cấu hình</p>
        </div>
        <!-- Auto-summary toggle -->
        <div *ngIf="settings" class="flex items-center gap-3">
          <span class="text-sm text-gray-700">Tự động tóm tắt</span>
          <button (click)="toggleAutoSummary()"
                  [class]="settings.autoSummaryEnabled
                      ? 'relative inline-flex h-6 w-11 items-center rounded-full bg-purple-600 transition-colors'
                      : 'relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 transition-colors'">
            <span [class]="settings.autoSummaryEnabled
                ? 'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform translate-x-6'
                : 'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform translate-x-1'">
            </span>
          </button>
          <span class="text-xs text-gray-500">Hạn mức: {{ settings.summaryDailyLimit }}/ngày</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl border border-gray-100 p-4 mt-4 mb-6 flex flex-wrap gap-3 items-center">
        <select [(ngModel)]="statusFilter" (ngModelChange)="onFilterChange()"
                class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tất cả trạng thái</option>
          <option value="QUEUED">Chờ xử lý</option>
          <option value="PROCESSING">Đang xử lý</option>
          <option value="DONE">Hoàn thành</option>
          <option value="FAILED">Thất bại</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="flex flex-col gap-2">
        <div *ngFor="let i of [1,2,3,4,5]" class="skeleton h-14 w-full rounded-xl"></div>
      </div>

      <!-- Jobs table -->
      <div *ngIf="!loading" class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th class="px-5 py-3 text-left">Bài viết</th>
              <th class="px-5 py-3 text-center">Trạng thái</th>
              <th class="px-5 py-3 text-center">Ưu tiên</th>
              <th class="px-5 py-3 text-center">Loại</th>
              <th class="px-5 py-3 text-center">Thử lại</th>
              <th class="px-5 py-3 text-left">Lỗi</th>
              <th class="px-5 py-3 text-center">Tạo lúc</th>
              <th class="px-5 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let job of jobs" class="border-t border-gray-50 hover:bg-gray-50">
              <td class="px-5 py-3 max-w-xs">
                <p class="text-gray-900 font-medium line-clamp-2 text-sm leading-tight">
                  {{ job.article?.title }}
                </p>
                <p class="text-xs text-gray-400 mt-0.5">ID: {{ job.article?.id }}</p>
              </td>
              <td class="px-5 py-3 text-center">
                <span [class]="jobStatusClass(job.status)">{{ jobStatusLabel(job.status) }}</span>
              </td>
              <td class="px-5 py-3 text-center text-xs text-gray-500">{{ job.priority }}</td>
              <td class="px-5 py-3 text-center text-xs text-gray-500">
                {{ job.triggerMode === 'AUTO' ? 'Tự động' : 'Thủ công' }}
              </td>
              <td class="px-5 py-3 text-center text-xs">
                <span [class]="job.retryCount > 0 ? 'text-orange-500 font-medium' : 'text-gray-400'">
                  {{ job.retryCount }}/{{ job.maxRetries }}
                </span>
              </td>
              <td class="px-5 py-3 text-xs text-red-400 max-w-48 truncate">
                {{ job.errorMessage }}
              </td>
              <td class="px-5 py-3 text-center text-xs text-gray-500">
                {{ job.createdAt | date:'dd/MM HH:mm' }}
              </td>
              <td class="px-5 py-3 text-center">
                <button *ngIf="job.status === 'FAILED'"
                        (click)="retry(job)"
                        [disabled]="retryingId === job.id"
                        class="px-2 py-1 text-xs border border-blue-300 text-blue-600 rounded hover:bg-blue-50 disabled:opacity-50">
                  {{ retryingId === job.id ? '⏳' : '↺ Thử lại' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="jobs.length === 0" class="text-center py-12 text-gray-400">
          Không có công việc nào.
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="!loading && totalPages > 1"
           class="flex justify-center items-center gap-2 mt-6">
        <button (click)="goToPage(currentPage - 1)"
                [disabled]="currentPage === 0"
                class="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-50">‹</button>
        <span class="text-sm text-gray-500">Trang {{ currentPage + 1 }}/{{ totalPages }}</span>
        <button (click)="goToPage(currentPage + 1)"
                [disabled]="currentPage >= totalPages - 1"
                class="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-50">›</button>
      </div>

      <!-- Settings modal -->
      <div *ngIf="showSettings"
           class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6" *ngIf="settings">
          <h2 class="text-lg font-semibold mb-4">Cài đặt AI Summary</h2>
          <div class="flex flex-col gap-4">
            <div>
              <label class="block text-sm text-gray-700 mb-1">Hạn mức mỗi ngày</label>
              <input type="number" [(ngModel)]="settings.summaryDailyLimit" min="1" max="10000"
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button (click)="showSettings = false"
                    class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Hủy
            </button>
            <button (click)="saveSettings()"
                    class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminSummariesComponent implements OnInit {
  jobs: SummaryJob[] = [];
  settings: SummarySettings | null = null;
  loading = true;
  showSettings = false;
  retryingId: number | null = null;
  statusFilter = '';
  currentPage = 0;
  totalPages = 0;

  constructor(private summaryService: SummaryAdminService) {}

  ngOnInit(): void {
    this.load();
    this.loadSettings();
  }

  load(): void {
    this.loading = true;
    const params: Record<string, string | number> = { page: this.currentPage, size: 20 };
    if (this.statusFilter) params['status'] = this.statusFilter;

    this.summaryService.getJobs(params).subscribe({
      next: (page: Page<SummaryJob>) => {
        this.jobs = page.content;
        this.totalPages = page.totalPages;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadSettings(): void {
    this.summaryService.getSettings().subscribe({
      next: (s) => this.settings = s,
      error: () => {}
    });
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.load();
  }

  retry(job: SummaryJob): void {
    if (!job.article) return;
    this.retryingId = job.id;
    this.summaryService.retry(job.article.id).subscribe({
      next: () => { this.retryingId = null; this.load(); },
      error: () => { this.retryingId = null; }
    });
  }

  toggleAutoSummary(): void {
    if (!this.settings) return;
    const updated = { ...this.settings, autoSummaryEnabled: !this.settings.autoSummaryEnabled };
    this.summaryService.updateSettings(updated).subscribe({
      next: (s) => this.settings = s,
      error: () => {}
    });
  }

  saveSettings(): void {
    if (!this.settings) return;
    this.summaryService.updateSettings(this.settings).subscribe({
      next: (s) => { this.settings = s; this.showSettings = false; },
      error: () => {}
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  jobStatusLabel(s: string): string {
    const m: Record<string, string> = {
      QUEUED: 'Chờ', PROCESSING: 'Đang xử lý', DONE: 'Hoàn thành',
      FAILED: 'Thất bại', CANCELLED: 'Đã hủy'
    };
    return m[s] ?? s;
  }

  jobStatusClass(s: string): string {
    const base = 'inline-block px-2 py-0.5 rounded-full text-xs ';
    const m: Record<string, string> = {
      QUEUED: base + 'bg-gray-100 text-gray-600',
      PROCESSING: base + 'bg-blue-100 text-blue-700',
      DONE: base + 'bg-green-100 text-green-700',
      FAILED: base + 'bg-red-100 text-red-700',
      CANCELLED: base + 'bg-gray-100 text-gray-400'
    };
    return m[s] ?? base + 'bg-gray-100 text-gray-500';
  }
}
