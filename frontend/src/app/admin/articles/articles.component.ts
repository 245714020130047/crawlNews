import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { Article } from '../../models';

@Component({
  selector: 'app-admin-articles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h3 class="font-weight-bold m-0">Quản lý bài viết</h3>
        <div class="d-flex">
          <input type="text" class="form-control mr-2" placeholder="Tìm kiếm..." [(ngModel)]="searchQuery"
                 (keyup.enter)="search()">
          <button class="btn btn-primary" (click)="search()"><i class="fas fa-search"></i></button>
        </div>
      </div>

      <div class="card">
        <div class="card-body p-0">
          <table class="table table-hover mb-0">
            <thead class="bg-dark text-white">
              <tr><th>ID</th><th>Tiêu đề</th><th>Nguồn</th><th>Chuyên mục</th><th>Lượt xem</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              @for (a of articles(); track a.id) {
                <tr>
                  <td>{{ a.id }}</td>
                  <td class="text-truncate" style="max-width: 300px;">{{ a.title }}</td>
                  <td><span class="badge badge-info">{{ a.sourceName }}</span></td>
                  <td>{{ a.categoryName }}</td>
                  <td>{{ a.viewCount }}</td>
                  <td>
                    <button class="btn btn-sm btn-danger" (click)="delete(a.id)">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="d-flex justify-content-between mt-3">
        <span>Trang {{ page + 1 }} / {{ totalPages() }}</span>
        <div>
          <button class="btn btn-sm btn-outline-dark mr-2" [disabled]="page === 0" (click)="page = page - 1; load()">Trước</button>
          <button class="btn btn-sm btn-outline-dark" [disabled]="page >= totalPages() - 1" (click)="page = page + 1; load()">Sau</button>
        </div>
      </div>
    </div>
  `
})
export class AdminArticlesComponent implements OnInit {
  articles = signal<Article[]>([]);
  totalPages = signal(1);
  page = 0;
  searchQuery = '';

  constructor(private adminService: AdminService) {}

  ngOnInit() { this.load(); }

  load() {
    this.adminService.getArticles(this.page, 20, this.searchQuery).subscribe(res => {
      this.articles.set(res.content);
      this.totalPages.set(res.totalPages);
    });
  }

  search() { this.page = 0; this.load(); }

  delete(id: number) {
    if (confirm('Xóa bài viết này?')) {
      this.adminService.deleteArticle(id).subscribe(() => this.load());
    }
  }
}
