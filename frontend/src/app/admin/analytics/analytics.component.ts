import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <h3 class="font-weight-bold mb-4">Thống kê truy cập</h3>

      <div class="row mb-4">
        <div class="col-md-4">
          <div class="card text-center">
            <div class="card-body">
              <h5 class="text-muted">Hôm nay</h5>
              <h2 class="font-weight-bold text-primary">{{ stats()?.todayViews || 0 }}</h2>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card text-center">
            <div class="card-body">
              <h5 class="text-muted">Tuần này</h5>
              <h2 class="font-weight-bold text-success">{{ stats()?.weekViews || 0 }}</h2>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card text-center">
            <div class="card-body">
              <h5 class="text-muted">Tháng này</h5>
              <h2 class="font-weight-bold text-danger">{{ stats()?.monthViews || 0 }}</h2>
            </div>
          </div>
        </div>
      </div>

      <!-- Top articles -->
      <div class="card mb-3">
        <div class="card-header bg-dark text-white"><h5 class="m-0">Bài viết xem nhiều nhất</h5></div>
        <div class="card-body p-0">
          <table class="table mb-0">
            <thead><tr><th>#</th><th>Tiêu đề</th><th>Lượt xem</th></tr></thead>
            <tbody>
              @for (a of topArticles(); track a.id; let i = $index) {
                <tr>
                  <td>{{ i + 1 }}</td>
                  <td>{{ a.title }}</td>
                  <td><span class="badge badge-primary">{{ a.viewCount }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- IP Blacklist -->
      <div class="card">
        <div class="card-header bg-dark text-white d-flex justify-content-between">
          <h5 class="m-0">IP Blacklist</h5>
        </div>
        <div class="card-body p-0">
          <table class="table mb-0">
            <thead><tr><th>IP</th><th>Lý do</th><th>Ngày chặn</th><th>Thao tác</th></tr></thead>
            <tbody>
              @for (ip of blacklist(); track ip.id) {
                <tr>
                  <td><code>{{ ip.ipAddress }}</code></td>
                  <td>{{ ip.reason }}</td>
                  <td>{{ ip.createdAt | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <button class="btn btn-sm btn-success" (click)="unblock(ip.id)">Bỏ chặn</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AdminAnalyticsComponent implements OnInit {
  stats = signal<any>(null);
  topArticles = signal<any[]>([]);
  blacklist = signal<any[]>([]);

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.getAnalytics().subscribe(s => this.stats.set(s));
    this.adminService.getTopArticles().subscribe(a => this.topArticles.set(a));
    this.adminService.getIpBlacklist().subscribe(b => this.blacklist.set(b));
  }

  unblock(id: number) {
    this.adminService.removeFromBlacklist(id).subscribe(() =>
      this.adminService.getIpBlacklist().subscribe(b => this.blacklist.set(b))
    );
  }
}
