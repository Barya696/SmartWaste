package com.smartWaste.project.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "downloaded_receipts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DownloadedReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "receipt_no", nullable = false, unique = true, length = 32)
    private String receiptNo;

    @Column(name = "partner_id", nullable = false)
    private Long partnerId;

    @Column(name = "partner_name", nullable = false)
    private String partnerName;

    @Column(name = "supervisor_id")
    private Long supervisorId;

    @Column(name = "entries_count", nullable = false)
    private Integer entriesCount;

    @Column(name = "total_kg", nullable = false)
    private Double totalKg;

    @Column(name = "gross_amount", nullable = false)
    private Double grossAmount;

    @Column(name = "net_amount", nullable = false)
    private Double netAmount;

    @Column(name = "filter_month")
    private Integer filterMonth;

    @Column(name = "filter_year")
    private Integer filterYear;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (issuedAt == null) {
            issuedAt = LocalDateTime.now();
        }
    }
}
