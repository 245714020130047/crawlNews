package com.vnnews.service.crawler;

import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;
import com.vnnews.entity.CrawlConfig;
import com.vnnews.repository.CrawlConfigRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URL;
import java.util.List;

@Component
@Slf4j
public class ThanhNienCrawler extends AbstractNewsCrawler {

    public ThanhNienCrawler(CrawlConfigRepository crawlConfigRepository) {
        super(crawlConfigRepository);
    }

    @Override
    public String getSourceName() {
        return "thanhnien";
    }

    @Override
    protected List<String> fetchArticleUrls(CrawlConfig config) throws Exception {
        SyndFeed feed = new SyndFeedInput().build(new XmlReader(new URL(config.getRssUrl())));
        return feed.getEntries().stream()
                .map(SyndEntry::getLink)
                .filter(link -> link != null && link.contains("thanhnien.vn"))
                .limit(20)
                .toList();
    }
}
