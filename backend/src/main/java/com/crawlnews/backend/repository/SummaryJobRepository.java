package com.crawlnews.backend.repository;

import com.crawlnews.backend.domain.SummaryJob;
import com.crawlnews.backend.domain.SummaryJobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SummaryJobRepository extends JpaRepository<SummaryJob, Long> {
    Optional<SummaryJob> findByArticleIdAndStatusIn(Long articleId, List<SummaryJobStatus> statuses);
    Page<SummaryJob> findAllByOrderByPriorityAscCreatedAtAsc(Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT j FROM SummaryJob j WHERE j.status = 'QUEUED' AND (j.nextRetryAt IS NULL OR j.nextRetryAt <= :now)" +
           " ORDER BY j.priority ASC, j.createdAt ASC")
    List<SummaryJob> findPendingJobs(@Param("now") OffsetDateTime now, Pageable pageable);

    long countByStatus(SummaryJobStatus status);
    boolean existsByArticleIdAndStatusIn(Long articleId, List<SummaryJobStatus> statuses);
}
