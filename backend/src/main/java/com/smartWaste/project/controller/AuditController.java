package com.smartWaste.project.controller;

import com.smartWaste.project.model.SecurityEvent;
import com.smartWaste.project.repository.SecurityEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final SecurityEventRepository securityEventRepository;

    @GetMapping("/security-events")
    public ResponseEntity<List<SecurityEvent>> getSecurityEvents() {
        List<SecurityEvent> events = securityEventRepository.findTop30ByOrderByCreatedAtDesc();
        return ResponseEntity.ok(events);
    }
}
