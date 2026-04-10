package com.crawlnews.backend.crawler;

import com.crawlnews.backend.crawler.dedup.DbDeduplicator;
import com.crawlnews.backend.crawler.dedup.RedisDeduplicator;
import com.crawlnews.backend.domain.*;
import com.crawlnews.backend.repository.CrawlJobRepository;
import com.crawlnews.backend.repository.CrawlResultRepository;
import com.crawlnews.backend.repository.NewsArticleRepository;
import com.crawlnews.backend.repository.NewsSourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Core crawl pipeline: robots check → fetch list → dedup → fetch detail → persist → log.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CrawlPipeline {

    private final List<CrawlerAdapter> adapters;
    private final RobotsService robotsService;
    private final DbDeduplicator dbDeduplicator;
    private final NewsArticleRepository articleRepository;
    private final CrawlJobRepository crawlJobRepository;
    private final CrawlResultRepository crawlResultRepository;
    private final NewsSourceRepository newsSourceRepository;

    @Autowired(required = false)
    private RedisDeduplicator redisDeduplicator;

    private Map<String, CrawlerAdapter> adapterMap;

    @jakarta.annotation.PostConstruct
    public void init() {
        adapterMap = adapters.stream()
                .collect(Collectors.toMap(CrawlerAdapter::getSourceSlug, Function.identity()));
        log.info("CrawlPipeline initialized with {} adapters: {}", adapterMap.size(), adapterMap.keySet());
    }

    public void runForSource(NewsSource source) {
        MDC.put("sourceSlug", source.getSlug());
        CrawlJob job = createJob(source);
        MDC.put("crawlJobId", String.valueOf(job.getId()));
        long startTs = System.currentTimeMillis();

        try {
            log.info("Crawl started: source={}", source.getSlug());
            CrawlerAdapter adapter = adapterMap.get(source.getSlug());
            if (adapter == null) {
                log.warn("No adapter found for source: {}", source.getSlug());
                markJobFailed(job, "No adapter registered");
                return;
            }

            // Step 1: Check robots.txt
            boolean robotsAllowed = robotsService.isAllowed(source.getHomeUrl() != null ? source.getHomeUrl() : source.getBaseUrl(),
                    source.getRobotsCacheTtlSeconds());
            job.setRobotsChecked(true);
            job.setRobotsAllowed(robotsAllowed);

            if (!robotsAllowed) {
                log.warn("robots.txt DISALLOW for source={}", source.getSlug());
                markJobFailed(job, "robots.txt disallowed");
                return;
            }

            // Step 2: Fetch article URLs
            job.setStatus(CrawlJobStatus.RUNNING);
            crawlJobRepository.save(job);

            List<String> urls = adapter.fetchArticleUrls(job);
            job.setArticlesFound(urls.size());

            // Step 3: Process each URL
            for (String url : urls) {
                processArticleUrl(url, adapter, job, source);
            }

            // Step 4: Finalize job
            job.setStatus(job.getArticlesFailed() > 0 && job.getArticlesNew() == 0
                    ? CrawlJobStatus.FAILED : CrawlJobStatus.SUCCESS);
            long duration = System.currentTimeMillis() - startTs;
            job.setDurationMs(duration);
            job.setFinishedAt(OffsetDateTime.now());
            crawlJobRepository.save(job);

            // Update source stats
            source.setLastCrawledAt(OffsetDateTime.now());
            source.setLastSuccessAt(OffsetDateTime.now());
            source.setConsecutiveFailCount(0);
            newsSourceRepository.save(source);

            log.info("Crawl finished: source={} found={} new={} updated={} skipped={} failed={} durationMs={}",
                    source.getSlug(), job.getArticlesFound(), job.getArticlesNew(),
                    job.getArticlesUpdated(), job.getArticlesSkipped(), job.getArticlesFailed(), duration);
        } catch (Exception e) {
            log.error("Crawl FAILED: source={} error={}", source.getSlug(), e.getMessage(), e);
            markJobFailed(job, e.getMessage());
            source.setLastCrawledAt(OffsetDateTime.now());
            source.setConsecutiveFailCount(source.getConsecutiveFailCount() + 1);
            newsSourceRepository.save(source);
        } finally {
            MDC.remove("crawlJobId");
            MDC.remove("sourceSlug");
        }
    }

    private void processArticleUrl(String url, CrawlerAdapter adapter, CrawlJob job, NewsSource source) {
        CrawlResult result = new CrawlResult();
        result.setCrawlJob(job);
        result.setSourceUrl(url);
        long t = System.currentTimeMillis();

        try {
            // Check robots for specific URL
            if (!robotsService.isAllowed(url, source.getRobotsCacheTtlSeconds())) {
                result.setResult(CrawlResultType.ROBOTS_BLOCKED);
                job.setArticlesSkipped(job.getArticlesSkipped() + 1);
                crawlResultRepository.save(result);
                return;
            }

            // Redis dedup fast check
            if (redisDeduplicator != null) {
                Optional<String> redisDup = redisDeduplicator.checkUrl(url);
                if (redisDup.isPresent()) {
                    result.setResult(CrawlResultType.DUPLICATE);
                    job.setArticlesSkipped(job.getArticlesSkipped() + 1);
                    crawlResultRepository.save(result);
                    return;
                }
            }

            // Fetch detail
            NewsArticle candidate = adapter.fetchArticleDetail(url, job);
            candidate.setContentFingerprint(computeFingerprint(candidate));

            // DB dedup check
            Optional<NewsArticle> existing = dbDeduplicator.findDuplicate(candidate);
            if (existing.isPresent()) {
                // Update metadata on existing article
                NewsArticle existingArticle = existing.get();
                existingArticle.setLastCrawledAt(OffsetDateTime.now());
                existingArticle.setCrawlCount(existingArticle.getCrawlCount() + 1);
                articleRepository.save(existingArticle);
                result.setArticle(existingArticle);
                result.setResult(CrawlResultType.UPDATED);
                job.setArticlesUpdated(job.getArticlesUpdated() + 1);
            } else {
                // New article
                candidate.setSlug(generateSlug(candidate.getTitle(), candidate.getId()));
                NewsArticle saved = articleRepository.save(candidate);
                result.setArticle(saved);
                result.setResult(CrawlResultType.NEW);
                job.setArticlesNew(job.getArticlesNew() + 1);

                // Register in Redis dedup
                if (redisDeduplicator != null) {
                    redisDeduplicator.register(saved);
                }

                log.debug("New article: id={} title={}", saved.getId(),
                        StringUtils.abbreviate(saved.getTitle(), 60));
            }
        } catch (Exception e) {
            result.setResult(CrawlResultType.FAILED);
            result.setErrorMessage(StringUtils.abbreviate(e.getMessage(), 500));
            job.setArticlesFailed(job.getArticlesFailed() + 1);
            log.warn("Article crawl failed: url={} error={}", url, e.getMessage());
        } finally {
            result.setResponseTimeMs((int)(System.currentTimeMillis() - t));
            crawlResultRepository.save(result);
        }
    }

    private CrawlJob createJob(NewsSource source) {
        CrawlJob job = new CrawlJob();
        job.setSource(source);
        job.setJobType(CrawlJobType.SCHEDULED);
        job.setStatus(CrawlJobStatus.PENDING);
        job.setStartedAt(OffsetDateTime.now());
        return crawlJobRepository.save(job);
    }

    private void markJobFailed(CrawlJob job, String reason) {
        job.setStatus(CrawlJobStatus.FAILED);
        job.setErrorMessage(reason);
        job.setFinishedAt(OffsetDateTime.now());
        crawlJobRepository.save(job);
    }

    private String computeFingerprint(NewsArticle article) {
        try {
            String input = (article.getTitle() != null ? article.getTitle().trim().toLowerCase() : "")
                    + "|" + (article.getSource() != null ? article.getSource().getId() : "");
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return null;
        }
    }

    private String generateSlug(String title, Long id) {
        if (title == null) return "article-" + System.currentTimeMillis();
        String slug = title.toLowerCase()
                .replaceAll("[àáâãäåæ]", "a")
                .replaceAll("[èéêë]", "e")
                .replaceAll("[ìíîï]", "i")
                .replaceAll("[òóôõöø]", "o")
                .replaceAll("[ùúûü]", "u")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        return slug + "-" + System.currentTimeMillis();
    }
}
