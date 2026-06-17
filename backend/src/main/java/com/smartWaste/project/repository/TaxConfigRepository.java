package com.smartWaste.project.repository;

import com.smartWaste.project.model.TaxConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TaxConfigRepository extends JpaRepository<TaxConfig, Long> {
    Optional<TaxConfig> findByTaxName(String taxName);
}
