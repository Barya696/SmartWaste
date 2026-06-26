package com.smartWaste.project.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Stores each role-permission toggle (e.g. "Citizen can submit reports").
 */
@Entity
@Table(name = "role_permission")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RolePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Role group name, e.g. "Citizen", "Collector", "Supervisor", "Administrator" */
    @Column(name = "role", nullable = false, length = 60)
    private String role;

    /** Unique identifier slug, e.g. "submit-report" */
    @Column(name = "permission_key", nullable = false, unique = true, length = 80)
    private String permissionKey;

    /** Human-readable permission label */
    @Column(name = "label", nullable = false, length = 200)
    private String label;

    /** Whether this permission is currently granted */
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
