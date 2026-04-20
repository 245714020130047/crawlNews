package com.vnnews.service;

import com.vnnews.dto.DashboardDto;
import com.vnnews.repository.ArticleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ArticleRepository articleRepository;
    private final ArticleViewService articleViewService;

    public DashboardDto getDashboard() {
        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime last30Days = LocalDateTime.now().minusDays(30);

        long totalArticles = articleRepository.count();
        long articlesToday = articleRepository.countArticlesSince(today);
        long viewsToday = articleViewService.getViewsSince(today);

        List<Object[]> sourceCounts = articleRepository.countBySource();
        List<Map<String, Object>> sourceBreakdown = sourceCounts.stream()
                .map(row -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("source", row[0]);
                    map.put("count", row[1]);
                    return map;
                }).toList();

        List<Map<String, Object>> viewsByDay = articleViewService.getViewsByDay(last30Days);

        return DashboardDto.builder()
                .totalArticles(totalArticles)
                .articlesToday(articlesToday)
                .viewsToday(viewsToday)
                .sourceBreakdown(sourceBreakdown)
                .viewsByDay(viewsByDay)
                .build();
    }
}
