package com.smartWaste.project.controller;

import com.smartWaste.project.model.Users;
import com.smartWaste.project.model.WasteCategory;
import com.smartWaste.project.repository.UsersRepository;
import com.smartWaste.project.repository.WasteCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/waste-categories")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class WasteCategoryController {

    private final WasteCategoryRepository wasteCategoryRepository;
    private final UsersRepository usersRepository;

    // ── GET /api/waste-categories ─────────────────────────────────────────────
    /**
     * Returns all active waste categories as a list of objects.
     * Response: [ { id, name, icon, color, pricePerKg, active }, ... ]
     */
    @GetMapping
    public ResponseEntity<?> getAllCategories() {
        try {
            List<WasteCategory> categories = wasteCategoryRepository.findAllByActiveTrueOrderByNameAsc();
            List<Map<String, Object>> result = categories.stream()
                    .map(this::toCategoryMap)
                    .toList();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving waste categories: " + e.getMessage()));
        }
    }

    // ── POST /api/waste-categories ────────────────────────────────────────────
    /**
     * Full sync — upserts every category in the payload and deactivates
     * any DB row whose name is NOT present in the payload.
     *
     * Body: [ { name, icon, color, pricePerKg, active }, ... ]
     */
    @PostMapping
    public ResponseEntity<?> saveCategories(
            @RequestBody List<Map<String, Object>> payload,
            Authentication auth) {
        try {
            Long userId = resolveUserId(auth);

            Set<String> payloadNames = new HashSet<>();

            for (Map<String, Object> item : payload) {
                String name = stringVal(item.get("name"));
                if (name == null || name.isBlank()) continue;

                Double pricePerKg = doubleVal(item.get("pricePerKg"));
                if (pricePerKg == null || pricePerKg < 0) pricePerKg = 0.0;

                String icon  = stringVal(item.get("icon"));
                String color = stringVal(item.get("color"));
                boolean active = boolVal(item.get("active"), true);

                payloadNames.add(name);

                WasteCategory cat = wasteCategoryRepository.findByName(name)
                        .orElseGet(() -> {
                            WasteCategory c = new WasteCategory();
                            c.setName(name);
                            return c;
                        });

                if (icon  != null) cat.setIcon(icon);
                if (color != null) cat.setColor(color);
                cat.setPricePerKg(pricePerKg);
                cat.setActive(active);
                cat.setUpdatedBy(userId);
                wasteCategoryRepository.save(cat);
            }

            // Deactivate anything in the DB that was NOT included in the payload
            for (WasteCategory existing : wasteCategoryRepository.findAll()) {
                if (!payloadNames.contains(existing.getName()) && Boolean.TRUE.equals(existing.getActive())) {
                    existing.setActive(false);
                    existing.setUpdatedBy(userId);
                    wasteCategoryRepository.save(existing);
                }
            }

            return ResponseEntity.ok(Map.of("message", "Waste categories saved successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error saving waste categories: " + e.getMessage()));
        }
    }

    // ── DELETE /api/waste-categories?name=Plastic ─────────────────────────────
    /**
     * Soft-deletes a category by name (sets active = false).
     */
    @DeleteMapping
    public ResponseEntity<?> deleteCategory(@RequestParam String name, Authentication auth) {
        try {
            if (name == null || name.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Category name is required"));
            }

            Long userId = resolveUserId(auth);

            WasteCategory cat = wasteCategoryRepository.findByName(name)
                    .orElseGet(() -> {
                        WasteCategory c = new WasteCategory();
                        c.setName(name);
                        c.setPricePerKg(0.0);
                        return c;
                    });

            cat.setActive(false);
            cat.setUpdatedBy(userId);
            wasteCategoryRepository.save(cat);

            return ResponseEntity.ok(Map.of("message", "Waste category \"" + name + "\" deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error deleting waste category: " + e.getMessage()));
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Map<String, Object> toCategoryMap(WasteCategory cat) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id",         cat.getId());
        map.put("name",       cat.getName());
        map.put("icon",       cat.getIcon());
        map.put("color",      cat.getColor());
        map.put("pricePerKg", cat.getPricePerKg());
        map.put("active",     cat.getActive());
        return map;
    }

    private Long resolveUserId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return null;
        return usersRepository.findByEmail(auth.getName())
                .map(Users::getId)
                .orElse(null);
    }

    private String stringVal(Object v) {
        return v == null ? null : v.toString();
    }

    private Double doubleVal(Object v) {
        if (v instanceof Number n) return n.doubleValue();
        if (v instanceof String s) {
            try { return Double.parseDouble(s); } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    private boolean boolVal(Object v, boolean fallback) {
        if (v instanceof Boolean b) return b;
        return fallback;
    }
}
