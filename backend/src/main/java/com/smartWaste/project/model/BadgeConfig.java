package com.smartWaste.project.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "badge_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BadgeConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "badge_key", nullable = false, unique = true, length = 80)
    private String badgeKey;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 16)
    private String icon;

    @Column(length = 500)
    private String description;

    @Column(name = "criteria_label", length = 120)
    private String criteriaLabel;

    @Column(name = "criteria_type", nullable = false, length = 40)
    private String criteriaType;

    @Column(name = "criteria_threshold", nullable = false)
    private Integer criteriaThreshold = 1;

    @Column(name = "points_reward", nullable = false)
    private Integer pointsReward = 0;

    @Column(length = 20)
    private String color;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

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
