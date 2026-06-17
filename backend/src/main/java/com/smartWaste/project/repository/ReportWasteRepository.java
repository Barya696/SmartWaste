package com.smartWaste.project.repository;

import com.smartWaste.project.model.ReportWaste;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReportWasteRepository extends JpaRepository<ReportWaste, Long> {
    Optional<ReportWaste> findByTrackingNumber(String trackingNumber);
    List<ReportWaste> findByUserId(Long userId);
    List<ReportWaste> findByDistrict(String district);
    List<ReportWaste> findByStatus(String status);
    List<ReportWaste> findByUserIdOrderByCreatedAtDesc(Long userId);
}
