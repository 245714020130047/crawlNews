package com.crawlnews.backend.repository;

import com.crawlnews.backend.domain.NewsSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NewsSummaryRepository extends JpaRepository<NewsSummary, Long> {
    Optional<NewsSummary> findByArticleId(Long articleId);
    boolean existsByArticleId(Long articleId);
}
