package com.crawlnews.backend.repository;

import com.crawlnews.backend.domain.AppConfigEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppConfigRepository extends JpaRepository<AppConfigEntity, String> {
}
