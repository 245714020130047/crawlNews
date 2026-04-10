package com.crawlnews.backend.web.admin;

import com.crawlnews.backend.crawler.CrawlerScheduler;
import com.crawlnews.backend.domain.NewsSource;
import com.crawlnews.backend.service.NewsSourceService;
import com.crawlnews.backend.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/admin/sources")
@RequiredArgsConstructor
@Tag(name = "Admin - Sources", description = "Manage news sources")
public class AdminSourceController {

    private final NewsSourceService newsSourceService;
    private final CrawlerScheduler crawlerScheduler;

    @GetMapping
    @Operation(summary = "List all sources")
    public ResponseEntity<ApiResponse<List<NewsSource>>> listSources() {
        return ResponseEntity.ok(ApiResponse.ok(newsSourceService.findAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get source by ID")
    public ResponseEntity<ApiResponse<NewsSource>> getSource(@PathVariable Long id) {
        return newsSourceService.findById(id)
                .map(s -> ResponseEntity.ok(ApiResponse.ok(s)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Create new source")
    public ResponseEntity<ApiResponse<NewsSource>> createSource(@RequestBody NewsSource source) {
        return ResponseEntity.ok(ApiResponse.ok(newsSourceService.create(source), "Source created"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a source")
    public ResponseEntity<ApiResponse<NewsSource>> updateSource(@PathVariable Long id, @RequestBody NewsSource source) {
        return ResponseEntity.ok(ApiResponse.ok(newsSourceService.update(id, source), "Source updated"));
    }

    @PostMapping("/{id}/enable")
    @Operation(summary = "Enable a source")
    public ResponseEntity<ApiResponse<Void>> enableSource(@PathVariable Long id) {
        newsSourceService.enable(id);
        log.info("Source enabled via admin API: id={}", id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Source enabled"));
    }

    @PostMapping("/{id}/disable")
    @Operation(summary = "Disable a source")
    public ResponseEntity<ApiResponse<Void>> disableSource(@PathVariable Long id) {
        newsSourceService.disable(id);
        log.info("Source disabled via admin API: id={}", id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Source disabled"));
    }

    @PostMapping("/{id}/crawl")
    @Operation(summary = "Trigger manual crawl for a source")
    public ResponseEntity<ApiResponse<Void>> triggerCrawl(@PathVariable Long id) {
        log.info("Manual crawl triggered via admin API: sourceId={}", id);
        crawlerScheduler.triggerSource(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Crawl triggered"));
    }
}
