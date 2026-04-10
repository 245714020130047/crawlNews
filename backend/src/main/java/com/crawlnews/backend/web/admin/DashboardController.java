package com.crawlnews.backend.web.admin;

import com.crawlnews.backend.service.DashboardService;
import com.crawlnews.backend.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@Tag(name = "Admin - Dashboard", description = "Dashboard metrics and health")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/overview")
    @Operation(summary = "Get overall system overview stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> overview() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getOverview()));
    }

    @GetMapping("/crawl-metrics")
    @Operation(summary = "Get crawl job metrics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> crawlMetrics() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getCrawlMetrics()));
    }

    @GetMapping("/summary-metrics")
    @Operation(summary = "Get AI summary job metrics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summaryMetrics() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getSummaryMetrics()));
    }

    @GetMapping("/source-health")
    @Operation(summary = "Get health status of all sources")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sourceHealth() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getSourceHealth()));
    }
}
