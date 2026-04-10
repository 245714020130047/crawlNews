package com.crawlnews.backend.web.publicapi;

import com.crawlnews.backend.domain.NewsArticle;
import com.crawlnews.backend.service.ArticleService;
import com.crawlnews.backend.service.SummaryService;
import com.crawlnews.backend.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/public/articles")
@RequiredArgsConstructor
@Tag(name = "Public - Articles", description = "News article endpoints")
public class ArticleController {

    private final ArticleService articleService;
    private final SummaryService summaryService;

    @GetMapping
    @Operation(summary = "List articles with pagination, optionally filtered by source or category")
    public ResponseEntity<ApiResponse<Page<NewsArticle>>> listArticles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long sourceId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String q) {

        PageRequest pageable = PageRequest.of(page, Math.min(size, 100), Sort.by("publishedAt").descending());
        Page<NewsArticle> articles;

        if (q != null && !q.isBlank()) {
            articles = articleService.search(q.trim(), pageable);
        } else if (sourceId != null) {
            articles = articleService.findBySource(sourceId, pageable);
        } else if (categoryId != null) {
            articles = articleService.findByCategory(categoryId, pageable);
        } else {
            articles = articleService.findActive(pageable);
        }

        return ResponseEntity.ok(ApiResponse.ok(articles));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get article by ID or slug")
    public ResponseEntity<ApiResponse<NewsArticle>> getArticle(@PathVariable String id) {
        Optional<NewsArticle> article;
        try {
            long numId = Long.parseLong(id);
            article = articleService.findById(numId);
        } catch (NumberFormatException e) {
            article = articleService.findBySlug(id);
        }

        return article
                .map(a -> {
                    articleService.incrementViewCount(a.getId());
                    return ResponseEntity.ok(ApiResponse.ok(a));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/summary")
    @Operation(summary = "Get AI summary for an article")
    public ResponseEntity<ApiResponse<Object>> getArticleSummary(@PathVariable Long id) {
        return summaryService.findSummaryByArticleId(id)
                .map(s -> ResponseEntity.ok(ApiResponse.ok((Object) s)))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.ok(null, "No summary available")));
    }

    @PostMapping("/{id}/summarize")
    @Operation(summary = "Trigger manual AI summarize for an article")
    public ResponseEntity<ApiResponse<Object>> triggerSummarize(@PathVariable Long id) {
        NewsArticle article = articleService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Article not found: " + id));
        var job = summaryService.enqueue(article,
                com.crawlnews.backend.domain.TriggerMode.MANUAL, "public-user");
        log.info("Manual summarize triggered: articleId={} jobId={}", id, job.getId());
        return ResponseEntity.ok(ApiResponse.ok(job, "Summary job created"));
    }
}
