package com.crawlnews.backend.crawler;

import com.crawlnews.backend.domain.CrawlJob;
import com.crawlnews.backend.domain.NewsArticle;
import com.crawlnews.backend.domain.NewsSource;
import com.crawlnews.backend.repository.NewsSourceRepository;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Crawler adapter for VnExpress (vnexpress.net).
 */
@Slf4j
@Component
public class VnExpressAdapter implements CrawlerAdapter {

    private static final String SOURCE_SLUG = "vnexpress";
    private static final String PARSER_VERSION = "1.0";
    private static final String HOME_URL = "https://vnexpress.net";

    @Value("${app.crawler.default-user-agent}")
    private String userAgent;

    @Value("${app.crawler.request-timeout-ms:15000}")
    private int timeoutMs;

    private final NewsSourceRepository newsSourceRepository;

    public VnExpressAdapter(NewsSourceRepository newsSourceRepository) {
        this.newsSourceRepository = newsSourceRepository;
    }

    @Override
    public String getSourceSlug() {
        return SOURCE_SLUG;
    }

    @Override
    public String getParserVersion() {
        return PARSER_VERSION;
    }

    @Override
    public List<String> fetchArticleUrls(CrawlJob job) throws Exception {
        log.info("[VnExpress] Fetching article list");
        List<String> urls = new ArrayList<>();
        Document doc = Jsoup.connect(HOME_URL)
                .userAgent(userAgent)
                .timeout(timeoutMs)
                .get();

        Elements articleLinks = doc.select("h3.title-news a, h2.title-news a");
        for (Element link : articleLinks) {
            String href = link.attr("abs:href");
            if (href.startsWith("https://vnexpress.net/") && href.contains(".html")) {
                urls.add(href);
            }
        }
        log.info("[VnExpress] Found {} article URLs", urls.size());
        return urls;
    }

    @Override
    public NewsArticle fetchArticleDetail(String url, CrawlJob job) throws Exception {
        log.debug("[VnExpress] Fetching article detail: {}", url);
        Document doc = Jsoup.connect(url)
                .userAgent(userAgent)
                .timeout(timeoutMs)
                .get();

        NewsSource source = newsSourceRepository.findBySlug(SOURCE_SLUG).orElseThrow();
        NewsArticle article = new NewsArticle();
        article.setSource(source);
        article.setSourceUrl(url);
        article.setNormalizedSourceUrl(normalizeUrl(url));

        // Title
        Element titleEl = doc.selectFirst("h1.title-detail");
        article.setTitle(titleEl != null ? titleEl.text() : doc.title());

        // Excerpt/description
        Element excerptEl = doc.selectFirst("p.description");
        if (excerptEl != null) article.setExcerpt(excerptEl.text());

        // Author
        Element authorEl = doc.selectFirst("p.author-article strong");
        if (authorEl != null) article.setAuthor(authorEl.text());

        // Content
        Element contentEl = doc.selectFirst("article.fck_detail");
        if (contentEl != null) {
            article.setContentHtml(contentEl.html());
            article.setContentText(contentEl.text());
        }

        // Image
        Element imgEl = doc.selectFirst("figure img");
        if (imgEl != null) {
            article.setImageUrl(imgEl.attr("data-src").isEmpty() ? imgEl.attr("src") : imgEl.attr("data-src"));
            article.setImageAlt(imgEl.attr("alt"));
        }

        // Published time
        Element timeEl = doc.selectFirst("span.date");
        article.setPublishedAt(OffsetDateTime.now()); // simplified; parse from timeEl in production
        article.setFirstCrawledAt(OffsetDateTime.now());
        article.setLastCrawledAt(OffsetDateTime.now());

        return article;
    }

    private String normalizeUrl(String url) {
        return url.replaceAll("[?&](utm_[^&]*|fbclid=[^&]*|gclid=[^&]*)(&|$)", "$2")
                  .replaceAll("[?&]$", "");
    }
}
