package com.smartWaste.project.controller;

import com.smartWaste.project.dto.AssignPartnerRequest;
import com.smartWaste.project.model.AssignCollector;
import com.smartWaste.project.model.AssignPartner;
import com.smartWaste.project.repository.AssignCollectorRepository;
import com.smartWaste.project.repository.AssignPartnerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/assign-partner")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AssignPartnerController {

    private final AssignPartnerRepository assignPartnerRepository;
    private final AssignCollectorRepository assignCollectorRepository;

    /**
     * GET /api/assign-partner/assignment/{assignmentId}
     * Returns the most recent assign_partner record for an assignment
     * with materials parsed from JSON breakdown
     */
    @GetMapping("/assignment/{assignmentId}")
    public ResponseEntity<?> getByAssignmentId(@PathVariable Long assignmentId) {
        try {
            Optional<AssignPartner> assignPartner = assignPartnerRepository
                    .findFirstByAssignmentIdOrderByCreatedAtDesc(assignmentId);

            if (assignPartner.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "No partner assignment found for assignment " + assignmentId));
            }

            AssignPartner ap = assignPartner.get();
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", ap.getId());
            response.put("assignmentId", ap.getAssignmentId());
            response.put("partnerId", ap.getPartnerId());
            response.put("citizenId", ap.getCitizenId());
            response.put("collectorId", ap.getCollectorId());
            response.put("materialType", ap.getMaterialType());
            response.put("weightKg", ap.getWeightKg());
            response.put("materials", parseMaterialBreakdown(ap.getMaterialBreakdown()));
            response.put("assignmentDate", ap.getAssignmentDate());
            response.put("createdAt", ap.getCreatedAt());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching assign_partner: " + e.getMessage()));
        }
    }

    /**
     * GET /api/assign-partner/{id}
     * Get a specific assign_partner record by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            Optional<AssignPartner> assignPartner = assignPartnerRepository.findById(id);

            if (assignPartner.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Assign_partner not found: " + id));
            }

            AssignPartner ap = assignPartner.get();
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", ap.getId());
            response.put("assignmentId", ap.getAssignmentId());
            response.put("partnerId", ap.getPartnerId());
            response.put("citizenId", ap.getCitizenId());
            response.put("collectorId", ap.getCollectorId());
            response.put("materialType", ap.getMaterialType());
            response.put("weightKg", ap.getWeightKg());
            response.put("materials", parseMaterialBreakdown(ap.getMaterialBreakdown()));
            response.put("assignmentDate", ap.getAssignmentDate());
            response.put("createdAt", ap.getCreatedAt());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching assign_partner: " + e.getMessage()));
        }
    }

    /**
     * GET /api/assign-partner/partner/{partnerId}
     * Get all assignments for a partner
     */
    @GetMapping("/partner/{partnerId}")
    public ResponseEntity<?> getByPartnerId(@PathVariable Long partnerId) {
        try {
            List<AssignPartner> list = assignPartnerRepository.findByPartnerId(partnerId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching by partner: " + e.getMessage()));
        }
    }

    /**
     * POST /api/assign-partner
     * Creates an assign_partner record and updates assign_collector status to RECYCLED
     */
    @PostMapping
    public ResponseEntity<?> createAssignPartner(@RequestBody AssignPartnerRequest request) {
        try {
            AssignPartner ap = new AssignPartner();
            ap.setAssignmentId(request.getAssignmentId());
            ap.setPartnerId(request.getPartnerId());
            ap.setMaterialType(request.getMaterialType());
            ap.setWeightKg(request.getWeightKg());
            ap.setMaterialBreakdown(request.getMaterialBreakdown());
            ap.setSupervisorId(request.getSupervisorId());
            ap.setCitizenId(request.getCitizenId());
            ap.setCollectorId(request.getCollectorId());

            AssignPartner saved = assignPartnerRepository.save(ap);

            // Update assign_collector status to RECYCLED
            if (request.getAssignmentId() != null) {
                assignCollectorRepository.findById(request.getAssignmentId()).ifPresent(ac -> {
                    ac.setAssignmentStatus(AssignCollector.AssignmentStatus.RECYCLED);
                    assignCollectorRepository.save(ac);
                });
            }

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", saved.getId());
            response.put("assignmentId", saved.getAssignmentId());
            response.put("partnerId", saved.getPartnerId());
            response.put("materialType", saved.getMaterialType());
            response.put("weightKg", saved.getWeightKg());
            response.put("citizenId", saved.getCitizenId());
            response.put("collectorId", saved.getCollectorId());
            response.put("createdAt", saved.getCreatedAt());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error creating assign_partner: " + e.getMessage()));
        }
    }

    /**
     * Parse JSON material breakdown to list of maps
     * JSON format: [{"type":"Plastic","weightKg":3.0}, ...]
     * Falls back to empty list if parsing fails
     */
    private List<Map<String, Object>> parseMaterialBreakdown(String json) {
        if (json == null || json.isBlank()) {
            return new ArrayList<>();
        }
        try {
            List<Map<String, Object>> result = new ArrayList<>();
            json = json.trim();
            if (!json.startsWith("[") || !json.endsWith("]")) {
                return result;
            }

            json = json.substring(1, json.length() - 1).trim();
            if (json.isEmpty()) {
                return result;
            }

            String[] objects = json.split("\\},\\{");
            for (String obj : objects) {
                obj = obj.trim();
                if (!obj.startsWith("{")) obj = "{" + obj;
                if (!obj.endsWith("}")) obj = obj + "}";

                Map<String, Object> map = new LinkedHashMap<>();
                String[] pairs = obj.replaceAll("[{}]", "").split(",");
                for (String pair : pairs) {
                    String[] kv = pair.split(":");
                    if (kv.length == 2) {
                        String key = kv[0].replaceAll("[\"\\s]", "").trim();
                        String value = kv[1].replaceAll("[\"\\s]", "").trim();
                        if ("weightKg".equals(key)) {
                            map.put(key, Double.parseDouble(value));
                        } else {
                            map.put(key, value);
                        }
                    }
                }
                if (!map.isEmpty()) {
                    result.add(map);
                }
            }
            return result;
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}