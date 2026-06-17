package com.smartWaste.project.repository;

import com.smartWaste.project.model.Compensation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompensationRepository extends JpaRepository<Compensation, Long> {
    Optional<Compensation> findByAssignmentId(Long assignmentId);
    List<Compensation> findByPartnerId(Long partnerId);
    List<Compensation> findByCitizenId(Long citizenId);
    List<Compensation> findByCollectorId(Long collectorId);
    boolean existsByAssignmentId(Long assignmentId);
}
