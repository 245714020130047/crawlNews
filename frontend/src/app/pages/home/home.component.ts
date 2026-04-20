import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ArticleCardComponent } from '../../components/article-card/article-card.component';
import { ArticleSmallComponent } from '../../components/article-small/article-small.component';
import { ArticleService } from '../../services/article.service';
import { Article } from '../../models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterLink, NavbarComponent, FooterComponent,
    SidebarComponent, ArticleCardComponent, ArticleSmallComponent
  ],
  template: `
    <app-navbar></app-navbar>

    <!-- Main News Slider -->
    <div class="container-fluid" *ngIf="mainArticles().length">
      <div class="row">
        <div class="col-lg-7 px-0">
          @if (mainArticles()[0]; as article) {
            <div class="position-relative overflow-hidden" style="height: 500px;">
              <img class="img-fluid h-100 w-100" [src]="articleService.getImageUrl(article.thumbnailUrl)"
                   style="object-fit: cover;" [alt]="article.title">
              <div class="overlay">
                <div class="mb-2">
                  <a class="badge badge-primary text-uppercase font-weight-semi-bold p-2 mr-2"
                     [routerLink]="['/category', article.categorySlug]">{{ article.categoryName }}</a>
                  <span class="text-white">{{ article.publishedAt | date:'dd/MM/yyyy' }}</span>
                </div>
                <a class="h2 m-0 text-white text-uppercase font-weight-bold"
                   [routerLink]="['/article', article.slug]">{{ article.title }}</a>
              </div>
            </div>
          }
        </div>
        <div class="col-lg-5 px-0">
          <div class="row mx-0">
            @for (article of mainArticles().slice(1, 5); track article.id) {
              <div class="col-md-6 px-0">
                <div class="position-relative overflow-hidden" style="height: 250px;">
                  <img class="img-fluid w-100 h-100" [src]="articleService.getImageUrl(article.thumbnailUrl)"
                       style="object-fit: cover;" [alt]="article.title">
                  <div class="overlay">
                    <div class="mb-2">
                      <a class="badge badge-primary text-uppercase font-weight-semi-bold p-2 mr-2"
                         [routerLink]="['/category', article.categorySlug]">{{ article.categoryName }}</a>
                      <small class="text-white">{{ article.publishedAt | date:'dd/MM' }}</small>
                    </div>
                    <a class="h6 m-0 text-white text-uppercase font-weight-semi-bold"
                       [routerLink]="['/article', article.slug]">{{ article.title | slice:0:60 }}...</a>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>

    <!-- Breaking News -->
    <div class="container-fluid bg-dark py-3 mb-3" *ngIf="breakingNews().length">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-12">
            <div class="d-flex justify-content-between">
              <div class="bg-primary text-dark text-center font-weight-medium py-2" style="width: 170px;">Tin nóng</div>
              <div class="d-inline-flex align-items-center ml-3 overflow-hidden" style="width: calc(100% - 170px);">
                <div class="text-truncate">
                  <a class="text-white text-uppercase font-weight-semi-bold"
                     [routerLink]="['/article', breakingNews()[breakingIndex()].slug]">
                    {{ breakingNews()[breakingIndex()].title }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Featured News -->
    <div class="container-fluid pt-5 mb-3" *ngIf="featuredArticles().length">
      <div class="container">
        <div class="section-title">
          <h4 class="m-0 text-uppercase font-weight-bold">Tin nổi bật</h4>
        </div>
        <div class="row">
          @for (article of featuredArticles(); track article.id) {
            <div class="col-lg-3 col-md-6 mb-3">
              <div class="position-relative overflow-hidden" style="height: 300px;">
                <img class="img-fluid h-100 w-100" [src]="articleService.getImageUrl(article.thumbnailUrl)"
                     style="object-fit: cover;" [alt]="article.title">
                <div class="overlay">
                  <div class="mb-2">
                    <a class="badge badge-primary text-uppercase font-weight-semi-bold p-2 mr-2"
                       [routerLink]="['/category', article.categorySlug]">{{ article.categoryName }}</a>
                    <small class="text-white">{{ article.publishedAt | date:'dd/MM' }}</small>
                  </div>
                  <a class="h6 m-0 text-white text-uppercase font-weight-semi-bold"
                     [routerLink]="['/article', article.slug]">{{ article.title | slice:0:60 }}...</a>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Latest News + Sidebar -->
    <div class="container-fluid">
      <div class="container">
        <div class="row">
          <div class="col-lg-8">
            <div class="row">
              <div class="col-12">
                <div class="section-title">
                  <h4 class="m-0 text-uppercase font-weight-bold">Tin mới nhất</h4>
                </div>
              </div>
              @for (article of latestArticles(); track article.id; let i = $index) {
                @if (i < 4) {
                  <div class="col-lg-6">
                    <app-article-card [article]="article"></app-article-card>
                  </div>
                } @else {
                  <div class="col-lg-6">
                    <app-article-small [article]="article"></app-article-small>
                  </div>
                }
              }

              <!-- Load more -->
              @if (hasMore()) {
                <div class="col-12 text-center mb-3">
                  <button class="btn btn-primary font-weight-bold py-2 px-4" (click)="loadMore()">
                    Xem thêm
                  </button>
                </div>
              }
            </div>
          </div>

          <div class="col-lg-4">
            <app-sidebar></app-sidebar>
          </div>
        </div>
      </div>
    </div>

    <!-- Back to Top -->
    <a href="#" class="btn btn-primary btn-square back-to-top" *ngIf="showBackToTop()"
       (click)="$event.preventDefault(); scrollToTop()">
      <i class="fa fa-arrow-up"></i>
    </a>

    <app-footer></app-footer>
  `
})
export class HomeComponent implements OnInit {
  mainArticles = signal<Article[]>([]);
  breakingNews = signal<Article[]>([]);
  featuredArticles = signal<Article[]>([]);
  latestArticles = signal<Article[]>([]);
  breakingIndex = signal(0);
  hasMore = signal(true);
  showBackToTop = signal(false);
  private page = 0;

  constructor(public articleService: ArticleService) {}

  ngOnInit() {
    // Load main slider articles
    this.articleService.getLatest(0, 5).subscribe(res => {
      this.mainArticles.set(res.content);
    });

    // Load trending for breaking news
    this.articleService.getTrending(0, 5).subscribe(res => {
      this.breakingNews.set(res.content);
      // Rotate breaking news
      setInterval(() => {
        const current = this.breakingIndex();
        const total = this.breakingNews().length;
        if (total > 0) {
          this.breakingIndex.set((current + 1) % total);
        }
      }, 4000);
    });

    // Load featured (different from main)
    this.articleService.getLatest(1, 4).subscribe(res => {
      this.featuredArticles.set(res.content);
    });

    // Load latest
    this.loadMore();

    // Back to top
    window.addEventListener('scroll', () => {
      this.showBackToTop.set(window.scrollY > 300);
    });
  }

  loadMore() {
    this.articleService.getLatest(this.page, 8).subscribe(res => {
      this.latestArticles.update(articles => [...articles, ...res.content]);
      this.hasMore.set(this.page < res.totalPages - 1);
      this.page++;
    });
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
