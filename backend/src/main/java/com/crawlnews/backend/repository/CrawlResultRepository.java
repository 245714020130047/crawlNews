package com.crawlnews.backend.repository;

import com.crawlnews.backend.domain.CrawlResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CrawlResultRepository extends JpaRepository<CrawlResult, Long> {
    List<CrawlResult> findByCrawlJobId(Long crawlJobId);
    List<CrawlResult> findByArticleId(Long articleId);
}
