import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ArticleService } from '../../services/article.service';
import { AuthService } from '../../services/auth.service';
import { Article } from '../../models';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent, SidebarComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="container-fluid mt-5 mb-3 pt-3">
      <div class="container">
        <div class="row">
          <div class="col-lg-8">
            @if (article(); as a) {
              <!-- News Detail -->
              <div class="position-relative mb-3">
                <img class="img-fluid w-100" [src]="articleService.getImageUrl(a.thumbnailUrl)"
                     [alt]="a.title" style="object-fit: cover;">
                <div class="bg-white border border-top-0 p-4">
                  <div class="mb-3">
                    <a class="badge badge-primary text-uppercase font-weight-semi-bold p-2 mr-2"
                       [routerLink]="['/category', a.categorySlug]">{{ a.categoryName }}</a>
                    <span class="text-body">{{ a.publishedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                    <span class="badge badge-light ml-2">{{ a.sourceName }}</span>
                  </div>
                  <h1 class="mb-3 text-secondary text-uppercase font-weight-bold">{{ a.title }}</h1>

                  <!-- AI Summary -->
                  @if (a.summary) {
                    <div class="alert alert-warning mb-3">
                      <h5 class="font-weight-bold"><i class="fas fa-robot mr-2"></i>Tóm tắt bằng AI</h5>
                      <p class="mb-0">{{ a.summary }}</p>
                    </div>
                  }

                  <!-- Summarize button for USER/ADMIN -->
                  @if (authService.isLoggedIn() && !a.summary) {
                    <button class="btn btn-warning mb-3" (click)="onSummarize()" [disabled]="summarizing()">
                      <i class="fas fa-robot mr-2"></i>
                      {{ summarizing() ? 'Đang tóm tắt...' : 'Tóm tắt bằng AI' }}
                    </button>
                  }

                  <div [innerHTML]="a.content"></div>
                </div>
                <div class="d-flex justify-content-between bg-white border border-top-0 p-4">
                  <div class="d-flex align-items-center">
                    <span class="badge badge-light">{{ a.sourceName }}</span>
                    <a class="ml-3 text-muted small" [href]="a.sourceUrl" target="_blank" rel="noopener">
                      <i class="fas fa-external-link-alt mr-1"></i>Nguồn gốc
                    </a>
                  </div>
                  <div class="d-flex align-items-center">
                    <span class="ml-3"><i class="far fa-eye mr-2"></i>{{ a.viewCount }}</span>
                  </div>
                </div>
              </div>
            } @else {
              <div class="text-center p-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="sr-only">Đang tải...</span>
                </div>
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
export class ArticleDetailComponent implements OnInit {
  article = signal<Article | null>(null);
  summarizing = signal(false);

  constructor(
    private route: ActivatedRoute,
    public articleService: ArticleService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.articleService.getBySlug(params['slug']).subscribe(article => {
        this.article.set(article);
      });
    });
  }

  onSummarize() {
    const a = this.article();
    if (!a) return;
    this.summarizing.set(true);
    this.articleService.summarize(a.id).subscribe({
      next: (updated) => {
        this.article.set(updated);
        this.summarizing.set(false);
      },
      error: () => this.summarizing.set(false)
    });
  }
}
