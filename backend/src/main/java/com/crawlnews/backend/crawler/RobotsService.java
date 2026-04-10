package com.crawlnews.backend.crawler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;
import java.net.URI;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * Checks robots.txt for a given domain, caches in Redis.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RobotsService {

    private final StringRedisTemplate redisTemplate;

    private static final String CACHE_PREFIX = "robots:";
    private static final String OUR_BOT = "crawlnewsbot";

    /**
     * Check if crawling the given URL is allowed per robots.txt.
     */
    public boolean isAllowed(String url, int cacheTtlSeconds) {
        try {
            URI uri = URI.create(url);
            String domain = uri.getScheme() + "://" + uri.getHost();
            String path = uri.getPath();

            String robotsTxt = getRobotsTxt(domain, cacheTtlSeconds);
            if (robotsTxt == null) return true; // Allow if cannot fetch

            return checkAllowed(robotsTxt, path);
        } catch (Exception e) {
            log.warn("Error checking robots.txt for url={}: {}", url, e.getMessage());
            return true; // Allow on error (fail-open for crawling)
        }
    }

    private String getRobotsTxt(String domain, int cacheTtlSeconds) {
        String cacheKey = CACHE_PREFIX + domain;
        String cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            log.debug("robots.txt cache hit: {}", domain);
            return cached;
        }

        try {
            String robotsUrl = domain + "/robots.txt";
            log.info("Fetching robots.txt from: {}", robotsUrl);
            org.jsoup.Connection.Response response = org.jsoup.Jsoup.connect(robotsUrl)
                    .ignoreContentType(true)
                    .timeout(8000)
                    .execute();
            String content = response.body();
            redisTemplate.opsForValue().set(cacheKey, content, Duration.ofSeconds(cacheTtlSeconds));
            return content;
        } catch (IOException e) {
            log.warn("Cannot fetch robots.txt for domain={}: {}", domain, e.getMessage());
            // Cache empty string to avoid repeated fetch attempts
            redisTemplate.opsForValue().set(cacheKey, "", Duration.ofSeconds(cacheTtlSeconds));
            return null;
        }
    }

    private boolean checkAllowed(String robotsTxt, String path) {
        List<String> disallowedPaths = new ArrayList<>();
        boolean inOurSection = false;
        boolean inAllSection = false;

        try (BufferedReader reader = new BufferedReader(new StringReader(robotsTxt))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.startsWith("#") || line.isEmpty()) continue;

                if (line.toLowerCase().startsWith("user-agent:")) {
                    String agent = line.substring("user-agent:".length()).trim().toLowerCase();
                    inOurSection = agent.contains(OUR_BOT) || agent.contains("crawlnews");
                    inAllSection = "*".equals(agent);
                } else if (line.toLowerCase().startsWith("disallow:") && (inOurSection || inAllSection)) {
                    String disallowedPath = line.substring("disallow:".length()).trim();
                    if (!disallowedPath.isEmpty()) {
                        disallowedPaths.add(disallowedPath);
                    }
                }
            }
        } catch (IOException e) {
            log.error("Error parsing robots.txt", e);
        }

        for (String disallowed : disallowedPaths) {
            if (path.startsWith(disallowed)) {
                log.debug("robots.txt DISALLOW: path={} rule={}", path, disallowed);
                return false;
            }
        }
        return true;
    }
}
