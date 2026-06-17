package com.smartWaste.project.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "compensation")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Compensation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "assignment_id", nullable = false, unique = true)
    private Long assignmentId;

    @Column(name = "assign_partner_id")
    private Long assignPartnerId;

    @Column(name = "citizen_id", nullable = false)
    private Long citizenId;

    @Column(name = "collector_id", nullable = false)
    private Long collectorId;

    @Column(name = "supervisor_id")
    private Long supervisorId;

    @Column(name = "partner_id")
    private Long partnerId;

    // Combined material summary, e.g. "Plastic, Metal"
    @Column(name = "material_type", length = 255)
    private String materialType;

    // Total weight across all materials
    @Column(name = "weight_kg")
    private Double weightKg;

    // JSON breakdown per material line, for receipt rendering
    // e.g. [{"type":"Plastic","weightKg":3.0,"pricePerKg":500,"gross":1500}, ...]
    @Column(name = "material_breakdown", columnDefinition = "TEXT")
    private String materialBreakdown;

    // Blended price (gross / total weight), useful for display
    @Column(name = "price_per_kg")
    private Double pricePerKg;

    @Column(name = "gross_amount", nullable = false)
    private Double grossAmount;

    @Column(name = "vat_pct", nullable = false)
    private Double vatPct;

    @Column(name = "vat_amount", nullable = false)
    private Double vatAmount;

    @Column(name = "env_levy_pct", nullable = false)
    private Double envLevyPct;

    @Column(name = "env_levy_amount", nullable = false)
    private Double envLevyAmount;

    @Column(name = "net_amount", nullable = false)
    private Double netAmount;

    @Column(name = "citizen_pct", nullable = false)
    private Double citizenPct;

    @Column(name = "citizen_amount", nullable = false)
    private Double citizenAmount;

    @Column(name = "collector_pct", nullable = false)
    private Double collectorPct;

    @Column(name = "collector_amount", nullable = false)
    private Double collectorAmount;

    @Column(name = "system_pct", nullable = false)
    private Double systemPct;

    @Column(name = "system_amount", nullable = false)
    private Double systemAmount;

    @Column(name = "compensated_at", nullable = false)
    private LocalDateTime compensatedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (compensatedAt == null) {
            compensatedAt = LocalDateTime.now();
        }
    }
}
