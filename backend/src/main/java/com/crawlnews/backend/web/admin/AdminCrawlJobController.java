package com.crawlnews.backend.web.admin;

import com.crawlnews.backend.domain.CrawlJob;
import com.crawlnews.backend.domain.CrawlResult;
import com.crawlnews.backend.repository.CrawlJobRepository;
import com.crawlnews.backend.repository.CrawlResultRepository;
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
@RequestMapping("/api/admin/crawl-jobs")
@RequiredArgsConstructor
@Tag(name = "Admin - Crawl Jobs", description = "View and manage crawl jobs")
public class AdminCrawlJobController {

    private final CrawlJobRepository crawlJobRepository;
    private final CrawlResultRepository crawlResultRepository;

    @GetMapping
    @Operation(summary = "List all crawl jobs")
    public ResponseEntity<ApiResponse<Page<CrawlJob>>> listJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<CrawlJob> jobs = crawlJobRepository.findAllByOrderByCreatedAtDesc(
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.ok(jobs));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get crawl job by ID")
    public ResponseEntity<ApiResponse<CrawlJob>> getJob(@PathVariable Long id) {
        return crawlJobRepository.findById(id)
                .map(j -> ResponseEntity.ok(ApiResponse.ok(j)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/results")
    @Operation(summary = "Get crawl results for a job")
    public ResponseEntity<ApiResponse<List<CrawlResult>>> getResults(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(crawlResultRepository.findByCrawlJobId(id)));
    }
}
