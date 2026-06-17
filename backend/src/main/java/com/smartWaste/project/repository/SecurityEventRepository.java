package com.smartWaste.project.repository;

import com.smartWaste.project.model.SecurityEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {

    List<SecurityEvent> findTop30ByOrderByCreatedAtDesc();
}
