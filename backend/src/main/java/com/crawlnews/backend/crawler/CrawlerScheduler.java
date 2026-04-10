package com.crawlnews.backend.crawler;

import com.crawlnews.backend.domain.NewsSource;
import com.crawlnews.backend.service.NewsSourceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Scheduler that triggers crawl jobs for all active sources.
 * Uses ShedLock to prevent duplicate runs across multiple instances.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CrawlerScheduler {

    private final NewsSourceService newsSourceService;
    private final CrawlPipeline crawlPipeline;

    /**
     * Run all active sources every 45 minutes.
     * ShedLock ensures only one instance runs at a time.
     */
    @Scheduled(fixedDelayString = "${app.crawler.schedule-delay-ms:2700000}") // 45 min default
    @SchedulerLock(
            name = "CrawlerScheduler_runAll",
            lockAtLeastFor = "PT5M",
            lockAtMostFor = "PT30M"
    )
    public void runAllSources() {
        log.info("Crawler scheduler triggered: fetching active sources");
        List<NewsSource> activeSources = newsSourceService.findAllActive();
        if (activeSources.isEmpty()) {
            log.info("No active sources to crawl");
            return;
        }

        log.info("Starting crawl for {} active sources", activeSources.size());
        // Run sequentially on Free Tier to minimize memory pressure
        for (NewsSource source : activeSources) {
            try {
                crawlPipeline.runForSource(source);
            } catch (Exception e) {
                log.error("Unhandled error crawling source={}: {}", source.getSlug(), e.getMessage(), e);
            }
        }
        log.info("Crawler scheduler cycle complete");
    }

    /**
     * Manual trigger for a single source.
     */
    public void triggerSource(Long sourceId) {
        newsSourceService.findById(sourceId).ifPresentOrElse(
                source -> {
                    log.info("Manual crawl triggered for source: id={} slug={}", sourceId, source.getSlug());
                    crawlPipeline.runForSource(source);
                },
                () -> log.warn("Cannot trigger crawl - source not found: id={}", sourceId)
        );
    }
}
