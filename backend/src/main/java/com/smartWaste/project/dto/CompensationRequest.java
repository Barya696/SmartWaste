package com.smartWaste.project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompensationRequest {
    private Long assignmentId;
    private Long assignPartnerId;
    private Long citizenId;
    private Long collectorId;
    private Long supervisorId;
    private Long partnerId;
    private List<MaterialLine> materials; // multiple materials + weights

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MaterialLine {
        private String type;     // e.g. "Plastic"
        private Double weightKg;
    }
}
