import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { Category } from '../../models/api.models';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container py-6">
      <div class="page-header flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Quản lý chuyên mục</h1>
          <p class="text-gray-500 mt-1">Cấu trúc 2 cấp chuyên mục</p>
        </div>
        <button (click)="openAdd()"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          + Thêm chuyên mục
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="mt-6 flex flex-col gap-2">
        <div *ngFor="let i of [1,2,3,4,5,6]" class="skeleton h-12 w-full rounded-xl"></div>
      </div>

      <!-- Tree table -->
      <div *ngIf="!loading" class="mt-6 bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th class="px-5 py-3 text-left">Tên</th>
              <th class="px-5 py-3 text-left">Slug</th>
              <th class="px-5 py-3 text-center">Cấp</th>
              <th class="px-5 py-3 text-center">Trạng thái</th>
              <th class="px-5 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let cat of topLevel">
              <!-- Parent row -->
              <tr class="border-t border-gray-50 bg-gray-50/50">
                <td class="px-5 py-3 font-medium text-gray-900">
                  <span *ngIf="cat.icon" class="mr-1">{{ cat.icon }}</span>{{ cat.name }}
                </td>
                <td class="px-5 py-3 text-gray-500 font-mono text-xs">{{ cat.slug }}</td>
                <td class="px-5 py-3 text-center text-xs text-gray-500">Cấp 1</td>
                <td class="px-5 py-3 text-center">
                  <span [class]="cat.isActive
                      ? 'inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs'
                      : 'inline-block px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs'">
                    {{ cat.isActive ? 'Hiển thị' : 'Ẩn' }}
                  </span>
                </td>
                <td class="px-5 py-3">
                  <div class="flex items-center justify-center gap-2">
                    <button (click)="openEdit(cat)"
                            class="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100">
                      Sửa
                    </button>
                    <button (click)="toggle(cat)"
                            class="px-2 py-1 text-xs border rounded"
                            [class]="cat.isActive
                                ? 'border-orange-300 text-orange-600 hover:bg-orange-50'
                                : 'border-green-300 text-green-600 hover:bg-green-50'">
                      {{ cat.isActive ? 'Ẩn' : 'Hiện' }}
                    </button>
                    <button (click)="openAddChild(cat)"
                            class="px-2 py-1 text-xs border border-blue-300 text-blue-600 rounded hover:bg-blue-50">
                      + Con
                    </button>
                  </div>
                </td>
              </tr>
              <!-- Children rows -->
              <tr *ngFor="let child of getChildren(cat.id)"
                  class="border-t border-gray-50">
                <td class="px-5 py-3 pl-10 text-gray-700">
                  <span class="text-gray-400 mr-1">└</span>
                  <span *ngIf="child.icon" class="mr-1">{{ child.icon }}</span>{{ child.name }}
                </td>
                <td class="px-5 py-3 text-gray-400 font-mono text-xs">{{ child.slug }}</td>
                <td class="px-5 py-3 text-center text-xs text-gray-400">Cấp 2</td>
                <td class="px-5 py-3 text-center">
                  <span [class]="child.isActive
                      ? 'inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs'
                      : 'inline-block px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs'">
                    {{ child.isActive ? 'Hiển thị' : 'Ẩn' }}
                  </span>
                </td>
                <td class="px-5 py-3">
                  <div class="flex items-center justify-center gap-2">
                    <button (click)="openEdit(child)"
                            class="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100">
                      Sửa
                    </button>
                    <button (click)="toggle(child)"
                            class="px-2 py-1 text-xs border rounded"
                            [class]="child.isActive
                                ? 'border-orange-300 text-orange-600 hover:bg-orange-50'
                                : 'border-green-300 text-green-600 hover:bg-green-50'">
                      {{ child.isActive ? 'Ẩn' : 'Hiện' }}
                    </button>
                  </div>
                </td>
              </tr>
            </ng-container>
          </tbody>
        </table>
      </div>

      <!-- Add/Edit Modal -->
      <div *ngIf="showForm"
           class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h2 class="text-lg font-semibold mb-4">{{ editCategory ? 'Sửa chuyên mục' : 'Thêm chuyên mục' }}</h2>
          <div class="flex flex-col gap-4">
            <div>
              <label class="block text-sm text-gray-700 mb-1">Tên chuyên mục *</label>
              <input type="text" [(ngModel)]="form.name" required
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Slug *</label>
              <input type="text" [(ngModel)]="form.slug" required
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Icon (emoji)</label>
              <input type="text" [(ngModel)]="form.icon" placeholder="📰"
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Mô tả</label>
              <textarea [(ngModel)]="form.description" rows="2"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Chuyên mục cha</label>
              <select [(ngModel)]="form.parentId"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option [ngValue]="null">Không có (cấp 1)</option>
                <option *ngFor="let p of topLevel" [ngValue]="p.id">{{ p.name }}</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button (click)="closeForm()"
                    class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Hủy
            </button>
            <button (click)="save()"
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
export class AdminCategoriesComponent implements OnInit {
  categories: Category[] = [];
  loading = true;
  showForm = false;
  saving = false;
  editCategory: Category | null = null;
  form: Partial<Category & { parentId: number | null }> = {};

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.categoryService.adminGetAll().subscribe({
      next: (cats) => { this.categories = cats; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get topLevel(): Category[] {
    return this.categories.filter(c => !c.parentId);
  }

  getChildren(parentId: number): Category[] {
    return this.categories.filter(c => c.parentId === parentId);
  }

  openAdd(): void {
    this.editCategory = null;
    this.form = { parentId: null };
    this.showForm = true;
  }

  openAddChild(parent: Category): void {
    this.editCategory = null;
    this.form = { parentId: parent.id };
    this.showForm = true;
  }

  openEdit(cat: Category): void {
    this.editCategory = cat;
    this.form = { ...cat, parentId: cat.parentId ?? null };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.form = {};
    this.editCategory = null;
  }

  save(): void {
    if (!this.form.name || !this.form.slug) return;
    this.saving = true;
    const op = this.editCategory
      ? this.categoryService.adminUpdate(this.editCategory.id, this.form)
      : this.categoryService.adminCreate(this.form);
    op.subscribe({
      next: () => { this.saving = false; this.closeForm(); this.load(); },
      error: () => { this.saving = false; }
    });
  }

  toggle(cat: Category): void {
    this.categoryService.adminToggle(cat.id).subscribe(() => this.load());
  }
}
