package com.vnnews.controller;

import com.vnnews.dto.ArticleDto;
import com.vnnews.service.ArticleService;
import com.vnnews.service.ArticleViewService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
public class ArticleController {

    private final ArticleService articleService;
    private final ArticleViewService articleViewService;

    @GetMapping
    public ResponseEntity<Page<ArticleDto>> getLatest(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(articleService.getLatestArticles(
                PageRequest.of(page, size, Sort.by("publishedAt").descending())));
    }

    @GetMapping("/category/{slug}")
    public ResponseEntity<Page<ArticleDto>> getByCategory(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(articleService.getArticlesByCategory(slug,
                PageRequest.of(page, size, Sort.by("publishedAt").descending())));
    }

    @GetMapping("/trending")
    public ResponseEntity<Page<ArticleDto>> getTrending(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(articleService.getTrendingArticles(PageRequest.of(page, size)));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ArticleDto>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(articleService.searchArticles(q, PageRequest.of(page, size)));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ArticleDto> getBySlug(
            @PathVariable String slug,
            HttpServletRequest request,
            Authentication authentication) {
        return articleService.getArticleBySlug(slug)
                .map(article -> {
                    String username = authentication != null ? authentication.getName() : null;
                    articleViewService.recordView(article.getId(), request, username);
                    return ResponseEntity.ok(article);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
