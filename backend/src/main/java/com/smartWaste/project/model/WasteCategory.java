package com.smartWaste.project.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "waste_category")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WasteCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Display name, e.g. "Plastic", "Metal" */
    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    /** Emoji icon, e.g. "♻️" */
    @Column(name = "icon", length = 16)
    private String icon;

    /** Hex colour used in the UI, e.g. "#3b82f6" */
    @Column(name = "color", length = 20)
    private String color;

    /** Price per kilogram in CFA */
    @Column(name = "price_per_kg", nullable = false)
    private Double pricePerKg;

    /** Soft-delete flag */
    @Column(name = "active", nullable = false)
    private Boolean active = true;

    /** ID of the admin/supervisor who last updated this row */
    @Column(name = "updated_by")
    private Long updatedBy;

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
