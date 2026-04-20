package com.vnnews.service.crawler;

import java.util.List;

public interface NewsCrawler {
    String getSourceName();
    List<CrawledArticle> crawl();
}
