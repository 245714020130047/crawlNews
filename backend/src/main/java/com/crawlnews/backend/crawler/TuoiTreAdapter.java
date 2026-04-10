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

/**
 * Crawler adapter for Tuoi Tre (tuoitre.vn).
 */
@Slf4j
@Component
public class TuoiTreAdapter implements CrawlerAdapter {

    private static final String SOURCE_SLUG = "tuoitre";
    private static final String PARSER_VERSION = "1.0";
    private static final String HOME_URL = "https://tuoitre.vn";

    @Value("${app.crawler.default-user-agent}")
    private String userAgent;

    @Value("${app.crawler.request-timeout-ms:15000}")
    private int timeoutMs;

    private final NewsSourceRepository newsSourceRepository;

    public TuoiTreAdapter(NewsSourceRepository newsSourceRepository) {
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
        log.info("[TuoiTre] Fetching article list");
        List<String> urls = new ArrayList<>();
        Document doc = Jsoup.connect(HOME_URL)
                .userAgent(userAgent)
                .timeout(timeoutMs)
                .get();

        Elements links = doc.select("a[href*=tuoitre.vn]");
        for (Element link : links) {
            String href = link.attr("abs:href");
            if (href.contains("tuoitre.vn/") && href.endsWith(".htm")) {
                urls.add(href);
            }
        }
        log.info("[TuoiTre] Found {} article URLs", urls.size());
        return urls;
    }

    @Override
    public NewsArticle fetchArticleDetail(String url, CrawlJob job) throws Exception {
        log.debug("[TuoiTre] Fetching article: {}", url);
        Document doc = Jsoup.connect(url)
                .userAgent(userAgent)
                .timeout(timeoutMs)
                .get();

        NewsSource source = newsSourceRepository.findBySlug(SOURCE_SLUG).orElseThrow();
        NewsArticle article = new NewsArticle();
        article.setSource(source);
        article.setSourceUrl(url);
        article.setNormalizedSourceUrl(url);

        Element titleEl = doc.selectFirst("h1.article-title");
        article.setTitle(titleEl != null ? titleEl.text() : doc.title());

        Element excerptEl = doc.selectFirst("h2.article-sapo, p.sapo");
        if (excerptEl != null) article.setExcerpt(excerptEl.text());

        Element contentEl = doc.selectFirst("div#main-detail-body");
        if (contentEl != null) {
            article.setContentHtml(contentEl.html());
            article.setContentText(contentEl.text());
        }

        Element imgEl = doc.selectFirst("div.VCSortableInPreviewMode img");
        if (imgEl != null) {
            article.setImageUrl(imgEl.attr("src"));
            article.setImageAlt(imgEl.attr("alt"));
        }

        article.setPublishedAt(OffsetDateTime.now());
        article.setFirstCrawledAt(OffsetDateTime.now());
        article.setLastCrawledAt(OffsetDateTime.now());
        return article;
    }
}
