package com.smartWaste.project.service;

import com.smartWaste.project.dto.ReportResubmitResponse;
import com.smartWaste.project.model.AssignCollector;
import com.smartWaste.project.model.ReportWaste;
import com.smartWaste.project.dto.ReportWasteRequest;
import com.smartWaste.project.repository.AssignCollectorRepository;
import com.smartWaste.project.repository.CompensationRepository;
import com.smartWaste.project.repository.ReportWasteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ReportWasteService {

    public static final int RESUBMIT_HOURS_THRESHOLD = 48;

    private final ReportWasteRepository reportWasteRepository;
    private final AssignCollectorRepository assignCollectorRepository;
    private final CompensationRepository compensationRepository;
    
    /**
     * Create a new waste report
     */
    public ReportWaste createReport(ReportWasteRequest request) {
        // Validate user exists and other fields
        if (request.getUserId() == null || request.getUserId() <= 0) {
            throw new IllegalArgumentException("Invalid user ID");
        }
        if (request.getCategory() == null || request.getCategory().trim().isEmpty()) {
            throw new IllegalArgumentException("Category is required");
        }
        if (request.getDistrict() == null || request.getDistrict().trim().isEmpty()) {
            throw new IllegalArgumentException("District is required");
        }
        if (request.getLocation() == null || request.getLocation().trim().isEmpty()) {
            throw new IllegalArgumentException("Location is required");
        }
        if (request.getDescription() == null || request.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Description is required");
        }
        if (request.getQuantity() == null || request.getQuantity().trim().isEmpty()) {
            throw new IllegalArgumentException("Quantity is required");
        }
        
        // Generate tracking number with year and random suffix
        String trackingNumber = generateTrackingNumber();
        
        // Create report
        ReportWaste report = new ReportWaste();
        report.setUserId(request.getUserId());
        report.setCategory(request.getCategory());
        report.setDistrict(request.getDistrict());
        report.setLocation(request.getLocation());
        report.setDescription(request.getDescription());
        report.setQuantity(request.getQuantity());
        report.setPhotoUrl(request.getPhotoUrl());
        report.setTrackingNumber(trackingNumber);
        report.setStatus("pending");
        
        return reportWasteRepository.save(report);
    }
    
    /**
     * Generate unique tracking number: SW-YYYY-XXXX
     */
    private String generateTrackingNumber() {
        int year = java.time.Year.now().getValue();
        int randomSuffix = (int) (Math.random() * 9000) + 1000;
        return String.format("SW-%d-%d", year, randomSuffix);
    }
    
    /**
     * Get report by tracking number
     */
    public ReportWaste getReportByTrackingNumber(String trackingNumber) {
        return reportWasteRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new IllegalArgumentException("Report not found with tracking number: " + trackingNumber));
    }
    
    /**
     * Get all reports by user ID
     */
    public List<ReportWaste> getReportsByUserId(Long userId) {
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("Invalid user ID");
        }
        return reportWasteRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    /**
     * Get all reports by district
     */
    public List<ReportWaste> getReportsByDistrict(String district) {
        if (district == null || district.trim().isEmpty()) {
            throw new IllegalArgumentException("District is required");
        }
        return reportWasteRepository.findByDistrict(district);
    }
    
    /**
     * Get all reports by status
     */
    public List<ReportWaste> getReportsByStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            throw new IllegalArgumentException("Status is required");
        }
        return reportWasteRepository.findByStatus(status);
    }
    
    /**
     * Get report by ID
     */
    public ReportWaste getReportById(Long id) {
        return reportWasteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found with ID: " + id));
    }
    
    /**
     * Update report status
     */
    public ReportWaste updateReportStatus(Long id, String newStatus) {
        ReportWaste report = getReportById(id);
        report.setStatus(newStatus);
        return reportWasteRepository.save(report);
    }
    
    /**
     * Get all reports (pagination can be added later)
     */
    public List<ReportWaste> getAllReports() {
        return reportWasteRepository.findAll();
    }
    
    /**
     * Delete report
     */
    public void deleteReport(Long id) {
        if (!reportWasteRepository.existsById(id)) {
            throw new IllegalArgumentException("Report not found with ID: " + id);
        }
        reportWasteRepository.deleteById(id);
    }

    /**
     * Citizen resubmits a stale report to re-enter the assignment queue.
     */
    public ReportResubmitResponse resubmitReport(Long reportId, Long userId) {
        ReportWaste report = getReportById(reportId);

        if (!report.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only resubmit your own reports");
        }

        if ("completed".equalsIgnoreCase(report.getStatus())
                || "rejected".equalsIgnoreCase(report.getStatus())) {
            throw new IllegalStateException("This report can no longer be resubmitted");
        }

        List<AssignCollector> assignments = assignCollectorRepository.findByReportId(reportId);
        for (AssignCollector assignment : assignments) {
            if (compensationRepository.findByAssignmentId(assignment.getId()).isPresent()) {
                throw new IllegalStateException("This report has already been compensated");
            }
        }

        Optional<AssignCollector> activeAssignment = findActiveAssignment(assignments);
        LocalDateTime now = LocalDateTime.now();

        if (activeAssignment.isPresent()) {
            AssignCollector assignment = activeAssignment.get();
            AssignCollector.AssignmentStatus status = assignment.getAssignmentStatus();

            if (status == AssignCollector.AssignmentStatus.PENDING_CITIZEN_APPROVAL
                    || status == AssignCollector.AssignmentStatus.COMPLETED
                    || status == AssignCollector.AssignmentStatus.RECYCLED) {
                throw new IllegalStateException(
                        "Cannot resubmit while collection is awaiting approval or already completed");
            }

            if (status != AssignCollector.AssignmentStatus.PENDING
                    && status != AssignCollector.AssignmentStatus.ACCEPTED
                    && status != AssignCollector.AssignmentStatus.IN_PROGRESS) {
                throw new IllegalStateException("This report cannot be resubmitted in its current state");
            }

            LocalDateTime anchor = assignment.getAssignmentDate() != null
                    ? assignment.getAssignmentDate()
                    : assignment.getCreatedAt();
            assertResubmitWindowOpen(anchor, now);

            assignment.setAssignmentStatus(AssignCollector.AssignmentStatus.REJECTED);
            assignment.setNotes("Citizen resubmitted — reassignment requested after delay");
            assignCollectorRepository.save(assignment);
        } else {
            LocalDateTime anchor = report.getLastResubmittedAt() != null
                    ? report.getLastResubmittedAt()
                    : report.getCreatedAt();
            assertResubmitWindowOpen(anchor, now);
        }

        report.setStatus("pending");
        report.setLastResubmittedAt(now);
        ReportWaste saved = reportWasteRepository.save(report);

        return new ReportResubmitResponse(
                saved.getId(),
                saved.getTrackingNumber(),
                saved.getStatus(),
                saved.getLastResubmittedAt(),
                "Report resubmitted and returned to the assignment queue"
        );
    }

    private Optional<AssignCollector> findActiveAssignment(List<AssignCollector> assignments) {
        return assignments.stream()
                .filter(a -> a.getAssignmentStatus() != AssignCollector.AssignmentStatus.REJECTED)
                .max(Comparator.comparing(AssignCollector::getUpdatedAt));
    }

    private void assertResubmitWindowOpen(LocalDateTime anchor, LocalDateTime now) {
        long hoursElapsed = Duration.between(anchor, now).toHours();
        if (hoursElapsed < RESUBMIT_HOURS_THRESHOLD) {
            long hoursRemaining = RESUBMIT_HOURS_THRESHOLD - hoursElapsed;
            throw new IllegalStateException(
                    "Resubmit is available after " + RESUBMIT_HOURS_THRESHOLD
                            + " hours. Try again in about " + hoursRemaining + " hour(s).");
        }
    }
}
