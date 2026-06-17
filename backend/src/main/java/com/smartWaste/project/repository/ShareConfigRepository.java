package com.smartWaste.project.repository;

import com.smartWaste.project.model.ShareConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ShareConfigRepository extends JpaRepository<ShareConfig, Long> {
    Optional<ShareConfig> findByShareName(String shareName);
}
