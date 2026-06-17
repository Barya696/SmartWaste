package com.smartWaste.project.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "waste_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportWaste {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false)
    private String category;
    
    @Column(nullable = false)
    private String district;
    
    @Column(nullable = false)
    private String location;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private String quantity; // small, medium, large
    
    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;
    
    @Column(nullable = false, unique = true)
    private String trackingNumber;
    
    @Column(nullable = false)
    private String status; // pending, in_progress, completed, rejected
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_resubmitted_at")
    private LocalDateTime lastResubmittedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = "pending";
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
