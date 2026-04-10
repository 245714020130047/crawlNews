package com.crawlnews.backend.crawler.dedup;

import com.crawlnews.backend.domain.NewsArticle;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

/**
 * Redis-based deduplicator - DORMANT by default.
 * Enabled via: crawler.redis-dedup.enabled=true
 * Used when scaling to multiple crawler workers to reduce DB write pressure.
 * Falls back safely to DbDeduplicator if Redis is unavailable.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.crawler.redis-dedup.enabled", havingValue = "true")
@RequiredArgsConstructor
public class RedisDeduplicator {

    private final StringRedisTemplate redisTemplate;

    private static final String URL_DEDUP_PREFIX = "dedup:url:";
    private static final String FP_DEDUP_PREFIX = "dedup:fp:";
    private static final Duration URL_TTL = Duration.ofHours(24);
    private static final Duration FP_TTL = Duration.ofHours(12);

    /**
     * Check Redis for a duplicate URL.
     * Returns the article ID if found (as string), empty otherwise.
     */
    public Optional<String> checkUrl(String normalizedUrl) {
        try {
            String key = URL_DEDUP_PREFIX + hash(normalizedUrl);
            String value = redisTemplate.opsForValue().get(key);
            return Optional.ofNullable(value);
        } catch (Exception e) {
            log.warn("Redis dedup check failed (falling back to DB): {}", e.getMessage());
            return Optional.empty();
        }
    }

    public Optional<String> checkFingerprint(String fingerprint) {
        try {
            String key = FP_DEDUP_PREFIX + fingerprint;
            String value = redisTemplate.opsForValue().get(key);
            return Optional.ofNullable(value);
        } catch (Exception e) {
            log.warn("Redis fingerprint dedup check failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Register a crawled article in Redis after persisting to DB.
     */
    public void register(NewsArticle article) {
        try {
            if (article.getNormalizedSourceUrl() != null) {
                redisTemplate.opsForValue().set(
                        URL_DEDUP_PREFIX + hash(article.getNormalizedSourceUrl()),
                        String.valueOf(article.getId()),
                        URL_TTL);
            }
            if (article.getContentFingerprint() != null) {
                redisTemplate.opsForValue().set(
                        FP_DEDUP_PREFIX + article.getContentFingerprint(),
                        String.valueOf(article.getId()),
                        FP_TTL);
            }
        } catch (Exception e) {
            log.warn("Failed to register article in Redis dedup cache: {}", e.getMessage());
        }
    }

    private String hash(String input) {
        return com.google.common.hash.Hashing.sha256()
                .hashString(input, java.nio.charset.StandardCharsets.UTF_8)
                .toString();
    }
}
