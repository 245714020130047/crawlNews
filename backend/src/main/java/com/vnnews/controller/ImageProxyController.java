package com.vnnews.controller;

import com.vnnews.service.ImageProxyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/proxy")
@RequiredArgsConstructor
public class ImageProxyController {

    private final ImageProxyService imageProxyService;

    @GetMapping("/image")
    public ResponseEntity<byte[]> proxyImage(@RequestParam String url) {
        return imageProxyService.proxyImage(url);
    }
}
