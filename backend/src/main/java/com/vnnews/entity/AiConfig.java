package com.vnnews.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_configs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AiConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(name = "api_key_encrypted", length = 500)
    private String apiKeyEncrypted;

    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Column(name = "max_tokens", nullable = false)
    private Integer maxTokens;

    @Column(nullable = false)
    private Double temperature;

    @Column(nullable = false)
    private Boolean active;

    @Column(name = "prompt_template", nullable = false, columnDefinition = "TEXT")
    private String promptTemplate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
