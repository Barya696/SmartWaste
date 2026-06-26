package com.smartWaste.project.controller;

import com.smartWaste.project.dto.AssignCollectorRequest;
import com.smartWaste.project.dto.AssignPartnerRequest;
import com.smartWaste.project.dto.ErrorResponse;
import com.smartWaste.project.dto.StatusUpdateRequest;
import com.smartWaste.project.model.AssignCollector;
import com.smartWaste.project.model.AssignPartner;
import com.smartWaste.project.service.AssignCollectorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AssignCollectorController {
    
    private final AssignCollectorService assignCollectorService;
    
    /**
     * Assign a collector to a waste report
     * POST /api/assignments
     */
    @PostMapping
    public ResponseEntity<?> assignCollector(@RequestBody AssignCollectorRequest request) {
        try {
            if (request.getReportId() == null || request.getCollectorId() == null || request.getSupervisorId() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("reportId, collectorId, and supervisorId are required"));
            }
            
            AssignCollector assignment = assignCollectorService.assignCollectorToReport(
                request.getReportId(),
                request.getCollectorId(),
                request.getSupervisorId(),
                request.getNotes()
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(assignment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to assign collector: " + e.getMessage()));
        }
    }
    
    /**
     * Get assignment by ID
     * GET /api/assignments/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getAssignmentById(@PathVariable Long id) {
        try {
            Optional<AssignCollector> assignment = assignCollectorService.getAssignmentById(id);
            if (assignment.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Assignment not found"));
            }
            return ResponseEntity.ok(assignment.get());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to retrieve assignment: " + e.getMessage()));
        }
    }
    
    /**
     * Get all assignments for a collector
     * GET /api/assignments/collector/{collectorId}
     */
    @GetMapping("/collector/{collectorId}")
    public ResponseEntity<?> getAssignmentsByCollector(@PathVariable Long collectorId) {
        try {
            List<AssignCollector> assignments = assignCollectorService.getAssignmentsByCollector(collectorId);
            return ResponseEntity.ok(assignments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to retrieve assignments: " + e.getMessage()));
        }
    }

    /**
     * Get assignments for a collector created on a specific date (format: YYYY-MM-DD)
     * GET /api/assignments/collector/{collectorId}/date/{date}
     */
    @GetMapping("/collector/{collectorId}/date/{date}")
    public ResponseEntity<?> getAssignmentsByCollectorAndDate(
            @PathVariable Long collectorId,
            @PathVariable String date) {
        try {
            LocalDate localDate = LocalDate.parse(date);
            List<AssignCollector> assignments = assignCollectorService.getAssignmentsByCollectorAndDate(collectorId, localDate);
            return ResponseEntity.ok(assignments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to retrieve assignments: " + e.getMessage()));
        }
    }
    
    /**
     * Get active assignments for a collector
     * GET /api/assignments/collector/{collectorId}/active
     */
    @GetMapping("/collector/{collectorId}/active")
    public ResponseEntity<?> getActiveAssignmentsByCollector(@PathVariable Long collectorId) {
        try {
            List<AssignCollector> assignments = assignCollectorService.getActiveAssignmentsByCollector(collectorId);
            return ResponseEntity.ok(assignments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to retrieve active assignments: " + e.getMessage()));
        }
    }
    
    /**
     * Get all assignments for a supervisor
     * GET /api/assignments/supervisor/{supervisorId}
     */
    @GetMapping("/supervisor/{supervisorId}")
    public ResponseEntity<?> getAssignmentsBySupervisor(@PathVariable Long supervisorId) {
        try {
            List<AssignCollector> assignments = assignCollectorService.getAssignmentsBySupervisor(supervisorId);
            return ResponseEntity.ok(assignments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to retrieve assignments: " + e.getMessage()));
        }
    }
    
    /**
     * Get all assignments for a report
     * GET /api/assignments/report/{reportId}
     */
    @GetMapping("/report/{reportId}")
    public ResponseEntity<?> getAssignmentsByReport(@PathVariable Long reportId) {
        try {
            List<AssignCollector> assignments = assignCollectorService.getAssignmentsByReport(reportId);
            return ResponseEntity.ok(assignments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to retrieve assignments: " + e.getMessage()));
        }
    }
    
    /**
     * Get all assignments
     * GET /api/assignments
     */
    @GetMapping
    public ResponseEntity<?> getAllAssignments() {
        try {
            List<AssignCollector> assignments = assignCollectorService.getAllAssignments();
            return ResponseEntity.ok(assignments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to retrieve assignments: " + e.getMessage()));
        }
    }
    
    /**
     * Update assignment status
     * PUT /api/assignments/{id}/status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateAssignmentStatus(
        @PathVariable Long id,
        @RequestParam AssignCollector.AssignmentStatus status
    ) {
        try {
            AssignCollector assignment = assignCollectorService.updateAssignmentStatus(id, status);
            return ResponseEntity.ok(assignment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to update assignment: " + e.getMessage()));
        }
    }

    /**
     * Update assignment status via PATCH with request body
     * PATCH /api/assignments/{id}/status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> patchAssignmentStatus(
        @PathVariable Long id,
        @RequestBody StatusUpdateRequest request
    ) {
        try {
            System.out.println("patchAssignmentStatus called with id: " + id + ", status: " + request.getStatus());
            if (request.getStatus() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Status is required"));
            }
            AssignCollector assignment = assignCollectorService.updateAssignmentStatus(id, request.getStatus());
            return ResponseEntity.ok(assignment);
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to update assignment: " + e.getMessage()));
        }
    }
    
    /**
     * Reject an assignment
     * PUT /api/assignments/{id}/reject
     */
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectAssignment(
        @PathVariable Long id,
        @RequestParam(required = false, defaultValue = "No reason provided") String reason
    ) {
        try {
            AssignCollector assignment = assignCollectorService.rejectAssignment(id, reason);
            return ResponseEntity.ok(assignment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to reject assignment: " + e.getMessage()));
        }
    }
    
    /**
     * Delete an assignment
     * DELETE /api/assignments/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAssignment(@PathVariable Long id) {
        try {
            assignCollectorService.deleteAssignment(id);
            return ResponseEntity.ok(new ErrorResponse("Assignment deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to delete assignment: " + e.getMessage()));
        }
    }

    /**
     * Get all assignments by status
     * GET /api/assignments/status/{status}
     * Example: /api/assignments/status/COMPLETED
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<?> getAssignmentsByStatus(@PathVariable String status) {
        try {
            AssignCollector.AssignmentStatus assignmentStatus;
            try {
                assignmentStatus = AssignCollector.AssignmentStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Invalid status. Valid values: PENDING, ACCEPTED, IN_PROGRESS, COMPLETED, REJECTED, PENDING_CITIZEN_APPROVAL"));
            }

            List<AssignCollector> assignments = assignCollectorService.getAssignmentsByStatus(assignmentStatus);
            return ResponseEntity.ok(assignments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to retrieve assignments: " + e.getMessage()));
        }
    }

    /**
     * Assign a partner to a completed assignment and update status to RECYCLED
     * PATCH /api/assignments/{id}/assign-partner
     */
    @PatchMapping("/{id}/assign-partner")
    public ResponseEntity<?> assignPartnerToCompletedAssignment(
        @PathVariable Long id,
        @RequestBody AssignPartnerRequest request
    ) {
        try {
            if (request.getPartnerId() == null || request.getMaterialType() == null ||
                request.getWeightKg() == null || request.getSupervisorId() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("partnerId, materialType, weightKg, and supervisorId are required"));
            }

            AssignPartner partnerAssignment = assignCollectorService.assignPartnerToCompletedAssignment(
                id,
                request.getPartnerId(),
                request.getMaterialType(),   // "Metal, Plastic, Glass"
                request.getWeightKg(),       // "2.50, 1.30, 0.80"
                request.getSupervisorId()
            );

            return ResponseEntity.ok(partnerAssignment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to assign partner: " + e.getMessage()));
        }
    }
}
