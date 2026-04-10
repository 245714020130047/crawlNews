package com.crawlnews.backend.repository;

import com.crawlnews.backend.domain.CrawlJob;
import com.crawlnews.backend.domain.CrawlJobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CrawlJobRepository extends JpaRepository<CrawlJob, Long> {
    Page<CrawlJob> findBySourceIdOrderByCreatedAtDesc(Long sourceId, Pageable pageable);
    Page<CrawlJob> findByStatusOrderByCreatedAtDesc(CrawlJobStatus status, Pageable pageable);
    Page<CrawlJob> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT j FROM CrawlJob j WHERE j.source.id = :sourceId ORDER BY j.createdAt DESC")
    List<CrawlJob> findLatestBySourceId(@Param("sourceId") Long sourceId, Pageable pageable);

    @Query(value = "SELECT COUNT(*) FROM crawl_job j WHERE j.status = :#{#status.name()} AND j.source_id = :sourceId AND j.created_at >= NOW() - INTERVAL '7 days'", nativeQuery = true)
    long countBySourceIdAndStatusLast7Days(@Param("sourceId") Long sourceId, @Param("status") CrawlJobStatus status);

    List<CrawlJob> findByStatusIn(List<CrawlJobStatus> statuses);
}
