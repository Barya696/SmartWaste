package com.smartWaste.project.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Stores each notification toggle setting (e.g. "New waste report submitted").
 */
@Entity
@Table(name = "notification_setting")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Group name, e.g. "Reports", "Collections", "System" */
    @Column(name = "category", nullable = false, length = 80)
    private String category;

    /** Unique identifier slug, e.g. "new-report" */
    @Column(name = "setting_key", nullable = false, unique = true, length = 80)
    private String settingKey;

    /** Human-readable label shown in the UI */
    @Column(name = "label", nullable = false, length = 200)
    private String label;

    /** Whether this notification is enabled */
    @Column(name = "enabled", nullable = false)
    private Boolean enabled = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
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
