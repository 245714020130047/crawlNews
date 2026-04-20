package com.vnnews.service;

import com.vnnews.dto.ArticleDto;
import com.vnnews.entity.Article;
import com.vnnews.entity.Category;
import com.vnnews.repository.ArticleRepository;
import com.vnnews.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final CategoryRepository categoryRepository;

    @Cacheable(value = "articles", key = "'latest_' + #pageable.pageNumber")
    public Page<ArticleDto> getLatestArticles(Pageable pageable) {
        return articleRepository.findLatestPublished(pageable).map(this::toDto);
    }

    @Cacheable(value = "articles", key = "'category_' + #categorySlug + '_' + #pageable.pageNumber")
    public Page<ArticleDto> getArticlesByCategory(String categorySlug, Pageable pageable) {
        return articleRepository.findByCategorySlug(categorySlug, pageable).map(this::toDto);
    }

    public Optional<ArticleDto> getArticleBySlug(String slug) {
        return articleRepository.findBySlug(slug).map(this::toDto);
    }

    public Page<ArticleDto> searchArticles(String query, Pageable pageable) {
        return articleRepository.fullTextSearch(query, pageable).map(this::toDto);
    }

    @Cacheable(value = "articles", key = "'trending'")
    public Page<ArticleDto> getTrendingArticles(Pageable pageable) {
        return articleRepository.findTrending(pageable).map(this::toDto);
    }

    public Page<ArticleDto> getArticlesBySource(String sourceName, Pageable pageable) {
        return articleRepository.findBySourceName(sourceName, pageable).map(this::toDto);
    }

    public Page<ArticleDto> getArticlesByStatus(Article.Status status, Pageable pageable) {
        return articleRepository.findByStatus(status, pageable);
    }

    @Transactional
    public void incrementViewCount(Long articleId) {
        articleRepository.incrementViewCount(articleId);
    }

    @Transactional
    @CacheEvict(value = "articles", allEntries = true)
    public ArticleDto updateArticle(Long id, ArticleDto dto) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found: " + id));
        if (dto.getTitle() != null) article.setTitle(dto.getTitle());
        if (dto.getContent() != null) article.setContent(dto.getContent());
        if (dto.getSummary() != null) article.setSummary(dto.getSummary());
        if (dto.getStatus() != null) article.setStatus(Article.Status.valueOf(dto.getStatus()));
        if (dto.getCategorySlug() != null) {
            Category cat = categoryRepository.findBySlug(dto.getCategorySlug())
                    .orElseThrow(() -> new RuntimeException("Category not found: " + dto.getCategorySlug()));
            article.setCategory(cat);
        }
        return toDto(articleRepository.save(article));
    }

    @Transactional
    @CacheEvict(value = "articles", allEntries = true)
    public void deleteArticle(Long id) {
        articleRepository.deleteById(id);
    }

    @Transactional
    @CacheEvict(value = "articles", allEntries = true)
    public ArticleDto updateSummary(Long id, String summary) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found: " + id));
        article.setSummary(summary);
        return toDto(articleRepository.save(article));
    }

    public boolean existsBySourceUrl(String sourceUrl) {
        return articleRepository.existsBySourceUrl(sourceUrl);
    }

    @CacheEvict(value = "articles", allEntries = true)
    public Article save(Article article) {
        return articleRepository.save(article);
    }

    public long countArticlesSince(java.time.LocalDateTime since) {
        return articleRepository.countArticlesSince(since);
    }

    private ArticleDto toDto(Article a) {
        return ArticleDto.builder()
                .id(a.getId())
                .title(a.getTitle())
                .slug(a.getSlug())
                .summary(a.getSummary())
                .content(a.getContent())
                .thumbnailUrl(a.getThumbnailUrl())
                .sourceUrl(a.getSourceUrl())
                .sourceName(a.getSourceName())
                .categoryName(a.getCategory() != null ? a.getCategory().getName() : null)
                .categorySlug(a.getCategory() != null ? a.getCategory().getSlug() : null)
                .publishedAt(a.getPublishedAt())
                .status(a.getStatus().name())
                .viewCount(a.getViewCount())
                .metadata(a.getMetadata())
                .build();
    }
}
