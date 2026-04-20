import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Article } from '../../models';
import { ArticleService } from '../../services/article.service';

@Component({
  selector: 'app-article-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="position-relative mb-3">
      <img class="img-fluid w-100" [src]="articleService.getImageUrl(article.thumbnailUrl)"
           [alt]="article.title" style="object-fit: cover; height: 250px;">
      <div class="bg-white border border-top-0 p-4">
        <div class="mb-2">
          <a class="badge badge-primary text-uppercase font-weight-semi-bold p-2 mr-2"
             [routerLink]="['/category', article.categorySlug]">{{ article.categoryName }}</a>
          <small class="text-body">{{ article.publishedAt | date:'dd/MM/yyyy' }}</small>
        </div>
        <a class="h4 d-block mb-3 text-secondary text-uppercase font-weight-bold"
           [routerLink]="['/article', article.slug]">{{ article.title }}</a>
        @if (article.summary) {
          <p class="m-0 text-muted small">{{ article.summary | slice:0:120 }}...</p>
        }
      </div>
      <div class="d-flex justify-content-between bg-white border border-top-0 p-4">
        <div class="d-flex align-items-center">
          <span class="badge badge-light">{{ article.sourceName }}</span>
        </div>
        <div class="d-flex align-items-center">
          <small class="ml-3"><i class="far fa-eye mr-2"></i>{{ article.viewCount }}</small>
        </div>
      </div>
    </div>
  `
})
export class ArticleCardComponent {
  @Input() article!: Article;

  constructor(public articleService: ArticleService) {}
}
