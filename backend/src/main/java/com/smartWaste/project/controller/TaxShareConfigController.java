package com.smartWaste.project.controller;

import com.smartWaste.project.model.ShareConfig;
import com.smartWaste.project.model.TaxConfig;
import com.smartWaste.project.model.Users;
import com.smartWaste.project.repository.ShareConfigRepository;
import com.smartWaste.project.repository.TaxConfigRepository;
import com.smartWaste.project.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class TaxShareConfigController {

    private final TaxConfigRepository taxConfigRepository;
    private final ShareConfigRepository shareConfigRepository;
    private final UsersRepository usersRepository;

    private static final Map<String, Double> DEFAULT_TAXES = Map.of(
        "VAT", 18.0,
        "Environmental Levy", 2.0
    );

    private static final Map<String, Double> DEFAULT_SHARES = Map.of(
        "Citizen",   60.0,
        "Collector", 25.0,
        "System",    15.0
    );

    // ── TAX CONFIG ──────────────────────────────────────────────────────────

    /**
     * GET /api/tax-config
     * Returns { "VAT": 18.0, "Environmental Levy": 2.0 }
     */
    @GetMapping("/api/tax-config")
    public ResponseEntity<?> getTaxConfig() {
        try {
            List<TaxConfig> rows = taxConfigRepository.findAll();
            if (rows.isEmpty()) {
                return ResponseEntity.ok(DEFAULT_TAXES);
            }
            Map<String, Double> result = new HashMap<>();
            for (TaxConfig tc : rows) {
                result.put(tc.getTaxName(), tc.getPercentage());
            }
            DEFAULT_TAXES.forEach(result::putIfAbsent);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving tax config: " + e.getMessage()));
        }
    }

    /**
     * POST /api/tax-config
     * Body: { "VAT": 18.0, "Environmental Levy": 2.0 }
     */
    @PostMapping("/api/tax-config")
    public ResponseEntity<?> saveTaxConfig(
            @RequestBody Map<String, Double> taxes,
            Authentication auth) {
        try {
            Long supervisorId = resolveUserId(auth);
            for (Map.Entry<String, Double> entry : taxes.entrySet()) {
                if (entry.getValue() == null || entry.getValue() < 0) {
                    continue;
                }
                Optional<TaxConfig> existing = taxConfigRepository.findByTaxName(entry.getKey());
                if (existing.isPresent()) {
                    TaxConfig tc = existing.get();
                    tc.setPercentage(entry.getValue());
                    tc.setUpdatedBy(supervisorId);
                    taxConfigRepository.save(tc);
                } else {
                    TaxConfig tc = new TaxConfig();
                    tc.setTaxName(entry.getKey());
                    tc.setPercentage(entry.getValue());
                    tc.setUpdatedBy(supervisorId);
                    taxConfigRepository.save(tc);
                }
            }
            return ResponseEntity.ok(Map.of("message", "Tax config saved successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error saving tax config: " + e.getMessage()));
        }
    }

    // ── SHARE CONFIG ─────────────────────────────────────────────────────────

    /**
     * GET /api/share-config
     * Returns { "Citizen": 60.0, "Collector": 25.0, "System": 15.0 }
     */
    @GetMapping("/api/share-config")
    public ResponseEntity<?> getShareConfig() {
        try {
            List<ShareConfig> rows = shareConfigRepository.findAll();
            if (rows.isEmpty()) {
                return ResponseEntity.ok(DEFAULT_SHARES);
            }
            Map<String, Double> result = new HashMap<>();
            for (ShareConfig sc : rows) {
                result.put(sc.getShareName(), sc.getPercentage());
            }
            DEFAULT_SHARES.forEach(result::putIfAbsent);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving share config: " + e.getMessage()));
        }
    }

    /**
     * POST /api/share-config
     * Body: { "Citizen": 60.0, "Collector": 25.0, "System": 15.0 }
     */
    @PostMapping("/api/share-config")
    public ResponseEntity<?> saveShareConfig(
            @RequestBody Map<String, Double> shares,
            Authentication auth) {
        try {
            // Validate shares sum to 100
            double total = shares.values().stream().mapToDouble(Double::doubleValue).sum();
            if (Math.abs(total - 100.0) > 0.01) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Shares must total 100%. Current sum: " + total));
            }

            Long supervisorId = resolveUserId(auth);
            for (Map.Entry<String, Double> entry : shares.entrySet()) {
                if (entry.getValue() == null || entry.getValue() < 0) {
                    continue;
                }
                Optional<ShareConfig> existing = shareConfigRepository.findByShareName(entry.getKey());
                if (existing.isPresent()) {
                    ShareConfig sc = existing.get();
                    sc.setPercentage(entry.getValue());
                    sc.setUpdatedBy(supervisorId);
                    shareConfigRepository.save(sc);
                } else {
                    ShareConfig sc = new ShareConfig();
                    sc.setShareName(entry.getKey());
                    sc.setPercentage(entry.getValue());
                    sc.setUpdatedBy(supervisorId);
                    shareConfigRepository.save(sc);
                }
            }
            return ResponseEntity.ok(Map.of("message", "Share config saved successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error saving share config: " + e.getMessage()));
        }
    }

    private Long resolveUserId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return null;
        Optional<Users> user = usersRepository.findByEmail(auth.getName());
        return user.map(Users::getId).orElse(null);
    }
}
