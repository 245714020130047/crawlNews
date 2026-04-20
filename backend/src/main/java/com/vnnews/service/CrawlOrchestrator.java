package com.vnnews.service;

import com.vnnews.entity.Article;
import com.vnnews.entity.Category;
import com.vnnews.entity.CrawlLog;
import com.vnnews.repository.CrawlLogRepository;
import com.vnnews.service.crawler.CrawledArticle;
import com.vnnews.service.crawler.NewsCrawler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class CrawlOrchestrator {

    private final List<NewsCrawler> crawlers;
    private final ArticleService articleService;
    private final CategoryMappingService categoryMappingService;
    private final CrawlLogRepository crawlLogRepository;
    private final SchedulerService schedulerService;

    @Async
    public void crawlAllSources() {
        if (!schedulerService.isJobEnabled("CRAWL")) {
            log.info("Crawl scheduler is disabled, skipping");
            return;
        }
        for (NewsCrawler crawler : crawlers) {
            crawlSource(crawler);
        }
    }

    public void crawlSource(NewsCrawler crawler) {
        log.info("Starting crawl for: {}", crawler.getSourceName());
        CrawlLog crawlLog = new CrawlLog();
        crawlLog.setStartedAt(LocalDateTime.now());
        crawlLog.setStatus("RUNNING");

        int found = 0, saved = 0;
        Map<String, Object> errors = new HashMap<>();

        try {
            List<CrawledArticle> articles = crawler.crawl();
            found = articles.size();

            for (CrawledArticle crawled : articles) {
                try {
                    if (articleService.existsBySourceUrl(crawled.getSourceUrl())) {
                        continue;
                    }
                    Category category = categoryMappingService.resolveCategory(
                            crawled.getSourceName(), crawled.getSourceCategory());

                    Article article = new Article();
                    article.setTitle(crawled.getTitle());
                    article.setSlug(toSlug(crawled.getTitle()));
                    article.setContent(crawled.getContent());
                    article.setThumbnailUrl(crawled.getThumbnailUrl());
                    article.setSourceUrl(crawled.getSourceUrl());
                    article.setSourceName(crawled.getSourceName());
                    article.setCategory(category);
                    article.setPublishedAt(crawled.getPublishedAt());
                    article.setStatus(Article.Status.PUBLISHED);
                    article.setViewCount(0L);

                    articleService.save(article);
                    saved++;
                } catch (Exception e) {
                    errors.put(crawled.getSourceUrl(), e.getMessage());
                    log.warn("Failed to save article: {}", crawled.getSourceUrl(), e);
                }
            }
            crawlLog.setStatus("COMPLETED");
        } catch (Exception e) {
            crawlLog.setStatus("FAILED");
            errors.put("general", e.getMessage());
            log.error("Crawl failed for: {}", crawler.getSourceName(), e);
        }

        crawlLog.setFinishedAt(LocalDateTime.now());
        crawlLog.setArticlesFound(found);
        crawlLog.setArticlesSaved(saved);
        crawlLog.setErrors(errors.isEmpty() ? null : errors);
        crawlLogRepository.save(crawlLog);

        log.info("Crawl finished for {}: found={}, saved={}", crawler.getSourceName(), found, saved);
    }

    private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]+");

    private String toSlug(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        normalized = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        normalized = normalized.replaceAll("đ", "d").replaceAll("Đ", "D");
        normalized = WHITESPACE.matcher(normalized).replaceAll("-");
        normalized = NON_LATIN.matcher(normalized).replaceAll("");
        String slug = normalized.toLowerCase().replaceAll("-{2,}", "-").replaceAll("^-|-$", "");
        return slug + "-" + System.currentTimeMillis();
    }
}
