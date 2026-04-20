package com.vnnews.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
@RequiredArgsConstructor
public class ImageProxyService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ConcurrentHashMap<String, byte[]> imageCache = new ConcurrentHashMap<>();

    @Value("${app.image-proxy.max-cache-size:500}")
    private int maxCacheSize;

    public ResponseEntity<byte[]> proxyImage(String url) {
        if (url == null || url.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        // Validate URL to prevent SSRF
        if (!url.startsWith("https://") && !url.startsWith("http://")) {
            return ResponseEntity.badRequest().build();
        }

        byte[] cached = imageCache.get(url);
        if (cached != null) {
            return buildResponse(cached, url);
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 VnNewsBot");
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, entity, byte[].class);

            if (response.getBody() != null && imageCache.size() < maxCacheSize) {
                imageCache.put(url, response.getBody());
            }
            return buildResponse(response.getBody(), url);
        } catch (Exception e) {
            log.warn("Image proxy failed for URL: {}", url, e);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }

    private ResponseEntity<byte[]> buildResponse(byte[] body, String url) {
        HttpHeaders responseHeaders = new HttpHeaders();
        if (url.endsWith(".png")) responseHeaders.setContentType(MediaType.IMAGE_PNG);
        else if (url.endsWith(".gif")) responseHeaders.setContentType(MediaType.IMAGE_GIF);
        else if (url.endsWith(".webp")) responseHeaders.setContentType(MediaType.parseMediaType("image/webp"));
        else responseHeaders.setContentType(MediaType.IMAGE_JPEG);
        responseHeaders.setCacheControl(CacheControl.maxAge(java.time.Duration.ofHours(24)));
        return new ResponseEntity<>(body, responseHeaders, HttpStatus.OK);
    }
}
