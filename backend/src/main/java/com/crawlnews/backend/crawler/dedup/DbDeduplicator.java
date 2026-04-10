package com.crawlnews.backend.crawler.dedup;

import com.crawlnews.backend.domain.NewsArticle;
import com.crawlnews.backend.repository.NewsArticleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Primary deduplicator using DB-level checks and ON CONFLICT DO UPDATE.
 * This is always active as the authoritative dedup layer.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DbDeduplicator {

    private final NewsArticleRepository articleRepository;

    public enum DedupResult { NEW, DUPLICATE, NEAR_DUPLICATE }

    /**
     * Check if an article is a duplicate using DB indexes.
     * Returns the existing article if duplicate, or empty if new.
     */
    public Optional<NewsArticle> findDuplicate(NewsArticle candidate) {
        // Layer 1: canonical_url
        if (candidate.getCanonicalUrl() != null) {
            Optional<NewsArticle> existing = articleRepository.findByCanonicalUrl(candidate.getCanonicalUrl());
            if (existing.isPresent()) {
                log.debug("Dedup hit (canonical_url): url={}", candidate.getCanonicalUrl());
                return existing;
            }
        }

        // Layer 2: normalized_source_url
        if (candidate.getNormalizedSourceUrl() != null) {
            Optional<NewsArticle> existing = articleRepository.findByNormalizedSourceUrl(candidate.getNormalizedSourceUrl());
            if (existing.isPresent()) {
                log.debug("Dedup hit (normalized_url): url={}", candidate.getNormalizedSourceUrl());
                return existing;
            }
        }

        // Layer 3: content fingerprint
        if (candidate.getContentFingerprint() != null) {
            Optional<NewsArticle> existing = articleRepository.findByContentFingerprint(candidate.getContentFingerprint());
            if (existing.isPresent()) {
                log.debug("Dedup hit (fingerprint): fp={}", candidate.getContentFingerprint());
                return existing;
            }
        }

        return Optional.empty();
    }
}
