package com.vnnews.service.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class GeminiSummarizer implements AiSummarizer {

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String getProvider() {
        return "GEMINI";
    }

    @Override
    public String summarize(String content, String promptTemplate) {
        // API key and model are passed via AiConfig, but here we get them from the calling context
        throw new UnsupportedOperationException("Use summarize(content, promptTemplate, apiKey, model)");
    }

    public String summarize(String content, String promptTemplate, String apiKey, String model) {
        String prompt = promptTemplate.replace("{content}", truncateContent(content));
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model
                + ":generateContent?key=" + apiKey;

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                        "maxOutputTokens", 500,
                        "temperature", 0.3
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            return extractText(response.getBody());
        } catch (Exception e) {
            log.error("Gemini API call failed", e);
            throw new RuntimeException("AI summarization failed: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map body) {
        if (body == null) return "";
        List<Map> candidates = (List<Map>) body.get("candidates");
        if (candidates == null || candidates.isEmpty()) return "";
        Map content = (Map) candidates.get(0).get("content");
        if (content == null) return "";
        List<Map> parts = (List<Map>) content.get("parts");
        if (parts == null || parts.isEmpty()) return "";
        return (String) parts.get(0).get("text");
    }

    private String truncateContent(String content) {
        // Strip HTML and truncate to ~4000 chars for API limits
        String text = content.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim();
        return text.length() > 4000 ? text.substring(0, 4000) : text;
    }
}
