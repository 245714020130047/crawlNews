package com.vnnews.service.ai;

import com.vnnews.dto.ArticleDto;
import com.vnnews.entity.AiConfig;
import com.vnnews.entity.Article;
import com.vnnews.repository.AiConfigRepository;
import com.vnnews.repository.ArticleRepository;
import com.vnnews.service.ArticleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiSummarizerFactory {

    private final AiConfigRepository aiConfigRepository;
    private final ArticleRepository articleRepository;
    private final ArticleService articleService;
    private final GeminiSummarizer geminiSummarizer;
    private final OpenAiSummarizer openAiSummarizer;

    public ArticleDto summarizeArticle(Long articleId) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("Article not found: " + articleId));

        AiConfig config = aiConfigRepository.findByActiveTrue()
                .orElseThrow(() -> new RuntimeException("No active AI config found"));

        String summary;
        if ("GEMINI".equalsIgnoreCase(config.getProvider())) {
            summary = geminiSummarizer.summarize(
                    article.getContent(), config.getPromptTemplate(),
                    config.getApiKeyEncrypted(), config.getModelName());
        } else if ("OPENAI".equalsIgnoreCase(config.getProvider())) {
            summary = openAiSummarizer.summarize(
                    article.getContent(), config.getPromptTemplate(),
                    config.getApiKeyEncrypted(), config.getModelName());
        } else {
            throw new RuntimeException("Unknown AI provider: " + config.getProvider());
        }

        return articleService.updateSummary(articleId, summary);
    }
}
