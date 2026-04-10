package com.crawlnews.backend.repository;

import com.crawlnews.backend.domain.ArticleStatus;
import com.crawlnews.backend.domain.NewsArticle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NewsArticleRepository extends JpaRepository<NewsArticle, Long> {

    Optional<NewsArticle> findBySlug(String slug);
    Optional<NewsArticle> findByCanonicalUrl(String canonicalUrl);
    Optional<NewsArticle> findByNormalizedSourceUrl(String normalizedSourceUrl);
    Optional<NewsArticle> findByContentFingerprint(String contentFingerprint);

    Page<NewsArticle> findByStatusOrderByPublishedAtDesc(ArticleStatus status, Pageable pageable);
    Page<NewsArticle> findBySourceIdAndStatusOrderByPublishedAtDesc(Long sourceId, ArticleStatus status, Pageable pageable);
    Page<NewsArticle> findByCategoryIdAndStatusOrderByPublishedAtDesc(Long categoryId, ArticleStatus status, Pageable pageable);

    @Query("SELECT a FROM NewsArticle a WHERE a.status = :status AND " +
           "(LOWER(a.title) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(a.excerpt) LIKE LOWER(CONCAT('%', :q, '%')))" +
           " ORDER BY a.publishedAt DESC")
    Page<NewsArticle> searchByTitleOrExcerpt(@Param("q") String q, @Param("status") ArticleStatus status, Pageable pageable);

    @Query("SELECT a FROM NewsArticle a WHERE a.status = 'ACTIVE' ORDER BY a.publishedAt DESC")
    List<NewsArticle> findLatestArticles(Pageable pageable);

    @Query("SELECT a FROM NewsArticle a WHERE a.source.id = :sourceId AND a.status = 'ACTIVE' ORDER BY a.publishedAt DESC")
    List<NewsArticle> findLatestBySource(@Param("sourceId") Long sourceId, Pageable pageable);

    @Query("SELECT a FROM NewsArticle a WHERE a.status = 'ACTIVE' ORDER BY (a.viewCount * 0.6 + a.crawlCount * 0.4) DESC")
    List<NewsArticle> findTrending(Pageable pageable);

    @Modifying
    @Query("UPDATE NewsArticle a SET a.viewCount = a.viewCount + 1 WHERE a.id = :id")
    void incrementViewCount(@Param("id") Long id);

    long countBySourceIdAndStatus(Long sourceId, ArticleStatus status);
}
