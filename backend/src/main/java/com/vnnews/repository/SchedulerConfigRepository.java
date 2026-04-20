package com.vnnews.repository;

import com.vnnews.entity.SchedulerConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SchedulerConfigRepository extends JpaRepository<SchedulerConfig, Long> {
    Optional<SchedulerConfig> findByJobName(String jobName);
}
