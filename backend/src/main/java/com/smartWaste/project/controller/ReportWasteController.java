package com.smartWaste.project.controller;

import com.smartWaste.project.dto.ReportResubmitResponse;
import com.smartWaste.project.model.ReportWaste;
import com.smartWaste.project.model.Users;
import com.smartWaste.project.dto.ReportWasteRequest;
import com.smartWaste.project.repository.UsersRepository;
import com.smartWaste.project.service.ReportWasteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportWasteController {
    
    private final ReportWasteService reportWasteService;
    private final UsersRepository usersRepository;
    
    /**
     * Create a new waste report
     */
    @PostMapping
    public ResponseEntity<?> createReport(@RequestBody ReportWasteRequest request) {
        try {
            ReportWaste report = reportWasteService.createReport(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(report);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to create report: " + e.getMessage()));
        }
    }
    
    /**
     * Get report by tracking number
     */
    @GetMapping("/tracking/{trackingNumber}")
    public ResponseEntity<?> getReportByTrackingNumber(@PathVariable String trackingNumber) {
        try {
            ReportWaste report = reportWasteService.getReportByTrackingNumber(trackingNumber);
            return ResponseEntity.ok(report);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Get all reports by user ID
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getReportsByUserId(@PathVariable Long userId) {
        try {
            List<ReportWaste> reports = reportWasteService.getReportsByUserId(userId);
            return ResponseEntity.ok(reports);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Get all reports by district
     */
    @GetMapping("/district/{district}")
    public ResponseEntity<?> getReportsByDistrict(@PathVariable String district) {
        try {
            List<ReportWaste> reports = reportWasteService.getReportsByDistrict(district);
            return ResponseEntity.ok(reports);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Get all reports by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<?> getReportsByStatus(@PathVariable String status) {
        try {
            List<ReportWaste> reports = reportWasteService.getReportsByStatus(status);
            return ResponseEntity.ok(reports);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Get report by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getReportById(@PathVariable Long id) {
        try {
            ReportWaste report = reportWasteService.getReportById(id);
            return ResponseEntity.ok(report);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Get all reports
     */
    @GetMapping
    public ResponseEntity<List<ReportWaste>> getAllReports() {
        List<ReportWaste> reports = reportWasteService.getAllReports();
        return ResponseEntity.ok(reports);
    }
    
    /**
     * Resubmit a stale report back into the assignment queue (citizen only).
     */
    @PostMapping("/{id}/resubmit")
    public ResponseEntity<?> resubmitReport(@PathVariable Long id, Authentication auth) {
        try {
            Long userId = resolveUserId(auth);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("Not authenticated"));
            }
            ReportResubmitResponse result = reportWasteService.resubmitReport(id, userId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to resubmit report: " + e.getMessage()));
        }
    }

    /**
     * Update a pending report (citizen only).
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateReport(
            @PathVariable Long id,
            @RequestBody ReportWasteRequest request,
            Authentication auth) {
        try {
            Long userId = resolveUserId(auth);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("Not authenticated"));
            }
            ReportWaste report = reportWasteService.updateReport(id, userId, request);
            return ResponseEntity.ok(report);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to update report: " + e.getMessage()));
        }
    }

    /**
     * Update report status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateReportStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        try {
            ReportWaste report = reportWasteService.updateReportStatus(id, status);
            return ResponseEntity.ok(report);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Delete a pending report (citizen only).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReport(@PathVariable Long id, Authentication auth) {
        try {
            Long userId = resolveUserId(auth);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("Not authenticated"));
            }
            reportWasteService.deleteReport(id, userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to delete report: " + e.getMessage()));
        }
    }
    
    private Long resolveUserId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return null;
        Optional<Users> user = usersRepository.findByEmail(auth.getName());
        return user.map(Users::getId).orElse(null);
    }

    /**
     * Error response DTO
     */
    public static class ErrorResponse {
        public String message;
        
        public ErrorResponse(String message) {
            this.message = message;
        }
    }
}
