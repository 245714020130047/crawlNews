import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-crawl',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h3 class="font-weight-bold m-0">Quản lý Crawl</h3>
        <button class="btn btn-success" (click)="triggerCrawl()" [disabled]="crawling()">
          <i class="fas fa-play mr-1"></i>{{ crawling() ? 'Đang crawl...' : 'Chạy crawl ngay' }}
        </button>
      </div>

      <!-- Crawl configs -->
      <div class="card mb-3">
        <div class="card-header bg-dark text-white"><h5 class="m-0">Cấu hình nguồn</h5></div>
        <div class="card-body p-0">
          <table class="table mb-0">
            <thead><tr><th>Nguồn</th><th>RSS URL</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              @for (c of configs(); track c.id) {
                <tr>
                  <td class="font-weight-bold">{{ c.sourceName }}</td>
                  <td class="text-truncate" style="max-width:300px;"><small>{{ c.rssUrl }}</small></td>
                  <td>
                    <span class="badge" [class.badge-success]="c.enabled" [class.badge-secondary]="!c.enabled">
                      {{ c.enabled ? 'Bật' : 'Tắt' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-sm" [class.btn-warning]="c.enabled" [class.btn-success]="!c.enabled"
                            (click)="toggleConfig(c.id, !c.enabled)">
                      {{ c.enabled ? 'Tắt' : 'Bật' }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent logs -->
      <div class="card">
        <div class="card-header bg-dark text-white"><h5 class="m-0">Lịch sử crawl</h5></div>
        <div class="card-body p-0">
          <table class="table table-striped mb-0">
            <thead><tr><th>Nguồn</th><th>Bài mới</th><th>Lỗi</th><th>Trạng thái</th><th>Thời gian</th></tr></thead>
            <tbody>
              @for (log of logs(); track log.id) {
                <tr>
                  <td>{{ log.sourceName }}</td>
                  <td>{{ log.articlesFound }}</td>
                  <td>{{ log.errorCount }}</td>
                  <td><span class="badge" [class.badge-success]="log.status==='SUCCESS'"
                            [class.badge-danger]="log.status!=='SUCCESS'">{{ log.status }}</span></td>
                  <td>{{ log.createdAt | date:'dd/MM HH:mm:ss' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AdminCrawlComponent implements OnInit {
  configs = signal<any[]>([]);
  logs = signal<any[]>([]);
  crawling = signal(false);

  constructor(private adminService: AdminService) {}

  ngOnInit() { this.load(); }

  load() {
    this.adminService.getCrawlConfigs().subscribe(c => this.configs.set(c));
    this.adminService.getCrawlLogs().subscribe(l => this.logs.set(l));
  }

  triggerCrawl() {
    this.crawling.set(true);
    this.adminService.triggerCrawl().subscribe({
      next: () => { this.crawling.set(false); this.load(); },
      error: () => this.crawling.set(false)
    });
  }

  toggleConfig(id: number, enabled: boolean) {
    this.adminService.toggleCrawlConfig(id, enabled).subscribe(() => this.load());
  }
}
