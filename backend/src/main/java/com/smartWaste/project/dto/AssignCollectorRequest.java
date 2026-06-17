package com.smartWaste.project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignCollectorRequest {
    private Long reportId;
    private Long collectorId;
    private Long supervisorId;
    private String notes;
}
