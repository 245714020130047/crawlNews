package com.vnnews.service.ai;

public interface AiSummarizer {
    String getProvider();
    String summarize(String content, String promptTemplate);
}
