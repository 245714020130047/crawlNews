package com.vnnews.controller;

import com.vnnews.dto.ArticleDto;
import com.vnnews.service.ai.AiSummarizerFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
public class SummarizeController {

    private final AiSummarizerFactory aiSummarizerFactory;

    @PostMapping("/{id}/summarize")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ArticleDto> summarize(@PathVariable Long id) {
        return ResponseEntity.ok(aiSummarizerFactory.summarizeArticle(id));
    }
}
