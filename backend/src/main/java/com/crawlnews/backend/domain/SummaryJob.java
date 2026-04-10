package com.crawlnews.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "summary_job")
@Getter
@Setter
public class SummaryJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_id", nullable = false)
    private NewsArticle article;

    @Column
    private Integer priority = 5;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SummaryJobStatus status = SummaryJobStatus.QUEUED;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_mode", length = 10)
    private TriggerMode triggerMode;

    @Column(name = "triggered_by", length = 200)
    private String triggeredBy;

    @Column(name = "max_retries")
    private Integer maxRetries = 3;

    @Column(name = "retry_count")
    private Integer retryCount = 0;

    @Column(name = "next_retry_at")
    private OffsetDateTime nextRetryAt;

    @Column(name = "locked_at")
    private OffsetDateTime lockedAt;

    @Column(name = "locked_by", length = 200)
    private String lockedBy;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
