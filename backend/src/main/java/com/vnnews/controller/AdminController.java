package com.vnnews.controller;

import com.vnnews.dto.ArticleDto;
import com.vnnews.dto.CategoryDto;
import com.vnnews.dto.DashboardDto;
import com.vnnews.entity.Article;
import com.vnnews.entity.IpBlacklist;
import com.vnnews.entity.SchedulerConfig;
import com.vnnews.entity.User;
import com.vnnews.repository.UserRepository;
import com.vnnews.service.*;
import com.vnnews.service.ai.AiSummarizerFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final ArticleService articleService;
    private final CategoryService categoryService;
    private final DashboardService dashboardService;
    private final SchedulerService schedulerService;
    private final IpBlacklistService ipBlacklistService;
    private final ArticleViewService articleViewService;
    private final UserRepository userRepository;
    private final AiSummarizerFactory aiSummarizerFactory;
    private final CrawlOrchestrator crawlOrchestrator;

    // Dashboard
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDto> dashboard() {
        return ResponseEntity.ok(dashboardService.getDashboard());
    }

    // Articles CRUD
    @GetMapping("/articles")
    public ResponseEntity<Page<ArticleDto>> getArticles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        if (status != null) {
            return ResponseEntity.ok(articleService.getArticlesByStatus(
                    Article.Status.valueOf(status.toUpperCase()),
                    PageRequest.of(page, size, Sort.by("publishedAt").descending())));
        }
        return ResponseEntity.ok(articleService.getLatestArticles(
                PageRequest.of(page, size, Sort.by("publishedAt").descending())));
    }

    @PutMapping("/articles/{id}")
    public ResponseEntity<ArticleDto> updateArticle(@PathVariable Long id, @RequestBody ArticleDto dto) {
        return ResponseEntity.ok(articleService.updateArticle(id, dto));
    }

    @DeleteMapping("/articles/{id}")
    public ResponseEntity<Void> deleteArticle(@PathVariable Long id) {
        articleService.deleteArticle(id);
        return ResponseEntity.noContent().build();
    }

    // Categories CRUD
    @GetMapping("/categories")
    public ResponseEntity<List<CategoryDto>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<CategoryDto> createCategory(@RequestBody CategoryDto dto) {
        return ResponseEntity.ok(categoryService.createCategory(dto));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<CategoryDto> updateCategory(@PathVariable Long id, @RequestBody CategoryDto dto) {
        return ResponseEntity.ok(categoryService.updateCategory(id, dto));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    // Users
    @GetMapping("/users")
    public ResponseEntity<List<User>> getUsers() {
        List<User> users = userRepository.findAll();
        users.forEach(u -> u.setPasswordHash(null)); // Hide password
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<Void> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(User.Role.valueOf(body.get("role").toUpperCase()));
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    // Scheduler
    @GetMapping("/schedulers")
    public ResponseEntity<List<SchedulerConfig>> getSchedulers() {
        return ResponseEntity.ok(schedulerService.getAllConfigs());
    }

    @PutMapping("/schedulers/{jobName}/toggle")
    public ResponseEntity<SchedulerConfig> toggleScheduler(
            @PathVariable String jobName,
            @RequestBody Map<String, Boolean> body,
            Authentication auth) {
        return ResponseEntity.ok(schedulerService.toggleJob(jobName, body.get("enabled"), auth.getName()));
    }

    // Crawl
    @PostMapping("/crawl/trigger")
    public ResponseEntity<Map<String, String>> triggerCrawl() {
        crawlOrchestrator.crawlAllSources();
        return ResponseEntity.ok(Map.of("message", "Crawl triggered successfully"));
    }

    // AI Summarization
    @PostMapping("/articles/{id}/summarize")
    public ResponseEntity<ArticleDto> summarizeArticle(@PathVariable Long id) {
        return ResponseEntity.ok(aiSummarizerFactory.summarizeArticle(id));
    }

    // IP Blacklist
    @GetMapping("/ip-blacklist")
    public ResponseEntity<Page<IpBlacklist>> getBlacklist(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ipBlacklistService.getAll(PageRequest.of(page, size)));
    }

    @PostMapping("/ip-blacklist")
    public ResponseEntity<IpBlacklist> blockIp(@RequestBody Map<String, String> body, Authentication auth) {
        LocalDateTime blockedUntil = body.containsKey("blockedUntil")
                ? LocalDateTime.parse(body.get("blockedUntil")) : null;
        return ResponseEntity.ok(ipBlacklistService.blockIp(
                body.get("ipAddress"), body.get("reason"), blockedUntil, auth.getName()));
    }

    @DeleteMapping("/ip-blacklist/{id}")
    public ResponseEntity<Void> unblockIp(@PathVariable Long id) {
        ipBlacklistService.unblockIp(id);
        return ResponseEntity.noContent().build();
    }

    // Analytics
    @GetMapping("/analytics/views")
    public ResponseEntity<List<Map<String, Object>>> getViewsByDay(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(articleViewService.getViewsByDay(LocalDateTime.now().minusDays(days)));
    }

    @GetMapping("/analytics/countries")
    public ResponseEntity<List<Map<String, Object>>> getViewsByCountry(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(articleViewService.getViewsByCountry(LocalDateTime.now().minusDays(days)));
    }
}
