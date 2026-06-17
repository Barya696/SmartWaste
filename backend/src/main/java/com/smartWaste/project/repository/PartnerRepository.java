package com.smartWaste.project.repository;

import com.smartWaste.project.model.Partner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartnerRepository extends JpaRepository<Partner, Long> {
    Optional<Partner> findByPartnerCode(String partnerCode);
    List<Partner> findByDepartment(String department);
    List<Partner> findByStatus(String status);
    List<Partner> findByDepartmentAndStatus(String department, String status);
    List<Partner> findByCategory(String category);
    List<Partner> findByCreatedBy(Long createdBy);
    List<Partner> findByDepartmentOrderByCreatedAtDesc(String department);
}
