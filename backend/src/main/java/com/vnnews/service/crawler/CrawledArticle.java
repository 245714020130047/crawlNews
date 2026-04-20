package com.vnnews.service.crawler;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrawledArticle {
    private String title;
    private String content;
    private String thumbnailUrl;
    private String sourceUrl;
    private String sourceName;
    private String sourceCategory;
    private LocalDateTime publishedAt;
}
