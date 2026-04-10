package com.crawlnews.backend.web.admin;

import com.crawlnews.backend.domain.NewsSummary;
import com.crawlnews.backend.domain.SummaryJob;
import com.crawlnews.backend.service.AppConfigService;
import com.crawlnews.backend.service.ArticleService;
import com.crawlnews.backend.service.SummaryService;
import com.crawlnews.backend.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/summaries")
@RequiredArgsConstructor
@Tag(name = "Admin - Summaries", description = "Manage AI summaries and settings")
public class AdminSummaryController {

    private final SummaryService summaryService;
    private final ArticleService articleService;
    private final AppConfigService appConfigService;

    @GetMapping("/jobs")
    @Operation(summary = "List all summary jobs")
    public ResponseEntity<ApiResponse<Page<SummaryJob>>> listJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(summaryService.findAllJobs(PageRequest.of(page, size))));
    }

    @PostMapping("/jobs")
    @Operation(summary = "Bulk enqueue summaries for articles without summaries")
    public ResponseEntity<ApiResponse<String>> bulkEnqueue(@RequestBody Map<String, Object> body) {
        // Simplified: just return acknowledgment; full implementation would query articles
        log.info("Bulk summary enqueue requested by admin");
        return ResponseEntity.ok(ApiResponse.ok("Bulk enqueue acknowledged"));
    }

    @PostMapping("/{articleId}/retry")
    @Operation(summary = "Retry summarize for an article")
    public ResponseEntity<ApiResponse<SummaryJob>> retry(@PathVariable Long articleId,
            @RequestHeader(value = "X-User", defaultValue = "admin") String user) {
        var article = articleService.findById(articleId)
                .orElseThrow(() -> new IllegalArgumentException("Article not found: " + articleId));
        var job = summaryService.enqueue(article,
                com.crawlnews.backend.domain.TriggerMode.MANUAL, user);
        return ResponseEntity.ok(ApiResponse.ok(job, "Retry job created"));
    }

    @PutMapping("/{articleId}")
    @Operation(summary = "Manually update a summary")
    public ResponseEntity<ApiResponse<NewsSummary>> updateSummary(
            @PathVariable Long articleId,
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "X-User", defaultValue = "admin") String user) {
        var summary = summaryService.updateSummary(articleId,
                body.get("shortSummary"), body.get("standardSummary"), user);
        return ResponseEntity.ok(ApiResponse.ok(summary, "Summary updated"));
    }

    @GetMapping("/settings")
    @Operation(summary = "Get summary settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSettings() {
        Map<String, Object> settings = Map.of(
                "autoSummaryEnabled", appConfigService.isAutoSummaryEnabled(),
                "summaryDailyLimit", appConfigService.getSummaryDailyLimit()
        );
        return ResponseEntity.ok(ApiResponse.ok(settings));
    }

    @PutMapping("/settings")
    @Operation(summary = "Update summary settings")
    public ResponseEntity<ApiResponse<Void>> updateSettings(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User", defaultValue = "admin") String user) {
        if (body.containsKey("autoSummaryEnabled")) {
            appConfigService.setValue("auto_summary_enabled",
                    body.get("autoSummaryEnabled").toString(), user);
            log.info("auto_summary_enabled set to {} by {}", body.get("autoSummaryEnabled"), user);
        }
        if (body.containsKey("summaryDailyLimit")) {
            appConfigService.setValue("summary_daily_limit",
                    body.get("summaryDailyLimit").toString(), user);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "Settings updated"));
    }
}
