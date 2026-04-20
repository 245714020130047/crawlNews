package com.vnnews.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "category_mappings", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"source_name", "source_category"})
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CategoryMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_name", nullable = false, length = 50)
    private String sourceName;

    @Column(name = "source_category", nullable = false, length = 200)
    private String sourceCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
