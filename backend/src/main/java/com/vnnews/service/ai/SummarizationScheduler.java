package com.vnnews.service.ai;

import com.vnnews.entity.Article;
import com.vnnews.repository.ArticleRepository;
import com.vnnews.service.SchedulerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class SummarizationScheduler {

    private final AiSummarizerFactory aiSummarizerFactory;
    private final ArticleRepository articleRepository;
    private final SchedulerService schedulerService;

    @Scheduled(fixedDelayString = "${app.ai.summarization-interval:3600000}")
    public void autoSummarize() {
        if (!schedulerService.isJobEnabled("SUMMARIZATION")) {
            log.debug("Summarization scheduler disabled");
            return;
        }
        log.info("Auto-summarization starting...");
        // Find published articles without summary
        Page<Article> articles = articleRepository.findByStatus(
                Article.Status.PUBLISHED, PageRequest.of(0, 10));

        for (Article article : articles) {
            if (article.getSummary() == null || article.getSummary().isBlank()) {
                try {
                    aiSummarizerFactory.summarizeArticle(article.getId());
                    log.info("Summarized article: {}", article.getTitle());
                    // Rate limit: sleep 2s between API calls
                    Thread.sleep(2000);
                } catch (Exception e) {
                    log.warn("Failed to summarize article {}: {}", article.getId(), e.getMessage());
                }
            }
        }
        log.info("Auto-summarization finished");
    }
}
