package com.smartWaste.project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportWasteResponse {
    private Long id;
    private Long userId;
    private String category;
    private String district;
    private String location;
    private String description;
    private String quantity;
    private String photoUrl;
    private String trackingNumber;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
