package com.vnnews.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "crawl_logs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CrawlLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "crawl_config_id", nullable = false)
    private CrawlConfig crawlConfig;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "articles_found", nullable = false)
    private Integer articlesFound;

    @Column(name = "articles_saved", nullable = false)
    private Integer articlesSaved;

    @Type(JsonType.class)
    @Column(name = "errors", columnDefinition = "jsonb")
    @Builder.Default
    private List<Map<String, String>> errors = new ArrayList<>();

    @Column(nullable = false, length = 20)
    private String status;

    @PrePersist
    protected void onCreate() {
        startedAt = LocalDateTime.now();
        if (articlesFound == null) articlesFound = 0;
        if (articlesSaved == null) articlesSaved = 0;
        if (status == null) status = "RUNNING";
    }
}
