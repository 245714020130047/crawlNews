package com.vnnews.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleDto {
    private Long id;
    private String title;
    private String slug;
    private String summary;
    private String content;
    private String thumbnailUrl;
    private String sourceUrl;
    private String sourceName;
    private String categoryName;
    private String categorySlug;
    private LocalDateTime publishedAt;
    private String status;
    private Long viewCount;
    private Map<String, Object> metadata;
}
