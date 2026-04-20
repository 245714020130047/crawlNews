import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Article } from '../../models';
import { ArticleService } from '../../services/article.service';

@Component({
  selector: 'app-article-small',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="d-flex align-items-center bg-white mb-3" style="height: 110px;">
      <img class="img-fluid" [src]="articleService.getImageUrl(article.thumbnailUrl)"
           [alt]="article.title" style="width: 110px; height: 110px; object-fit: cover;">
      <div class="w-100 h-100 px-3 d-flex flex-column justify-content-center border border-left-0">
        <div class="mb-2">
          <a class="badge badge-primary text-uppercase font-weight-semi-bold p-1 mr-2"
             [routerLink]="['/category', article.categorySlug]">{{ article.categoryName }}</a>
          <small class="text-body">{{ article.publishedAt | date:'dd/MM' }}</small>
        </div>
        <a class="h6 m-0 text-secondary text-uppercase font-weight-bold"
           [routerLink]="['/article', article.slug]">{{ article.title | slice:0:60 }}...</a>
      </div>
    </div>
  `
})
export class ArticleSmallComponent {
  @Input() article!: Article;

  constructor(public articleService: ArticleService) {}
}
