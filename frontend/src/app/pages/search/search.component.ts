import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ArticleCardComponent } from '../../components/article-card/article-card.component';
import { ArticleService } from '../../services/article.service';
import { Article } from '../../models';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, SidebarComponent, ArticleCardComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="container-fluid mt-5 mb-3 pt-3">
      <div class="container">
        <div class="row">
          <div class="col-lg-8">
            <div class="section-title">
              <h4 class="m-0 text-uppercase font-weight-bold">Kết quả tìm kiếm: "{{ query() }}"</h4>
            </div>
            <div class="row">
              @for (article of articles(); track article.id) {
                <div class="col-lg-6">
                  <app-article-card [article]="article"></app-article-card>
                </div>
              } @empty {
                <div class="col-12">
                  <div class="bg-white p-4 text-center">
                    <p class="text-muted">Không tìm thấy kết quả nào.</p>
                  </div>
                </div>
              }
            </div>
            @if (hasMore()) {
              <div class="text-center mb-3">
                <button class="btn btn-primary" (click)="loadMore()">Xem thêm</button>
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
export class SearchComponent implements OnInit {
  query = signal('');
  articles = signal<Article[]>([]);
  hasMore = signal(false);
  private page = 0;

  constructor(
    private route: ActivatedRoute,
    private articleService: ArticleService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.query.set(params['q'] || '');
      this.page = 0;
      this.articles.set([]);
      if (this.query()) this.loadMore();
    });
  }

  loadMore() {
    this.articleService.search(this.query(), this.page, 10).subscribe(res => {
      this.articles.update(a => [...a, ...res.content]);
      this.hasMore.set(this.page < res.totalPages - 1);
      this.page++;
    });
  }
}
