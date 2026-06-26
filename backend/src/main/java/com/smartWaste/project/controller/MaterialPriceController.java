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

            // Build map from active DB rows
            Map<String, Double> priceMap = new HashMap<>();
            for (MaterialPrice mp : rows) {
                if (Boolean.TRUE.equals(mp.getActive())) {
                    priceMap.put(mp.getMaterialName(), mp.getPricePerKg());
                }
            }

            // Fill in defaults unless explicitly deactivated in DB
            DEFAULT_PRICES.forEach((mat, price) -> {
                boolean deactivated = rows.stream().anyMatch(
                        r -> mat.equals(r.getMaterialName())
                                && !Boolean.TRUE.equals(r.getActive()));
                if (!deactivated) {
                    priceMap.putIfAbsent(mat, price);
                }
            });

            return ResponseEntity.ok(priceMap);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving material prices: " + e.getMessage()));
        }
    }

    /**
     * POST /api/material-prices
     * Body: { "Plastic": 500, "Metal": 600, ... }
     * Performs a full sync: upserts all materials in the payload and deactivates
     * any existing DB rows whose names are NOT present in the payload.
     */
    @PostMapping
    public ResponseEntity<?> savePrices(
            @RequestBody Map<String, Double> prices,
            Authentication auth) {
        try {
            Long userId = null;
            if (auth != null && auth.isAuthenticated()) {
                Optional<Users> user = usersRepository.findByEmail(auth.getName());
                if (user.isPresent()) {
                    userId = user.get().getId();
                }
            }

            // Upsert each material in the payload
            for (Map.Entry<String, Double> entry : prices.entrySet()) {
                String materialName = entry.getKey();
                Double pricePerKg = entry.getValue();

                if (materialName == null || materialName.isBlank() || pricePerKg == null || pricePerKg < 0) {
                    continue;
                }

                Optional<MaterialPrice> existing = materialPriceRepository
                        .findByMaterialName(materialName);

                if (existing.isPresent()) {
                    MaterialPrice mp = existing.get();
                    mp.setPricePerKg(pricePerKg);
                    mp.setActive(true);
                    mp.setUpdatedBy(userId);
                    materialPriceRepository.save(mp);
                } else {
                    MaterialPrice mp = new MaterialPrice();
                    mp.setMaterialName(materialName);
                    mp.setPricePerKg(pricePerKg);
                    mp.setActive(true);
                    mp.setUpdatedBy(userId);
                    materialPriceRepository.save(mp);
                }
            }

            // Deactivate any DB rows that were NOT included in the payload
            // (handles the case where a category was removed via the UI and then saved)
            List<MaterialPrice> allRows = materialPriceRepository.findAll();
            for (MaterialPrice row : allRows) {
                if (!prices.containsKey(row.getMaterialName()) && Boolean.TRUE.equals(row.getActive())) {
                    row.setActive(false);
                    row.setUpdatedBy(userId);
                    materialPriceRepository.save(row);
                }
            }

            return ResponseEntity.ok(Map.of("message", "Material prices saved successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error saving material prices: " + e.getMessage()));
        }
    }

    /**
     * DELETE /api/material-prices?name=Plastic
     */
    @DeleteMapping
    public ResponseEntity<?> deletePrice(@RequestParam String name) {
        try {
            if (name == null || name.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Material name is required"));
            }

            Optional<MaterialPrice> existing = materialPriceRepository.findByMaterialName(name);
            if (existing.isPresent()) {
                MaterialPrice mp = existing.get();
                mp.setActive(false);
                materialPriceRepository.save(mp);
            } else {
                MaterialPrice mp = new MaterialPrice();
                mp.setMaterialName(name);
                mp.setPricePerKg(DEFAULT_PRICES.getOrDefault(name, 0.0));
                mp.setActive(false);
                materialPriceRepository.save(mp);
            }

            return ResponseEntity.ok(Map.of("message", "Material price deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error deleting material price: " + e.getMessage()));
        }
    }
}
