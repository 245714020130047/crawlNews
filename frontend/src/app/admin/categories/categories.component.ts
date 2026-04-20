import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { Category } from '../../models';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h3 class="font-weight-bold m-0">Quản lý chuyên mục</h3>
        <button class="btn btn-primary" (click)="showForm = !showForm">
          <i class="fas fa-plus mr-1"></i>Thêm mới
        </button>
      </div>

      @if (showForm) {
        <div class="card mb-3">
          <div class="card-body">
            <div class="row">
              <div class="col-md-4">
                <input type="text" class="form-control" placeholder="Tên chuyên mục" [(ngModel)]="newName">
              </div>
              <div class="col-md-4">
                <input type="text" class="form-control" placeholder="Slug" [(ngModel)]="newSlug">
              </div>
              <div class="col-md-4">
                <button class="btn btn-success" (click)="create()">Lưu</button>
              </div>
            </div>
          </div>
        </div>
      }

      <div class="card">
        <div class="card-body p-0">
          <table class="table table-hover mb-0">
            <thead class="bg-dark text-white">
              <tr><th>ID</th><th>Tên</th><th>Slug</th><th>Số bài</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              @for (cat of categories(); track cat.id) {
                <tr>
                  <td>{{ cat.id }}</td>
                  <td>{{ cat.name }}</td>
                  <td><code>{{ cat.slug }}</code></td>
                  <td>{{ cat.articleCount }}</td>
                  <td>
                    <button class="btn btn-sm btn-danger" (click)="delete(cat.id)">
                      <i class="fas fa-trash"></i>
                    </button>
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
export class AdminCategoriesComponent implements OnInit {
  categories = signal<Category[]>([]);
  showForm = false;
  newName = '';
  newSlug = '';

  constructor(private adminService: AdminService) {}

  ngOnInit() { this.load(); }

  load() {
    this.adminService.getCategories().subscribe(cats => this.categories.set(cats));
  }

  create() {
    if (!this.newName) return;
    this.adminService.createCategory({ name: this.newName, slug: this.newSlug }).subscribe(() => {
      this.newName = ''; this.newSlug = ''; this.showForm = false; this.load();
    });
  }

  delete(id: number) {
    if (confirm('Xóa chuyên mục này?')) {
      this.adminService.deleteCategory(id).subscribe(() => this.load());
    }
  }
}
