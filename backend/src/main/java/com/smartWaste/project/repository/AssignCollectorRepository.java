package com.smartWaste.project.repository;

import com.smartWaste.project.model.AssignCollector;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AssignCollectorRepository extends JpaRepository<AssignCollector, Long> {

    List<AssignCollector> findByCollectorId(Long collectorId);

    List<AssignCollector> findByCollectorIdAndAssignmentStatus(
            Long collectorId, AssignCollector.AssignmentStatus status);

    @Query("SELECT a FROM AssignCollector a WHERE a.collectorId = :collectorId AND (CAST(a.createdAt AS date) = :date OR CAST(a.assignmentDate AS date) = :date)")
    List<AssignCollector> findByCollectorIdAndCreatedAtDate(
            @Param("collectorId") Long collectorId,
            @Param("date") LocalDate date);

    List<AssignCollector> findBySupervisorId(Long supervisorId);

    List<AssignCollector> findByReportId(Long reportId);

    List<AssignCollector> findByAssignmentStatus(AssignCollector.AssignmentStatus status);

    Optional<AssignCollector> findByReportIdAndAssignmentStatusNot(
            Long reportId, AssignCollector.AssignmentStatus status);
}