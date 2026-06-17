package com.smartWaste.project.dto;

import com.smartWaste.project.model.AssignCollector;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusUpdateRequest {
    private AssignCollector.AssignmentStatus status;
}
