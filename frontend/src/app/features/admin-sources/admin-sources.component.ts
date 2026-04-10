import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SourceService } from '../../core/services/source.service';
import { NewsSource } from '../../models/api.models';

@Component({
  selector: 'app-admin-sources',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container py-6">
      <div class="page-header flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Quản lý nguồn báo</h1>
          <p class="text-gray-500 mt-1">Thêm, sửa, bật/tắt và crawl thủ công</p>
        </div>
        <button (click)="openAdd()"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          + Thêm nguồn
        </button>
      </div>

      <!-- Loading skeleton -->
      <div *ngIf="loading" class="mt-6 flex flex-col gap-3">
        <div *ngFor="let i of [1,2,3,4,5]" class="skeleton h-14 w-full rounded-xl"></div>
      </div>

      <!-- Table -->
      <div *ngIf="!loading" class="mt-6 bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th class="px-5 py-3 text-left">Tên / Slug</th>
              <th class="px-5 py-3 text-left">URL</th>
              <th class="px-5 py-3 text-center">Parser</th>
              <th class="px-5 py-3 text-center">Trạng thái</th>
              <th class="px-5 py-3 text-center">Lần crawl cuối</th>
              <th class="px-5 py-3 text-center">Lỗi liên tiếp</th>
              <th class="px-5 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of sources" class="border-t border-gray-50 hover:bg-gray-50">
              <td class="px-5 py-3">
                <div class="font-medium text-gray-900">{{ s.name }}</div>
                <div class="text-xs text-gray-400">{{ s.slug }}</div>
              </td>
              <td class="px-5 py-3">
                <a [href]="s.baseUrl" target="_blank" rel="noopener noreferrer"
                   class="text-blue-600 hover:underline text-xs truncate max-w-40 block">
                  {{ s.baseUrl }}
                </a>
              </td>
              <td class="px-5 py-3 text-center text-xs text-gray-600">{{ s.parserAdapter }}</td>
              <td class="px-5 py-3 text-center">
                <span [class]="s.isActive
                    ? 'inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs'
                    : 'inline-block px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs'">
                  {{ s.isActive ? 'Hoạt động' : 'Tạm dừng' }}
                </span>
              </td>
              <td class="px-5 py-3 text-center text-xs text-gray-500">
                {{ s.lastCrawledAt ? (s.lastCrawledAt | date:'dd/MM HH:mm') : '–' }}
              </td>
              <td class="px-5 py-3 text-center">
                <span [class]="s.consecutiveFailCount > 0
                    ? 'text-red-500 font-semibold'
                    : 'text-gray-400'">
                  {{ s.consecutiveFailCount }}
                </span>
              </td>
              <td class="px-5 py-3">
                <div class="flex items-center justify-center gap-2 flex-wrap">
                  <button (click)="openEdit(s)"
                          class="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100">
                    Sửa
                  </button>
                  <button *ngIf="s.isActive" (click)="toggleSource(s, false)"
                          class="px-2 py-1 text-xs border border-orange-300 text-orange-600 rounded hover:bg-orange-50">
                    Tạm dừng
                  </button>
                  <button *ngIf="!s.isActive" (click)="toggleSource(s, true)"
                          class="px-2 py-1 text-xs border border-green-300 text-green-600 rounded hover:bg-green-50">
                    Kích hoạt
                  </button>
                  <button (click)="crawlNow(s)"
                          [disabled]="crawlingId === s.id"
                          class="px-2 py-1 text-xs border border-blue-300 text-blue-600 rounded hover:bg-blue-50 disabled:opacity-50">
                    {{ crawlingId === s.id ? '⏳' : '▶ Crawl' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add/Edit Modal -->
      <div *ngIf="showForm"
           class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
          <h2 class="text-lg font-semibold mb-4">{{ editSource ? 'Sửa nguồn báo' : 'Thêm nguồn báo' }}</h2>
          <div class="flex flex-col gap-4">
            <div>
              <label class="block text-sm text-gray-700 mb-1">Tên nguồn *</label>
              <input type="text" [(ngModel)]="form.name" required
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Slug *</label>
              <input type="text" [(ngModel)]="form.slug" required
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Base URL *</label>
              <input type="url" [(ngModel)]="form.baseUrl" required
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Parser Adapter</label>
              <input type="text" [(ngModel)]="form.parserAdapter"
                     placeholder="vd: VnExpressAdapter"
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Crawl cron expression</label>
              <input type="text" [(ngModel)]="form.crawlCron"
                     placeholder="0 */30 * * * *"
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button (click)="closeForm()"
                    class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Hủy
            </button>
            <button (click)="saveSource()"
                    [disabled]="saving"
                    class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {{ saving ? 'Đang lưu...' : 'Lưu' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminSourcesComponent implements OnInit {
  sources: NewsSource[] = [];
  loading = true;
  showForm = false;
  saving = false;
  crawlingId: number | null = null;
  editSource: NewsSource | null = null;

  form: Partial<NewsSource> = {};

  constructor(private sourceService: SourceService) {}

  ngOnInit(): void {
    this.loadSources();
  }

  loadSources(): void {
    this.loading = true;
    this.sourceService.adminGetAll().subscribe({
      next: (s) => { this.sources = s; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openAdd(): void {
    this.editSource = null;
    this.form = {};
    this.showForm = true;
  }

  openEdit(s: NewsSource): void {
    this.editSource = s;
    this.form = { ...s };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.form = {};
  }

  saveSource(): void {
    if (!this.form.name || !this.form.slug || !this.form.baseUrl) return;
    this.saving = true;
    const op = this.editSource
      ? this.sourceService.adminUpdate(this.editSource.id, this.form)
      : this.sourceService.adminCreate(this.form);

    op.subscribe({
      next: () => {
        this.saving = false;
        this.closeForm();
        this.loadSources();
      },
      error: () => { this.saving = false; }
    });
  }

  toggleSource(s: NewsSource, enable: boolean): void {
    const op = enable
      ? this.sourceService.adminEnable(s.id)
      : this.sourceService.adminDisable(s.id);
    op.subscribe(() => this.loadSources());
  }

  crawlNow(s: NewsSource): void {
    this.crawlingId = s.id;
    this.sourceService.adminCrawl(s.id).subscribe({
      next: () => { this.crawlingId = null; },
      error: () => { this.crawlingId = null; }
    });
  }
}
