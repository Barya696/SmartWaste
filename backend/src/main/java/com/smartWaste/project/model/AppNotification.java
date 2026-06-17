package com.smartWaste.project.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "app_notification",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "source_key"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "source_key", nullable = false, length = 120)
    private String sourceKey;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private NotificationType type = NotificationType.INFO;

    @Column(name = "read", nullable = false)
    private boolean isRead = false;

    @Column(name = "event_at", nullable = false)
    private LocalDateTime eventAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (eventAt == null) {
            eventAt = createdAt;
        }
    }

    public enum NotificationType {
        INFO,
        SUCCESS,
        WARNING,
        ACTION
    }
}
