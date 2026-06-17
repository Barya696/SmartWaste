package com.smartWaste.project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportResubmitResponse {
    private Long id;
    private String trackingNumber;
    private String status;
    private LocalDateTime lastResubmittedAt;
    private String message;
}
