package com.vnnews.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "article_views")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ArticleView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_id", nullable = false)
    private Article article;

    @Column(name = "ip_address", nullable = false, columnDefinition = "inet")
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String region;

    @Column(length = 100)
    private String country;

    @Type(JsonType.class)
    @Column(name = "geo_data", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> geoData = new HashMap<>();

    @Column(name = "viewed_at", nullable = false)
    private LocalDateTime viewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @PrePersist
    protected void onCreate() {
        viewedAt = LocalDateTime.now();
    }
}
