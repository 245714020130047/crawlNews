package com.crawlnews.backend.service;

import com.crawlnews.backend.domain.AppConfigEntity;
import com.crawlnews.backend.repository.AppConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppConfigService {

    private final AppConfigRepository repository;

    @Transactional(readOnly = true)
    public String getValue(String key, String defaultValue) {
        return repository.findById(key)
                .map(AppConfigEntity::getValue)
                .orElse(defaultValue);
    }

    @Transactional(readOnly = true)
    public boolean getBoolean(String key, boolean defaultValue) {
        return repository.findById(key)
                .map(e -> Boolean.parseBoolean(e.getValue()))
                .orElse(defaultValue);
    }

    @Transactional(readOnly = true)
    public int getInt(String key, int defaultValue) {
        return repository.findById(key)
                .map(e -> {
                    try {
                        return Integer.parseInt(e.getValue());
                    } catch (NumberFormatException ex) {
                        log.warn("Invalid int value for config key '{}': {}", key, e.getValue());
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    @Transactional
    public AppConfigEntity setValue(String key, String value, String updatedBy) {
        AppConfigEntity config = repository.findById(key).orElseGet(() -> {
            AppConfigEntity e = new AppConfigEntity();
            e.setKey(key);
            e.setValueType("STRING");
            return e;
        });
        config.setValue(value);
        config.setUpdatedBy(updatedBy);
        log.info("Config updated: key={} value={} by={}", key, value, updatedBy);
        return repository.save(config);
    }

    public boolean isAutoSummaryEnabled() {
        return getBoolean("auto_summary_enabled", false);
    }

    public int getSummaryDailyLimit() {
        return getInt("summary_daily_limit", 500);
    }
}
