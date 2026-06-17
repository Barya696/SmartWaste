package com.smartWaste.project.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Users {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String username;
    
    @Column(nullable = false)
    private String password;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(name = "first_name")
    private String firstName;
    
    @Column(name = "last_name")
    private String lastName;
    
    @Column(name = "phone_number")
    private String phoneNumber;
    
    @Column(name = "role")
    @Enumerated(EnumType.STRING)
    private UserRole role;
    
    @Column(name = "department")
    @Enumerated(EnumType.STRING)
    private Department department;
    
    @Column(name = "is_blocked")
    private Boolean isBlocked = false;
    
    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;
    
    @Column(name = "district")
    private String district;

    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber;
    
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
    
    public enum UserRole {
        ADMIN,
        SUPERVISOR,
        COLLECTOR,
        CITIZEN
    }
    
    public enum Department {
        WASTE_COLLECTION_OPERATIONS,
        RECYCLING_OPERATIONS
    }
}
