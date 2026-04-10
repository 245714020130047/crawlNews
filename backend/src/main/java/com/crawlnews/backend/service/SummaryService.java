package com.crawlnews.backend.service;

import com.crawlnews.backend.domain.*;
import com.crawlnews.backend.repository.NewsSummaryRepository;
import com.crawlnews.backend.repository.SummaryJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SummaryService {

    private final SummaryJobRepository summaryJobRepository;
    private final NewsSummaryRepository newsSummaryRepository;
    private final AppConfigService appConfigService;

    @Value("${app.summary.api-key:}")
    private String apiKey;

    @Value("${app.summary.model:gpt-4.1-mini}")
    private String model;

    @Value("${app.summary.max-tokens-per-job:2000}")
    private int maxTokensPerJob;

    /**
     * Enqueue a article for summarization
     */
    @Transactional
    public SummaryJob enqueue(NewsArticle article, TriggerMode mode, String triggeredBy) {
        // Check if already queued or processing
        boolean alreadyQueued = summaryJobRepository.existsByArticleIdAndStatusIn(
                article.getId(),
                List.of(SummaryJobStatus.QUEUED, SummaryJobStatus.PROCESSING));
        if (alreadyQueued) {
            log.info("Summary job already exists for article id={}", article.getId());
            return summaryJobRepository.findByArticleIdAndStatusIn(
                    article.getId(),
                    List.of(SummaryJobStatus.QUEUED, SummaryJobStatus.PROCESSING))
                    .orElseThrow();
        }

        SummaryJob job = new SummaryJob();
        job.setArticle(article);
        job.setTriggerMode(mode);
        job.setTriggeredBy(triggeredBy);
        job.setStatus(SummaryJobStatus.QUEUED);
        job.setPriority(mode == TriggerMode.MANUAL ? 1 : 5);
        log.info("Enqueueing summary job: articleId={} mode={} by={}", article.getId(), mode, triggeredBy);
        return summaryJobRepository.save(job);
    }

    @Transactional(readOnly = true)
    public Optional<NewsSummary> findSummaryByArticleId(Long articleId) {
        return newsSummaryRepository.findByArticleId(articleId);
    }

    @Transactional(readOnly = true)
    public Page<SummaryJob> findAllJobs(Pageable pageable) {
        return summaryJobRepository.findAllByOrderByPriorityAscCreatedAtAsc(pageable);
    }

    @Transactional
    public NewsSummary updateSummary(Long articleId, String shortSummary, String standardSummary, String reviewedBy) {
        NewsSummary summary = newsSummaryRepository.findByArticleId(articleId)
                .orElseThrow(() -> new IllegalArgumentException("Summary not found for article: " + articleId));
        summary.setShortSummary(shortSummary);
        summary.setStandardSummary(standardSummary);
        summary.setReviewStatus(SummaryReviewStatus.EDITED);
        summary.setReviewedBy(reviewedBy);
        summary.setReviewedAt(OffsetDateTime.now());
        log.info("Summary manually edited: articleId={} by={}", articleId, reviewedBy);
        return newsSummaryRepository.save(summary);
    }

    @Transactional
    public void cancelJob(Long jobId) {
        summaryJobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(SummaryJobStatus.CANCELLED);
            summaryJobRepository.save(job);
            log.info("Summary job cancelled: id={}", jobId);
        });
    }
}
