package com.crawlnews.backend.service;

import com.crawlnews.backend.domain.ArticleStatus;
import com.crawlnews.backend.domain.NewsArticle;
import com.crawlnews.backend.repository.NewsArticleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ArticleService {

    private final NewsArticleRepository articleRepository;

    @Transactional(readOnly = true)
    public List<NewsArticle> findLatest(int limit) {
        return articleRepository.findLatestArticles(PageRequest.of(0, limit));
    }

    @Transactional(readOnly = true)
    public List<NewsArticle> findLatestBySource(Long sourceId, int limit) {
        return articleRepository.findLatestBySource(sourceId, PageRequest.of(0, limit));
    }

    @Transactional(readOnly = true)
    public List<NewsArticle> findTrending(int limit) {
        return articleRepository.findTrending(PageRequest.of(0, limit));
    }

    @Transactional(readOnly = true)
    public Page<NewsArticle> findActive(Pageable pageable) {
        return articleRepository.findByStatusOrderByPublishedAtDesc(ArticleStatus.ACTIVE, pageable);
    }

    @Transactional(readOnly = true)
    public Page<NewsArticle> findByCategory(Long categoryId, Pageable pageable) {
        return articleRepository.findByCategoryIdAndStatusOrderByPublishedAtDesc(categoryId, ArticleStatus.ACTIVE, pageable);
    }

    @Transactional(readOnly = true)
    public Page<NewsArticle> findBySource(Long sourceId, Pageable pageable) {
        return articleRepository.findBySourceIdAndStatusOrderByPublishedAtDesc(sourceId, ArticleStatus.ACTIVE, pageable);
    }

    @Transactional(readOnly = true)
    public Page<NewsArticle> search(String query, Pageable pageable) {
        return articleRepository.searchByTitleOrExcerpt(query, ArticleStatus.ACTIVE, pageable);
    }

    @Transactional(readOnly = true)
    public Optional<NewsArticle> findById(Long id) {
        return articleRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<NewsArticle> findBySlug(String slug) {
        return articleRepository.findBySlug(slug);
    }

    @Transactional
    public void incrementViewCount(Long id) {
        articleRepository.incrementViewCount(id);
    }

    @Transactional
    public NewsArticle updateStatus(Long id, ArticleStatus status) {
        NewsArticle article = articleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Article not found: " + id));
        log.info("Updating article status: id={} status={}", id, status);
        article.setStatus(status);
        return articleRepository.save(article);
    }

    @Transactional(readOnly = true)
    public Page<NewsArticle> findAll(Pageable pageable) {
        return articleRepository.findAll(pageable);
    }
}
