package com.crawlnews.backend.web.admin;

import com.crawlnews.backend.domain.ArticleStatus;
import com.crawlnews.backend.domain.NewsArticle;
import com.crawlnews.backend.service.ArticleService;
import com.crawlnews.backend.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/articles")
@RequiredArgsConstructor
@Tag(name = "Admin - Articles", description = "Admin article management")
public class AdminArticleController {

    private final ArticleService articleService;

    @GetMapping
    @Operation(summary = "List all articles (admin view)")
    public ResponseEntity<ApiResponse<Page<NewsArticle>>> listAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(articleService.findAll(PageRequest.of(page, size))));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get article by ID")
    public ResponseEntity<ApiResponse<NewsArticle>> getById(@PathVariable Long id) {
        return articleService.findById(id)
                .map(a -> ResponseEntity.ok(ApiResponse.ok(a)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update article status")
    public ResponseEntity<ApiResponse<NewsArticle>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        ArticleStatus status = ArticleStatus.valueOf(body.get("status").toUpperCase());
        return ResponseEntity.ok(ApiResponse.ok(articleService.updateStatus(id, status), "Status updated"));
    }
}
