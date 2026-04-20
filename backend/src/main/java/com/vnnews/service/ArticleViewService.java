package com.vnnews.service;

import com.vnnews.entity.ArticleView;
import com.vnnews.entity.User;
import com.vnnews.repository.ArticleRepository;
import com.vnnews.repository.ArticleViewRepository;
import com.vnnews.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ArticleViewService {

    private final ArticleViewRepository articleViewRepository;
    private final ArticleRepository articleRepository;
    private final UserRepository userRepository;
    private final GeoIpService geoIpService;

    @Transactional
    public void recordView(Long articleId, HttpServletRequest request, String username) {
        String ip = getClientIp(request);
        // Avoid duplicate views from same IP within 30 minutes
        if (articleViewRepository.existsByArticleIdAndIpAddressAndViewedAtAfter(
                articleId, ip, LocalDateTime.now().minusMinutes(30))) {
            return;
        }

        ArticleView view = new ArticleView();
        view.setArticle(articleRepository.findById(articleId).orElse(null));
        view.setIpAddress(ip);
        view.setUserAgent(request.getHeader("User-Agent"));
        view.setViewedAt(LocalDateTime.now());

        if (username != null) {
            userRepository.findByUsername(username).ifPresent(view::setUser);
        }

        // GeoIP lookup
        Map<String, String> geoData = geoIpService.lookup(ip);
        view.setCity(geoData.get("city"));
        view.setRegion(geoData.get("region"));
        view.setCountry(geoData.get("country"));

        articleViewRepository.save(view);
        articleRepository.incrementViewCount(articleId);
    }

    public long getViewsSince(LocalDateTime since) {
        return articleViewRepository.countViewsSince(since);
    }

    public List<Map<String, Object>> getViewsByDay(LocalDateTime since) {
        return articleViewRepository.countByDaySince(since).stream()
                .map(row -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("date", row[0]);
                    map.put("views", row[1]);
                    return map;
                }).toList();
    }

    public List<Map<String, Object>> getViewsByCountry(LocalDateTime since) {
        return articleViewRepository.countByCountrySince(since).stream()
                .map(row -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("country", row[0]);
                    map.put("views", row[1]);
                    return map;
                }).toList();
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
