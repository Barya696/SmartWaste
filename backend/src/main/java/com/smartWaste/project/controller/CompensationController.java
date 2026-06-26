package com.smartWaste.project.controller;

import com.smartWaste.project.dto.CompensationRequest;
import com.smartWaste.project.model.Compensation;
import com.smartWaste.project.model.WasteCategory;
import com.smartWaste.project.model.ShareConfig;
import com.smartWaste.project.model.TaxConfig;
import com.smartWaste.project.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/compensations")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class CompensationController {

    private final CompensationRepository compensationRepository;
    private final TaxConfigRepository taxConfigRepository;
    private final ShareConfigRepository shareConfigRepository;
    private final WasteCategoryRepository wasteCategoryRepository;

    @PostMapping
    public ResponseEntity<?> compensate(@RequestBody CompensationRequest request) {
        try {
            if (compensationRepository.existsByAssignmentId(request.getAssignmentId())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "Assignment already compensated"));
            }

            if (request.getMaterials() == null || request.getMaterials().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "At least one material line is required"));
            }

            // 1. Load tax config
            double vatPct = 18.0;
            double envLevyPct = 2.0;
            for (TaxConfig tc : taxConfigRepository.findAll()) {
                if ("VAT".equals(tc.getTaxName())) vatPct = tc.getPercentage();
                if ("Environmental Levy".equals(tc.getTaxName())) envLevyPct = tc.getPercentage();
            }

            // 2. Load share config
            double citizenPct = 60.0;
            double collectorPct = 25.0;
            double systemPct = 15.0;
            for (ShareConfig sc : shareConfigRepository.findAll()) {
                if ("Citizen".equals(sc.getShareName())) citizenPct = sc.getPercentage();
                if ("Collector".equals(sc.getShareName())) collectorPct = sc.getPercentage();
                if ("System".equals(sc.getShareName())) systemPct = sc.getPercentage();
            }

            // 3. Load material price map from waste_category
            Map<String, Double> priceMap = new HashMap<>();
            for (WasteCategory wc : wasteCategoryRepository.findAllByActiveTrueOrderByNameAsc()) {
                priceMap.put(wc.getName().toLowerCase(), wc.getPricePerKg());
            }

            // 4. Compute gross per material line + breakdown
            double totalWeight = 0;
            double totalGross = 0;
            List<Map<String, Object>> breakdown = new ArrayList<>();
            List<String> materialNames = new ArrayList<>();

            for (CompensationRequest.MaterialLine line : request.getMaterials()) {
                double weight = line.getWeightKg() != null ? line.getWeightKg() : 0.0;
                double price = priceMap.getOrDefault(
                        line.getType() != null ? line.getType().toLowerCase() : "",
                        300.0
                );
                double gross = weight * price;

                totalWeight += weight;
                totalGross += gross;
                materialNames.add(line.getType());

                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("type", line.getType());
                entry.put("weightKg", weight);
                entry.put("pricePerKg", price);
                entry.put("gross", gross);
                breakdown.add(entry);
            }

            // 5. Apply taxes and shares on the combined totals
            double vatAmount     = totalGross * (vatPct / 100.0);
            double envLevyAmount = totalGross * (envLevyPct / 100.0);
            double netAmount     = totalGross - vatAmount - envLevyAmount;
            double citizenAmount   = netAmount * (citizenPct / 100.0);
            double collectorAmount = netAmount * (collectorPct / 100.0);
            double systemAmount    = netAmount * (systemPct / 100.0);
            double blendedPricePerKg = totalWeight > 0 ? totalGross / totalWeight : 0.0;

            // 6. Convert breakdown to JSON string
            String breakdownJson = mapListToJson(breakdown);

            // 7. Build and save
            Compensation comp = new Compensation();
            comp.setAssignmentId(request.getAssignmentId());
            comp.setAssignPartnerId(request.getAssignPartnerId());
            comp.setCitizenId(request.getCitizenId());
            comp.setCollectorId(request.getCollectorId());
            comp.setSupervisorId(request.getSupervisorId());
            comp.setPartnerId(request.getPartnerId());
            comp.setMaterialType(String.join(", ", materialNames));
            comp.setWeightKg(totalWeight);
            comp.setMaterialBreakdown(breakdownJson);
            comp.setPricePerKg(blendedPricePerKg);
            comp.setGrossAmount(totalGross);
            comp.setVatPct(vatPct);
            comp.setVatAmount(vatAmount);
            comp.setEnvLevyPct(envLevyPct);
            comp.setEnvLevyAmount(envLevyAmount);
            comp.setNetAmount(netAmount);
            comp.setCitizenPct(citizenPct);
            comp.setCitizenAmount(citizenAmount);
            comp.setCollectorPct(collectorPct);
            comp.setCollectorAmount(collectorAmount);
            comp.setSystemPct(systemPct);
            comp.setSystemAmount(systemAmount);

            Compensation saved = compensationRepository.save(comp);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to compensate: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllCompensations() {
        return ResponseEntity.ok(compensationRepository.findAll());
    }

    @GetMapping("/assignment/{assignmentId}")
    public ResponseEntity<?> getByAssignment(@PathVariable Long assignmentId) {
        Optional<Compensation> comp = compensationRepository.findByAssignmentId(assignmentId);
        if (comp.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "No compensation found for assignment " + assignmentId));
        }
        return ResponseEntity.ok(comp.get());
    }

    @GetMapping("/citizen/{citizenId}")
    public ResponseEntity<?> getByCitizen(@PathVariable Long citizenId) {
        return ResponseEntity.ok(compensationRepository.findByCitizenId(citizenId));
    }

    @GetMapping("/collector/{collectorId}")
    public ResponseEntity<?> getByCollector(@PathVariable Long collectorId) {
        return ResponseEntity.ok(compensationRepository.findByCollectorId(collectorId));
    }

    /**
     * Convert list of maps to JSON string
     */
    private String mapListToJson(List<Map<String, Object>> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(mapToJson(list.get(i)));
        }
        sb.append("]");
        return sb.toString();
    }

    /**
     * Convert a single map to JSON object string
     */
    private String mapToJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder("{");
        int count = 0;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (count > 0) sb.append(",");
            sb.append("\"").append(entry.getKey()).append("\":");
            Object value = entry.getValue();
            if (value instanceof String) {
                sb.append("\"").append(value).append("\"");
            } else {
                sb.append(value);
            }
            count++;
        }
        sb.append("}");
        return sb.toString();
    }
}
