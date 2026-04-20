import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { DashboardData } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-4">
      <h3 class="font-weight-bold mb-4">Dashboard</h3>
      @if (data(); as d) {
        <div class="row">
          <div class="col-md-3 mb-3">
            <div class="card bg-primary text-white">
              <div class="card-body">
                <h5>Bài viết</h5>
                <h2 class="font-weight-bold">{{ d.totalArticles }}</h2>
              </div>
            </div>
          </div>
          <div class="col-md-3 mb-3">
            <div class="card bg-secondary text-white">
              <div class="card-body">
                <h5>Chuyên mục</h5>
                <h2 class="font-weight-bold">{{ d.totalCategories }}</h2>
              </div>
            </div>
          </div>
          <div class="col-md-3 mb-3">
            <div class="card bg-success text-white">
              <div class="card-body">
                <h5>Người dùng</h5>
                <h2 class="font-weight-bold">{{ d.totalUsers }}</h2>
              </div>
            </div>
          </div>
          <div class="col-md-3 mb-3">
            <div class="card bg-danger text-white">
              <div class="card-body">
                <h5>Lượt xem hôm nay</h5>
                <h2 class="font-weight-bold">{{ d.todayViews }}</h2>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent crawls -->
        <div class="card mt-3">
          <div class="card-header bg-dark text-white">
            <h5 class="m-0">Lịch sử crawl gần đây</h5>
          </div>
          <div class="card-body p-0">
            <table class="table table-striped mb-0">
              <thead><tr>
                <th>Nguồn</th><th>Bài mới</th><th>Trạng thái</th><th>Thời gian</th>
              </tr></thead>
              <tbody>
                @for (log of d.recentCrawlLogs; track log.id) {
                  <tr>
                    <td>{{ log.sourceName }}</td>
                    <td>{{ log.articlesFound }}</td>
                    <td><span class="badge" [class.badge-success]="log.status === 'SUCCESS'"
                              [class.badge-danger]="log.status !== 'SUCCESS'">{{ log.status }}</span></td>
                    <td>{{ log.createdAt | date:'dd/MM HH:mm' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  data = signal<DashboardData | null>(null);

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.getDashboard().subscribe(d => this.data.set(d));
  }
}
