package com.vnnews.repository;

import com.vnnews.entity.CrawlConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CrawlConfigRepository extends JpaRepository<CrawlConfig, Long> {
    List<CrawlConfig> findByActiveTrue();
    Optional<CrawlConfig> findBySourceName(String sourceName);
}
