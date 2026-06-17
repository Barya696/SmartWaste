package com.smartWaste.project.controller;

import com.smartWaste.project.model.MaterialPrice;
import com.smartWaste.project.model.Users;
import com.smartWaste.project.repository.MaterialPriceRepository;
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
@RequestMapping("/api/material-prices")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class MaterialPriceController {

    private final MaterialPriceRepository materialPriceRepository;
    private final UsersRepository usersRepository;

    // Default prices to return if DB is empty
    private static final Map<String, Double> DEFAULT_PRICES = Map.of(
        "Plastic",     500.0,
        "Metal",       500.0,
        "Glass",       200.0,
        "Paper",       150.0,
        "Cardboard",   150.0,
        "Electronics", 800.0,
        "Batteries",   600.0,
        "Organic",     100.0,
        "Textile",     200.0
    );

    /**
     * GET /api/material-prices
     * Returns { "Plastic": 500, "Metal": 500, ... }
     */
    @GetMapping
    public ResponseEntity<?> getAllPrices() {
        try {
            List<MaterialPrice> rows = materialPriceRepository.findAll();

            // If no rows yet, return defaults
            if (rows.isEmpty()) {
                return ResponseEntity.ok(DEFAULT_PRICES);
            }

            // Build map from DB rows
            Map<String, Double> priceMap = new HashMap<>();
            for (MaterialPrice mp : rows) {
                priceMap.put(mp.getMaterialName(), mp.getPricePerKg());
            }

            // Fill in any missing materials with defaults
            DEFAULT_PRICES.forEach((mat, price) ->
                priceMap.putIfAbsent(mat, price)
            );

            return ResponseEntity.ok(priceMap);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving material prices: " + e.getMessage()));
        }
    }

    /**
     * POST /api/material-prices
     * Body: { "Plastic": 500, "Metal": 600, ... }
     * Upserts one row per material.
     */
    @PostMapping
    public ResponseEntity<?> savePrices(
            @RequestBody Map<String, Double> prices,
            Authentication auth) {
        try {
            Long supervisorId = null;
            if (auth != null && auth.isAuthenticated()) {
                Optional<Users> user = usersRepository.findByEmail(auth.getName());
                if (user.isPresent()) {
                    supervisorId = user.get().getId();
                }
            }

            for (Map.Entry<String, Double> entry : prices.entrySet()) {
                String materialName = entry.getKey();
                Double pricePerKg = entry.getValue();

                if (pricePerKg == null || pricePerKg < 0) {
                    continue;
                }

                Optional<MaterialPrice> existing = materialPriceRepository
                        .findByMaterialName(materialName);

                if (existing.isPresent()) {
                    // Update existing row
                    MaterialPrice mp = existing.get();
                    mp.setPricePerKg(pricePerKg);
                    mp.setUpdatedBy(supervisorId);
                    materialPriceRepository.save(mp);
                } else {
                    // Insert new row
                    MaterialPrice mp = new MaterialPrice();
                    mp.setMaterialName(materialName);
                    mp.setPricePerKg(pricePerKg);
                    mp.setUpdatedBy(supervisorId);
                    materialPriceRepository.save(mp);
                }
            }

            return ResponseEntity.ok(Map.of("message", "Material prices saved successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error saving material prices: " + e.getMessage()));
        }
    }
}
