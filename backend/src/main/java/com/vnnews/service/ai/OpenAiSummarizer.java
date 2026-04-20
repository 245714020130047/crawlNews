package com.vnnews.service.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class OpenAiSummarizer implements AiSummarizer {

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String getProvider() {
        return "OPENAI";
    }

    @Override
    public String summarize(String content, String promptTemplate) {
        throw new UnsupportedOperationException("Use summarize(content, promptTemplate, apiKey, model)");
    }

    public String summarize(String content, String promptTemplate, String apiKey, String model) {
        String prompt = promptTemplate.replace("{content}", truncateContent(content));
        String url = "https://api.openai.com/v1/chat/completions";

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", "You are a Vietnamese news summarizer."),
                        Map.of("role", "user", "content", prompt)
                ),
                "max_tokens", 500,
                "temperature", 0.3
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            return extractText(response.getBody());
        } catch (Exception e) {
            log.error("OpenAI API call failed", e);
            throw new RuntimeException("AI summarization failed: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map body) {
        if (body == null) return "";
        List<Map> choices = (List<Map>) body.get("choices");
        if (choices == null || choices.isEmpty()) return "";
        Map message = (Map) choices.get(0).get("message");
        return message != null ? (String) message.get("content") : "";
    }

    private String truncateContent(String content) {
        String text = content.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim();
        return text.length() > 4000 ? text.substring(0, 4000) : text;
    }
}
