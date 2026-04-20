package com.vnnews.service;

import com.vnnews.entity.SchedulerConfig;
import com.vnnews.repository.SchedulerConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SchedulerService {

    private final SchedulerConfigRepository schedulerConfigRepository;

    public List<SchedulerConfig> getAllConfigs() {
        return schedulerConfigRepository.findAll();
    }

    public Optional<SchedulerConfig> getByJobName(String jobName) {
        return schedulerConfigRepository.findByJobName(jobName);
    }

    public boolean isJobEnabled(String jobName) {
        return schedulerConfigRepository.findByJobName(jobName)
                .map(SchedulerConfig::getEnabled)
                .orElse(false);
    }

    @Transactional
    public SchedulerConfig toggleJob(String jobName, boolean enabled, String updatedBy) {
        SchedulerConfig config = schedulerConfigRepository.findByJobName(jobName)
                .orElseThrow(() -> new RuntimeException("Scheduler config not found: " + jobName));
        config.setEnabled(enabled);
        config.setUpdatedBy(updatedBy);
        config.setUpdatedAt(LocalDateTime.now());
        return schedulerConfigRepository.save(config);
    }

    @Transactional
    public SchedulerConfig updateCron(String jobName, String cronExpression, String updatedBy) {
        SchedulerConfig config = schedulerConfigRepository.findByJobName(jobName)
                .orElseThrow(() -> new RuntimeException("Scheduler config not found: " + jobName));
        config.setCronExpression(cronExpression);
        config.setUpdatedBy(updatedBy);
        config.setUpdatedAt(LocalDateTime.now());
        return schedulerConfigRepository.save(config);
    }
}
