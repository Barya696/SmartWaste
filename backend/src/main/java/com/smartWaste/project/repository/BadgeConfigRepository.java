package com.smartWaste.project.repository;

import com.smartWaste.project.model.BadgeConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BadgeConfigRepository extends JpaRepository<BadgeConfig, Long> {
    Optional<BadgeConfig> findByBadgeKey(String badgeKey);
    List<BadgeConfig> findAllByOrderBySortOrderAsc();
}
