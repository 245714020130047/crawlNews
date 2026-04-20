package com.vnnews.repository;

import com.vnnews.entity.ArticleView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ArticleViewRepository extends JpaRepository<ArticleView, Long> {

    boolean existsByArticleIdAndIpAddressAndViewedAtAfter(Long articleId, String ipAddress, LocalDateTime after);

    @Query("SELECT COUNT(av) FROM ArticleView av WHERE av.viewedAt >= :since")
    long countViewsSince(@Param("since") LocalDateTime since);

    @Query("SELECT av.country, COUNT(av) FROM ArticleView av WHERE av.viewedAt >= :since GROUP BY av.country ORDER BY COUNT(av) DESC")
    List<Object[]> countByCountrySince(@Param("since") LocalDateTime since);

    @Query("SELECT av.city, COUNT(av) FROM ArticleView av WHERE av.viewedAt >= :since GROUP BY av.city ORDER BY COUNT(av) DESC")
    List<Object[]> countByCitySince(@Param("since") LocalDateTime since);

    @Query("SELECT CAST(av.viewedAt AS date), COUNT(av) FROM ArticleView av WHERE av.viewedAt >= :since GROUP BY CAST(av.viewedAt AS date) ORDER BY CAST(av.viewedAt AS date)")
    List<Object[]> countByDaySince(@Param("since") LocalDateTime since);
}
