import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../models/api.models';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container py-6">
      <div class="page-header">
        <h1 class="text-2xl font-bold text-gray-900">Chuyên mục</h1>
        <p class="text-gray-500 mt-1">Duyệt tin tức theo chuyên mục</p>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div *ngFor="let i of [1,2,3,4,5,6,7,8]"
             class="skeleton h-24 rounded-xl"></div>
      </div>

      <!-- Category grid -->
      <div *ngIf="!loading" class="mt-6">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <a *ngFor="let cat of topLevel"
             [routerLink]="['/categories', cat.slug]"
             class="no-underline bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all group">
            <div class="text-3xl mb-2">{{ cat.icon || '📰' }}</div>
            <h3 class="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {{ cat.name }}
            </h3>
            <p *ngIf="cat.description"
               class="text-xs text-gray-400 mt-1 line-clamp-2">{{ cat.description }}</p>

            <!-- Sub-categories -->
            <div *ngIf="getChildren(cat.id).length > 0"
                 class="mt-3 flex flex-wrap gap-1">
              <span *ngFor="let child of getChildren(cat.id)"
                    class="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">
                {{ child.name }}
              </span>
            </div>
          </a>
        </div>
      </div>
    </div>
  `
})
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];
  loading = true;

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get topLevel(): Category[] {
    return this.categories.filter(c => !c.parentId);
  }

  getChildren(parentId: number): Category[] {
    return this.categories.filter(c => c.parentId === parentId);
  }
}
