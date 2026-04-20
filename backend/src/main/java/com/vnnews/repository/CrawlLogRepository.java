package com.vnnews.repository;

import com.vnnews.entity.CrawlLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CrawlLogRepository extends JpaRepository<CrawlLog, Long> {
    List<CrawlLog> findByOrderByStartedAtDesc(Pageable pageable);
}
