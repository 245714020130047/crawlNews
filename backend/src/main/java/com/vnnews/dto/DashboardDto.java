package com.vnnews.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDto {
    private long totalArticles;
    private long viewsToday;
    private long articlesToday;
    private List<Map<String, Object>> sourceBreakdown;
    private List<Map<String, Object>> viewsByDay;
}
