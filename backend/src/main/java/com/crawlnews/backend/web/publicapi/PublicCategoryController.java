package com.crawlnews.backend.web.publicapi;

import com.crawlnews.backend.domain.Category;
import com.crawlnews.backend.domain.NewsArticle;
import com.crawlnews.backend.service.ArticleService;
import com.crawlnews.backend.service.CategoryService;
import com.crawlnews.backend.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/categories")
@RequiredArgsConstructor
@Tag(name = "Public - Categories", description = "News categories")
public class PublicCategoryController {

    private final CategoryService categoryService;
    private final ArticleService articleService;

    @GetMapping
    @Operation(summary = "List all active categories")
    public ResponseEntity<ApiResponse<List<Category>>> listCategories() {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.findRootCategories()));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get articles for a category by slug")
    public ResponseEntity<ApiResponse<Page<NewsArticle>>> getCategoryArticles(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Category category = categoryService.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + slug));

        Page<NewsArticle> articles = articleService.findByCategory(category.getId(),
                PageRequest.of(page, Math.min(size, 100), Sort.by("publishedAt").descending()));

        return ResponseEntity.ok(ApiResponse.ok(articles));
    }
}
