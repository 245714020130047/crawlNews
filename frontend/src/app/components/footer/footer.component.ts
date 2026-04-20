import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { ArticleService } from '../../services/article.service';
import { Category, Article } from '../../models';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Footer -->
    <div class="container-fluid bg-dark pt-5 px-sm-3 px-md-5 mt-5">
      <div class="row py-4">
        <div class="col-lg-3 col-md-6 mb-5">
          <h5 class="mb-4 text-white text-uppercase font-weight-bold">Liên hệ</h5>
          <p class="font-weight-medium"><i class="fa fa-map-marker-alt mr-2"></i>Việt Nam</p>
          <p class="font-weight-medium"><i class="fa fa-envelope mr-2"></i>contact&#64;vnnews.com</p>
          <h6 class="mt-4 mb-3 text-white text-uppercase font-weight-bold">Theo dõi</h6>
          <div class="d-flex justify-content-start">
            <a class="btn btn-lg btn-secondary btn-lg-square mr-2" href="#"><i class="fab fa-facebook-f"></i></a>
            <a class="btn btn-lg btn-secondary btn-lg-square mr-2" href="#"><i class="fab fa-youtube"></i></a>
            <a class="btn btn-lg btn-secondary btn-lg-square" href="#"><i class="fab fa-twitter"></i></a>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-5">
          <h5 class="mb-4 text-white text-uppercase font-weight-bold">Tin phổ biến</h5>
          @for (article of popularArticles(); track article.id) {
            <div class="mb-3">
              <div class="mb-2">
                <a class="badge badge-primary text-uppercase font-weight-semi-bold p-1 mr-2"
                   [routerLink]="['/category', article.categorySlug]">{{ article.categoryName }}</a>
                <small class="text-body">{{ article.publishedAt | date:'dd/MM/yyyy' }}</small>
              </div>
              <a class="small text-body text-uppercase font-weight-medium"
                 [routerLink]="['/article', article.slug]">{{ article.title }}</a>
            </div>
          }
        </div>
        <div class="col-lg-3 col-md-6 mb-5">
          <h5 class="mb-4 text-white text-uppercase font-weight-bold">Chuyên mục</h5>
          <div class="m-n1">
            @for (cat of categories(); track cat.id) {
              <a [routerLink]="['/category', cat.slug]"
                 class="btn btn-sm btn-secondary m-1">{{ cat.name }}</a>
            }
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-5">
          <h5 class="mb-4 text-white text-uppercase font-weight-bold">Về VN News</h5>
          <p class="text-body">Trang tin tức tổng hợp từ nhiều nguồn uy tín tại Việt Nam, 
            sử dụng AI để tóm tắt nội dung giúp bạn đọc nhanh chóng nắm bắt thông tin.</p>
        </div>
      </div>
    </div>
    <div class="container-fluid py-4 px-sm-3 px-md-5" style="background: #111111;">
      <p class="m-0 text-center text-body">&copy; VN News {{ currentYear }}. Tất cả quyền được bảo lưu.</p>
    </div>
  `
})
export class FooterComponent {
  categories = signal<Category[]>([]);
  popularArticles = signal<Article[]>([]);
  currentYear = new Date().getFullYear();

  constructor(
    private categoryService: CategoryService,
    private articleService: ArticleService
  ) {
    this.categoryService.getAll().subscribe(cats => this.categories.set(cats));
    this.articleService.getTrending(0, 3).subscribe(res => this.popularArticles.set(res.content));
  }
}
