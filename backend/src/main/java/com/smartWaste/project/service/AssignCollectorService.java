package com.smartWaste.project.service;

import com.smartWaste.project.model.AssignCollector;
import com.smartWaste.project.model.AssignPartner;
import com.smartWaste.project.repository.AssignCollectorRepository;
import com.smartWaste.project.repository.AssignPartnerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AssignCollectorService {

    private final AssignCollectorRepository assignCollectorRepository;
    private final AssignPartnerRepository assignPartnerRepository;

    @Transactional
    public AssignCollector assignCollectorToReport(
            Long reportId,
            Long collectorId,
            Long supervisorId,
            String notes
    ) {
        Optional<AssignCollector> existing = assignCollectorRepository
                .findByReportIdAndAssignmentStatusNot(reportId, AssignCollector.AssignmentStatus.REJECTED);

        if (existing.isPresent()) {
            throw new IllegalStateException("Report is already assigned to a collector");
        }

        AssignCollector assignment = new AssignCollector();
        assignment.setReportId(reportId);
        assignment.setCollectorId(collectorId);
        assignment.setSupervisorId(supervisorId);
        assignment.setAssignmentStatus(AssignCollector.AssignmentStatus.PENDING);
        assignment.setNotes(notes);

        return assignCollectorRepository.save(assignment);
    }

    public List<AssignCollector> getAllAssignments() {
        return assignCollectorRepository.findAll();
    }

    public Optional<AssignCollector> getAssignmentById(Long id) {
        return assignCollectorRepository.findById(id);
    }

    public List<AssignCollector> getAssignmentsByCollector(Long collectorId) {
        return assignCollectorRepository.findByCollectorId(collectorId);
    }

    public List<AssignCollector> getActiveAssignmentsByCollector(Long collectorId) {
        return assignCollectorRepository.findByCollectorIdAndAssignmentStatus(
                collectorId, AssignCollector.AssignmentStatus.PENDING);
    }

    public List<AssignCollector> getAssignmentsByCollectorAndDate(Long collectorId, LocalDate date) {
        return assignCollectorRepository.findByCollectorIdAndCreatedAtDate(collectorId, date);
    }

    public List<AssignCollector> getAssignmentsBySupervisor(Long supervisorId) {
        return assignCollectorRepository.findBySupervisorId(supervisorId);
    }

    public List<AssignCollector> getAssignmentsByReport(Long reportId) {
        return assignCollectorRepository.findByReportId(reportId);
    }

    public List<AssignCollector> getAssignmentsByStatus(AssignCollector.AssignmentStatus status) {
        return assignCollectorRepository.findByAssignmentStatus(status);
    }

    @Transactional
    public AssignCollector updateAssignmentStatus(Long id, AssignCollector.AssignmentStatus newStatus) {
        AssignCollector assignment = assignCollectorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found with ID: " + id));

        assignment.setAssignmentStatus(newStatus);
        return assignCollectorRepository.save(assignment);
    }

    @Transactional
    public AssignCollector rejectAssignment(Long id, String reason) {
        AssignCollector assignment = assignCollectorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found with ID: " + id));

        assignment.setAssignmentStatus(AssignCollector.AssignmentStatus.REJECTED);
        assignment.setNotes(reason);
        return assignCollectorRepository.save(assignment);
    }

    @Transactional
    public void deleteAssignment(Long id) {
        assignCollectorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found with ID: " + id));
        assignCollectorRepository.deleteById(id);
    }

    /**
     * Called by PATCH /api/assignments/{id}/assign-partner
     * 1. Validates the assign_collector row exists and is COMPLETED
     * 2. Inserts a row into assign_partner
     * 3. Updates assign_collector.assignment_status → RECYCLED
     */
    @Transactional
    public AssignPartner assignPartnerToCompletedAssignment(
            Long assignmentId,
            Long partnerId,
            String materialType,
            String weightKg,      // ← e.g. "2.50" or "2.50, 1.30, 0.80"
            Long supervisorId
    ) {
        AssignCollector assignment = assignCollectorRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Assignment not found with ID: " + assignmentId));

        if (assignment.getAssignmentStatus() != AssignCollector.AssignmentStatus.COMPLETED) {
            throw new IllegalStateException(
                    "Assignment must be COMPLETED before assigning a partner. Current status: "
                    + assignment.getAssignmentStatus());
        }

        AssignPartner assignPartner = new AssignPartner();
        assignPartner.setAssignmentId(assignmentId);
        assignPartner.setPartnerId(partnerId);
        assignPartner.setMaterialType(materialType);
        // Convert weightKg from String to Double (sum all weights if comma-separated)
        double totalWeight = 0.0;
        if (weightKg != null && !weightKg.isEmpty()) {
            String[] weights = weightKg.split(",");
            for (String w : weights) {
                try {
                    totalWeight += Double.parseDouble(w.trim());
                } catch (NumberFormatException e) {
                    // skip invalid entries
                }
            }
        }
        assignPartner.setWeightKg(String.valueOf(totalWeight));
        assignPartner.setSupervisorId(supervisorId);

        AssignPartner saved = assignPartnerRepository.save(assignPartner);

        assignment.setAssignmentStatus(AssignCollector.AssignmentStatus.RECYCLED);
        assignCollectorRepository.save(assignment);

        return saved;
    }
}