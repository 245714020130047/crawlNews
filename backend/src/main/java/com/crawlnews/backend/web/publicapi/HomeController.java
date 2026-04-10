package com.crawlnews.backend.web.publicapi;

import com.crawlnews.backend.domain.NewsArticle;
import com.crawlnews.backend.domain.NewsSource;
import com.crawlnews.backend.service.ArticleService;
import com.crawlnews.backend.service.NewsSourceService;
import com.crawlnews.backend.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/public/home")
@RequiredArgsConstructor
@Tag(name = "Public - Home", description = "Home page data")
public class HomeController {

    private final ArticleService articleService;
    private final NewsSourceService newsSourceService;

    @GetMapping
    @Operation(summary = "Get home page data (hero, feed, per-source, trending)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHome() {
        log.debug("Home API requested");
        Map<String, Object> payload = new HashMap<>();

        // Hero: top 5 latest articles
        List<NewsArticle> hero = articleService.findLatest(5);
        payload.put("hero", hero);

        // Main feed: top 20
        payload.put("feed", articleService.findLatest(20));

        // Trending
        payload.put("trending", articleService.findTrending(10));

        // Per-source: 3 latest per active source
        List<NewsSource> sources = newsSourceService.findAllActive();
        Map<String, Object> perSource = new HashMap<>();
        for (NewsSource source : sources) {
            perSource.put(source.getSlug(), articleService.findLatestBySource(source.getId(), 3));
        }
        payload.put("perSource", perSource);

        // Source health
        payload.put("sources", sources.stream().map(s -> {
            Map<String, Object> info = new HashMap<>();
            info.put("id", s.getId());
            info.put("name", s.getName());
            info.put("slug", s.getSlug());
            info.put("logoUrl", s.getLogoUrl());
            info.put("lastCrawledAt", s.getLastCrawledAt());
            info.put("lastSuccessAt", s.getLastSuccessAt());
            info.put("isActive", s.getIsActive());
            return info;
        }).toList());

        return ResponseEntity.ok(ApiResponse.ok(payload));
    }
}
