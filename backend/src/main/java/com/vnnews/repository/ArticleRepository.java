package com.vnnews.repository;

import com.vnnews.entity.Article;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Long> {

    Optional<Article> findBySlug(String slug);

    boolean existsBySourceUrl(String sourceUrl);

    Page<Article> findByStatusOrderByPublishedAtDesc(Article.Status status, Pageable pageable);

    @Query("SELECT a FROM Article a WHERE a.status = :status AND a.category.slug = :categorySlug ORDER BY a.publishedAt DESC")
    Page<Article> findByCategorySlugAndStatus(@Param("categorySlug") String categorySlug, @Param("status") Article.Status status, Pageable pageable);

    @Query("SELECT a FROM Article a WHERE a.status = :status AND a.sourceName = :sourceName ORDER BY a.publishedAt DESC")
    Page<Article> findBySourceNameAndStatus(@Param("sourceName") String sourceName, @Param("status") Article.Status status, Pageable pageable);

    @Query(value = "SELECT * FROM articles WHERE status = :status AND search_vector @@ plainto_tsquery('simple', :query) ORDER BY ts_rank(search_vector, plainto_tsquery('simple', :query)) DESC",
           countQuery = "SELECT count(*) FROM articles WHERE status = :status AND search_vector @@ plainto_tsquery('simple', :query)",
           nativeQuery = true)
    Page<Article> fullTextSearch(@Param("query") String query, @Param("status") String status, Pageable pageable);

    List<Article> findByStatusAndSummaryIsNullOrderByCreatedAtAsc(Article.Status status);

    @Query("SELECT a FROM Article a WHERE a.status = 'PUBLISHED' ORDER BY a.viewCount DESC")
    List<Article> findTrending(Pageable pageable);

    @Query("SELECT a FROM Article a WHERE a.status = 'PUBLISHED' ORDER BY a.publishedAt DESC")
    List<Article> findLatestPublished(Pageable pageable);

    @Modifying
    @Query("UPDATE Article a SET a.viewCount = a.viewCount + 1 WHERE a.id = :id")
    void incrementViewCount(@Param("id") Long id);

    @Query("SELECT COUNT(a) FROM Article a WHERE a.createdAt >= :since")
    long countArticlesSince(@Param("since") LocalDateTime since);

    @Query("SELECT a.sourceName, COUNT(a) FROM Article a GROUP BY a.sourceName")
    List<Object[]> countBySource();
}
