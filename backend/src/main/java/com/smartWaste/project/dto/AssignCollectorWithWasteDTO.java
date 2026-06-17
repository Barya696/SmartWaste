package com.smartWaste.project.dto;

import com.smartWaste.project.model.AssignCollector;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO that combines AssignCollector with its related ReportWaste data
 * Returned by GET /api/assignments to provide complete assignment information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignCollectorWithWasteDTO {
    
    // From assign_collector table
    private Long id;
    private Long reportId;
    private Long collectorId;
    private Long supervisorId;
    private String assignmentStatus;
    private LocalDateTime assignmentDate;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // From waste_reports table
    private Long wasteReportId;
    private Long userId;
    private String category;
    private String district;
    private String location;
    private String description;
    private String quantity;
    private String photoUrl;
    private String trackingNumber;
    private String wasteStatus;
    private LocalDateTime reportCreatedAt;
    private LocalDateTime reportUpdatedAt;
    
    /**
     * Constructor from AssignCollector and ReportWaste entities
     */
    public AssignCollectorWithWasteDTO(AssignCollector assignCollector, 
                                        Object[] queryResult) {
        // Assuming the query returns: ac.*, rw.*
        if (queryResult != null && queryResult.length >= 18) {
            // AssignCollector fields
            this.id = (Long) queryResult[0];
            this.reportId = (Long) queryResult[1];
            this.collectorId = (Long) queryResult[2];
            this.supervisorId = (Long) queryResult[3];
            this.assignmentStatus = (String) queryResult[4];
            this.assignmentDate = (LocalDateTime) queryResult[5];
            this.notes = (String) queryResult[6];
            this.createdAt = (LocalDateTime) queryResult[7];
            this.updatedAt = (LocalDateTime) queryResult[8];
            
            // ReportWaste fields
            this.wasteReportId = (Long) queryResult[9];
            this.userId = (Long) queryResult[10];
            this.category = (String) queryResult[11];
            this.district = (String) queryResult[12];
            this.location = (String) queryResult[13];
            this.description = (String) queryResult[14];
            this.quantity = (String) queryResult[15];
            this.photoUrl = (String) queryResult[16];
            this.trackingNumber = (String) queryResult[17];
            this.wasteStatus = (String) queryResult[18];
            this.reportCreatedAt = (LocalDateTime) queryResult[19];
            this.reportUpdatedAt = (LocalDateTime) queryResult[20];
        }
    }
}
