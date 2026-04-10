package com.crawlnews.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "crawl_job")
@Getter
@Setter
public class CrawlJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_id", nullable = false)
    private NewsSource source;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_type", nullable = false, length = 20)
    private CrawlJobType jobType = CrawlJobType.SCHEDULED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CrawlJobStatus status = CrawlJobStatus.PENDING;

    @Column(name = "trigger_type", length = 10)
    private String triggerType;

    @Column(name = "triggered_by", length = 200)
    private String triggeredBy;

    @Column(name = "parser_version", length = 50)
    private String parserVersion;

    @Column(name = "articles_found")
    private Integer articlesFound = 0;

    @Column(name = "articles_new")
    private Integer articlesNew = 0;

    @Column(name = "articles_updated")
    private Integer articlesUpdated = 0;

    @Column(name = "articles_skipped")
    private Integer articlesSkipped = 0;

    @Column(name = "articles_failed")
    private Integer articlesFailed = 0;

    @Column(name = "robots_checked")
    private Boolean robotsChecked = false;

    @Column(name = "robots_allowed")
    private Boolean robotsAllowed;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "finished_at")
    private OffsetDateTime finishedAt;

    @Column(name = "duration_ms")
    private Long durationMs;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
