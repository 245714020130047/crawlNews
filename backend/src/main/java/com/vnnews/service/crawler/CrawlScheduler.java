package com.vnnews.service.crawler;

import com.vnnews.service.CrawlOrchestrator;
import com.vnnews.service.SchedulerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CrawlScheduler {

    private final CrawlOrchestrator crawlOrchestrator;
    private final SchedulerService schedulerService;

    @Scheduled(fixedDelayString = "${app.crawl.interval:1800000}")
    public void scheduledCrawl() {
        if (!schedulerService.isJobEnabled("CRAWL")) {
            log.debug("Crawl scheduler disabled");
            return;
        }
        log.info("Scheduled crawl starting...");
        crawlOrchestrator.crawlAllSources();
    }
}
