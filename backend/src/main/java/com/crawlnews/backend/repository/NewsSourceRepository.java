package com.crawlnews.backend.repository;

import com.crawlnews.backend.domain.NewsSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NewsSourceRepository extends JpaRepository<NewsSource, Long> {
    Optional<NewsSource> findBySlug(String slug);
    List<NewsSource> findByIsActiveTrue();
    List<NewsSource> findByIsActiveTrueOrderByName();
}
