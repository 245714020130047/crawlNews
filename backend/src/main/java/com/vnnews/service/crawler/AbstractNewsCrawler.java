package com.vnnews.service.crawler;

import com.vnnews.entity.CrawlConfig;
import com.vnnews.repository.CrawlConfigRepository;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
public abstract class AbstractNewsCrawler implements NewsCrawler {

    protected final CrawlConfigRepository crawlConfigRepository;

    protected AbstractNewsCrawler(CrawlConfigRepository crawlConfigRepository) {
        this.crawlConfigRepository = crawlConfigRepository;
    }

    @Override
    public List<CrawledArticle> crawl() {
        List<CrawledArticle> articles = new ArrayList<>();
        CrawlConfig config = crawlConfigRepository.findBySourceName(getSourceName())
                .orElseThrow(() -> new RuntimeException("No config for: " + getSourceName()));

        if (!config.getActive()) {
            log.info("Crawl skipped (inactive): {}", getSourceName());
            return articles;
        }

        try {
            List<String> articleUrls = fetchArticleUrls(config);
            Map<String, Object> selectors = config.getSelectors();

            for (String url : articleUrls) {
                try {
                    Document doc = Jsoup.connect(url)
                            .userAgent("Mozilla/5.0 VnNewsBot")
                            .timeout(10000)
                            .get();
                    CrawledArticle article = parseArticle(doc, url, selectors);
                    if (article != null) {
                        articles.add(article);
                    }
                } catch (Exception e) {
                    log.warn("Failed to crawl article: {} - {}", url, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Failed to crawl source: {}", getSourceName(), e);
        }
        return articles;
    }

    protected abstract List<String> fetchArticleUrls(CrawlConfig config) throws Exception;

    protected CrawledArticle parseArticle(Document doc, String url, Map<String, Object> selectors) {
        try {
            String titleSelector = (String) selectors.getOrDefault("title", "h1");
            String contentSelector = (String) selectors.getOrDefault("content", "article");
            String imageSelector = (String) selectors.getOrDefault("image", "img");
            String categorySelector = (String) selectors.getOrDefault("category", ".breadcrumb a");

            Element titleEl = doc.selectFirst(titleSelector);
            Element contentEl = doc.selectFirst(contentSelector);
            Element imageEl = doc.selectFirst(imageSelector);

            if (titleEl == null || contentEl == null) return null;

            String category = "Chưa phân loại";
            Element catEl = doc.selectFirst(categorySelector);
            if (catEl != null) {
                category = catEl.text().trim();
            }

            return CrawledArticle.builder()
                    .title(titleEl.text().trim())
                    .content(contentEl.html())
                    .thumbnailUrl(imageEl != null ? imageEl.absUrl("src") : null)
                    .sourceUrl(url)
                    .sourceName(getSourceName())
                    .sourceCategory(category)
                    .publishedAt(LocalDateTime.now())
                    .build();
        } catch (Exception e) {
            log.warn("Failed to parse article: {} - {}", url, e.getMessage());
            return null;
        }
    }
}
