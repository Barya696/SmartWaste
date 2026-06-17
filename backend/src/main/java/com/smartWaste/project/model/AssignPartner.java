package com.smartWaste.project.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "assign_partner")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignPartner {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "assignment_id", nullable = false)
    private Long assignmentId;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assignment_id", insertable = false, updatable = false)
    private AssignCollector assignment;
    
    @Column(name = "partner_id", nullable = false)
    private Long partnerId;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "partner_id", insertable = false, updatable = false)
    private Partner partner;
    
    @Column(name = "material_type", length = 255)
    private String materialType;  // e.g. "Plastic, Metal, Glass"

    @Column(name = "weight_kg")
    private String weightKg;  // "2.50, 1.30, 0.80" — matches material_type order    
    // JSON breakdown per material line
    // e.g. [{"type":"Plastic","weightKg":3.0}, {"type":"Metal","weightKg":5.0}]
    @Column(name = "material_breakdown", columnDefinition = "TEXT")
    private String materialBreakdown;
    
    @Column(name = "citizen_id")
    private Long citizenId;
    
    @Column(name = "collector_id")
    private Long collectorId;
    
    @Column(name = "supervisor_id", nullable = false)
    private Long supervisorId;
    
    @Column(name = "assignment_date", nullable = false)
    private LocalDateTime assignmentDate;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (assignmentDate == null) {
            assignmentDate = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}