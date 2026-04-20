import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ArticleService } from '../../services/article.service';
import { CategoryService } from '../../services/category.service';
import { Article, Category } from '../../models';
import { ArticleSmallComponent } from '../../components/article-small/article-small.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, ArticleSmallComponent],
  template: `
    <!-- Trending News -->
    <div class="mb-3">
      <div class="section-title mb-0">
        <h4 class="m-0 text-uppercase font-weight-bold">Tin nổi bật</h4>
      </div>
      <div class="bg-white border border-top-0 p-3">
        @for (article of trendingArticles(); track article.id) {
          <app-article-small [article]="article"></app-article-small>
        }
      </div>
    </div>

    <!-- Newsletter -->
    <div class="mb-3">
      <div class="section-title mb-0">
        <h4 class="m-0 text-uppercase font-weight-bold">Nhận tin mới</h4>
      </div>
      <div class="bg-white text-center border border-top-0 p-3">
        <p>Đăng ký nhận bản tin hàng ngày</p>
        <div class="input-group mb-2">
          <input type="text" class="form-control form-control-lg" placeholder="Email của bạn">
          <div class="input-group-append">
            <button class="btn btn-primary font-weight-bold px-3">Đăng ký</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tags (Categories) -->
    <div class="mb-3">
      <div class="section-title mb-0">
        <h4 class="m-0 text-uppercase font-weight-bold">Chuyên mục</h4>
      </div>
      <div class="bg-white border border-top-0 p-3">
        <div class="d-flex flex-wrap m-n1">
          @for (cat of categories(); track cat.id) {
            <a [routerLink]="['/category', cat.slug]"
               class="btn btn-sm btn-outline-secondary m-1">{{ cat.name }}</a>
          }
        </div>
      </div>
    </div>
  `
})
export class SidebarComponent {
  trendingArticles = signal<Article[]>([]);
  categories = signal<Category[]>([]);

  constructor(
    private articleService: ArticleService,
    private categoryService: CategoryService
  ) {
    this.articleService.getTrending(0, 5).subscribe(res => this.trendingArticles.set(res.content));
    this.categoryService.getAll().subscribe(cats => this.categories.set(cats));
  }
}
