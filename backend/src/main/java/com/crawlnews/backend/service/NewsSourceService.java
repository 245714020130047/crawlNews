package com.crawlnews.backend.service;

import com.crawlnews.backend.domain.NewsSource;
import com.crawlnews.backend.repository.NewsSourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NewsSourceService {

    private final NewsSourceRepository newsSourceRepository;

    @Transactional(readOnly = true)
    public List<NewsSource> findAll() {
        return newsSourceRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<NewsSource> findAllActive() {
        return newsSourceRepository.findByIsActiveTrueOrderByName();
    }

    @Transactional(readOnly = true)
    public Optional<NewsSource> findById(Long id) {
        return newsSourceRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<NewsSource> findBySlug(String slug) {
        return newsSourceRepository.findBySlug(slug);
    }

    @Transactional
    public NewsSource create(NewsSource source) {
        log.info("Creating news source: name={} slug={}", source.getName(), source.getSlug());
        return newsSourceRepository.save(source);
    }

    @Transactional
    public NewsSource update(Long id, NewsSource updated) {
        log.info("Updating news source: id={}", id);
        NewsSource source = newsSourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Source not found: " + id));
        source.setName(updated.getName());
        source.setBaseUrl(updated.getBaseUrl());
        source.setHomeUrl(updated.getHomeUrl());
        source.setLogoUrl(updated.getLogoUrl());
        source.setDescription(updated.getDescription());
        source.setCrawlIntervalMinutes(updated.getCrawlIntervalMinutes());
        source.setUserAgent(updated.getUserAgent());
        return newsSourceRepository.save(source);
    }

    @Transactional
    public void enable(Long id) {
        NewsSource source = newsSourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Source not found: " + id));
        source.setIsActive(true);
        source.setConsecutiveFailCount(0);
        log.info("Source enabled: id={} slug={}", id, source.getSlug());
        newsSourceRepository.save(source);
    }

    @Transactional
    public void disable(Long id) {
        NewsSource source = newsSourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Source not found: " + id));
        source.setIsActive(false);
        log.info("Source disabled: id={} slug={}", id, source.getSlug());
        newsSourceRepository.save(source);
    }
}
