package com.smartWaste.project.repository;

import com.smartWaste.project.model.EcoPointsConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EcoPointsConfigRepository extends JpaRepository<EcoPointsConfig, Long> {
    Optional<EcoPointsConfig> findByConfigKey(String configKey);
}
