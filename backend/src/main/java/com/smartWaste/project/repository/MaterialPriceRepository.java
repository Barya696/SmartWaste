package com.smartWaste.project.repository;

import com.smartWaste.project.model.MaterialPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MaterialPriceRepository extends JpaRepository<MaterialPrice, Long> {
    Optional<MaterialPrice> findByMaterialName(String materialName);
}
