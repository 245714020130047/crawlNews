package com.crawlnews.backend.crawler;

import com.crawlnews.backend.domain.CrawlJob;
import com.crawlnews.backend.domain.NewsArticle;

import java.util.List;

/**
 * Strategy interface for source-specific crawling.
 * Each news source implements this interface.
 */
public interface CrawlerAdapter {

    /**
     * The slug identifying the source this adapter handles.
     */
    String getSourceSlug();

    /**
     * Parser version (bump when logic changes to track re-parse needs).
     */
    String getParserVersion();

    /**
     * Fetch the list of article URLs from the source's home/category pages.
     */
    List<String> fetchArticleUrls(CrawlJob job) throws Exception;

    /**
     * Fetch and parse article detail from a given URL.
     */
    NewsArticle fetchArticleDetail(String url, CrawlJob job) throws Exception;
}
