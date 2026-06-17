package com.smartWaste.project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignPartnerRequest {
    private Long assignmentId;        // ← add
    private Long partnerId;
    private String materialType;
    private String weightKg;          // ← change String → Double (total weight)
    private String materialBreakdown; // ← add (JSON string)
    private Long supervisorId;
    private Long citizenId;           // ← add
    private Long collectorId;         // ← add
}