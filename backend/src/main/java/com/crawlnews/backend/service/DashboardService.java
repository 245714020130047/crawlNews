package com.crawlnews.backend.service;

import com.crawlnews.backend.domain.*;
import com.crawlnews.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final NewsSourceRepository newsSourceRepository;
    private final NewsArticleRepository newsArticleRepository;
    private final CrawlJobRepository crawlJobRepository;
    private final SummaryJobRepository summaryJobRepository;
    private final NewsSummaryRepository newsSummaryRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getOverview() {
        Map<String, Object> overview = new HashMap<>();
        overview.put("totalSources", newsSourceRepository.count());
        overview.put("activeSources", newsSourceRepository.findByIsActiveTrue().size());
        overview.put("totalArticles", newsArticleRepository.count());
        overview.put("activeArticles", newsArticleRepository.countBySourceIdAndStatus(0L, ArticleStatus.ACTIVE));
        overview.put("totalSummaries", newsSummaryRepository.count());
        overview.put("pendingJobs", summaryJobRepository.countByStatus(SummaryJobStatus.QUEUED));
        overview.put("failedJobs", summaryJobRepository.countByStatus(SummaryJobStatus.FAILED));
        log.debug("Dashboard overview fetched");
        return overview;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCrawlMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalJobs", crawlJobRepository.count());
        metrics.put("successJobs", crawlJobRepository.findByStatusIn(
                java.util.List.of(CrawlJobStatus.SUCCESS)).size());
        metrics.put("failedJobs", crawlJobRepository.findByStatusIn(
                java.util.List.of(CrawlJobStatus.FAILED)).size());
        metrics.put("recentJobs", crawlJobRepository.findAllByOrderByCreatedAtDesc(
                PageRequest.of(0, 10)).getContent());
        return metrics;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSummaryMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("queued", summaryJobRepository.countByStatus(SummaryJobStatus.QUEUED));
        metrics.put("processing", summaryJobRepository.countByStatus(SummaryJobStatus.PROCESSING));
        metrics.put("done", summaryJobRepository.countByStatus(SummaryJobStatus.DONE));
        metrics.put("failed", summaryJobRepository.countByStatus(SummaryJobStatus.FAILED));
        metrics.put("total", newsSummaryRepository.count());
        return metrics;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSourceHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("sources", newsSourceRepository.findAll().stream().map(s -> {
            Map<String, Object> sourceInfo = new HashMap<>();
            sourceInfo.put("id", s.getId());
            sourceInfo.put("name", s.getName());
            sourceInfo.put("slug", s.getSlug());
            sourceInfo.put("isActive", s.getIsActive());
            sourceInfo.put("lastCrawledAt", s.getLastCrawledAt());
            sourceInfo.put("lastSuccessAt", s.getLastSuccessAt());
            sourceInfo.put("consecutiveFailCount", s.getConsecutiveFailCount());
            return sourceInfo;
        }).toList());
        return health;
    }
}
