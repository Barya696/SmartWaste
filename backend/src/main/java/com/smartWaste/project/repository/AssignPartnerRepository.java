package com.smartWaste.project.repository;

import com.smartWaste.project.model.AssignPartner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignPartnerRepository extends JpaRepository<AssignPartner, Long> {
    
    // Find all assignments for a specific assignment (from assign_collector)
    List<AssignPartner> findByAssignmentId(Long assignmentId);
    
    // Find all assignments for a specific partner
    List<AssignPartner> findByPartnerId(Long partnerId);
    
    // Find all assignments for a specific supervisor
    List<AssignPartner> findBySupervisorId(Long supervisorId);
    
    // Find the most recent assignment for an assignment ID
    Optional<AssignPartner> findFirstByAssignmentIdOrderByCreatedAtDesc(Long assignmentId);
}
