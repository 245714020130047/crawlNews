import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ArticleCardComponent } from '../../components/article-card/article-card.component';
import { ArticleSmallComponent } from '../../components/article-small/article-small.component';
import { ArticleService } from '../../services/article.service';
import { CategoryService } from '../../services/category.service';
import { Article, Category } from '../../models';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [
    CommonModule, RouterLink, NavbarComponent, FooterComponent,
    SidebarComponent, ArticleCardComponent, ArticleSmallComponent
  ],
  template: `
    <app-navbar></app-navbar>

    <div class="container-fluid mt-5 mb-3 pt-3">
      <div class="container">
        <div class="row">
          <div class="col-lg-8">
            <div class="section-title">
              <h4 class="m-0 text-uppercase font-weight-bold">{{ category()?.name || 'Chuyên mục' }}</h4>
            </div>
            <div class="row">
              @for (article of articles(); track article.id; let i = $index) {
                @if (i < 2) {
                  <div class="col-lg-6">
                    <app-article-card [article]="article"></app-article-card>
                  </div>
                } @else {
                  <div class="col-lg-6">
                    <app-article-small [article]="article"></app-article-small>
                  </div>
                }
              }
            </div>
            @if (hasMore()) {
              <div class="text-center mb-3">
                <button class="btn btn-primary font-weight-bold py-2 px-4" (click)="loadMore()">Xem thêm</button>
              </div>
            }
          </div>
          <div class="col-lg-4">
            <app-sidebar></app-sidebar>
          </div>
        </div>
      </div>
    </div>

    <app-footer></app-footer>
  `
})
export class CategoryComponent implements OnInit {
  articles = signal<Article[]>([]);
  category = signal<Category | null>(null);
  hasMore = signal(true);
  private page = 0;
  private slug = '';

  constructor(
    private route: ActivatedRoute,
    private articleService: ArticleService,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.slug = params['slug'];
      this.page = 0;
      this.articles.set([]);
      this.categoryService.getBySlug(this.slug).subscribe(cat => this.category.set(cat));
      this.loadMore();
    });
  }

  loadMore() {
    this.articleService.getByCategory(this.slug, this.page, 10).subscribe(res => {
      this.articles.update(a => [...a, ...res.content]);
      this.hasMore.set(this.page < res.totalPages - 1);
      this.page++;
    });
  }
}
