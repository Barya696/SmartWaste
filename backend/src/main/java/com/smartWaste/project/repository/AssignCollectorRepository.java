package com.smartWaste.project.repository;

import com.smartWaste.project.model.AssignCollector;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignCollectorRepository extends JpaRepository<AssignCollector, Long> {

    List<AssignCollector> findByCollectorId(Long collectorId);

    List<AssignCollector> findByCollectorIdAndAssignmentStatus(
            Long collectorId, AssignCollector.AssignmentStatus status);

    List<AssignCollector> findBySupervisorId(Long supervisorId);

    List<AssignCollector> findByReportId(Long reportId);

    List<AssignCollector> findByAssignmentStatus(AssignCollector.AssignmentStatus status);

    Optional<AssignCollector> findByReportIdAndAssignmentStatusNot(
            Long reportId, AssignCollector.AssignmentStatus status);
}