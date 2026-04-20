package com.vnnews.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ip_blacklist")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class IpBlacklist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ip_address", nullable = false, unique = true, columnDefinition = "inet")
    private String ipAddress;

    @Column(length = 500)
    private String reason;

    @Column(name = "blocked_at", nullable = false)
    private LocalDateTime blockedAt;

    @Column(name = "blocked_until")
    private LocalDateTime blockedUntil;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @PrePersist
    protected void onCreate() {
        blockedAt = LocalDateTime.now();
    }
}
