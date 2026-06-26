package com.smartWaste.project.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "assign_collector")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignCollector {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "report_id", nullable = false)
    private Long reportId;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "report_id", insertable = false, updatable = false)
    private ReportWaste wasteReport;
    
    @Column(name = "collector_id", nullable = false)
    private Long collectorId;
    
    @Column(name = "supervisor_id", nullable = false)
    private Long supervisorId;
    
    @Column(name = "assignment_status")
    @Enumerated(EnumType.STRING)
    private AssignmentStatus assignmentStatus = AssignmentStatus.PENDING;
    
    @Column(name = "assignment_date", nullable = false)
    private LocalDateTime assignmentDate;
    
    @Column(name = "notes", length = 1000)
    private String notes;
    
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
    
    public enum AssignmentStatus {
        PENDING,
        ACCEPTED,
        IN_PROGRESS,
        COMPLETED,
        REJECTED,
        PENDING_CITIZEN_APPROVAL,
        RECYCLED,
        EMPTY
    }
}