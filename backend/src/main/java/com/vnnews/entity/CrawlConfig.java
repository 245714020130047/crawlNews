package com.vnnews.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "crawl_configs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CrawlConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_name", nullable = false, unique = true, length = 50)
    private String sourceName;

    @Column(name = "base_url", nullable = false, length = 500)
    private String baseUrl;

    @Column(name = "rss_url", nullable = false, length = 500)
    private String rssUrl;

    @Type(JsonType.class)
    @Column(name = "selectors", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private Map<String, String> selectors = new HashMap<>();

    @Column(nullable = false)
    private Boolean active;

    @Column(name = "crawl_interval_minutes", nullable = false)
    private Integer crawlIntervalMinutes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (active == null) active = true;
        if (crawlIntervalMinutes == null) crawlIntervalMinutes = 30;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
