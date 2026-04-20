package com.vnnews.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scheduler_configs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SchedulerConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_name", nullable = false, unique = true, length = 50)
    private String jobName;

    @Column(nullable = false)
    private Boolean enabled;

    @Column(name = "cron_expression", nullable = false, length = 100)
    private String cronExpression;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        updatedAt = LocalDateTime.now();
        if (enabled == null) enabled = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
