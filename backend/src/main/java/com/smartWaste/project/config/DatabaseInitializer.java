package com.smartWaste.project.config;

import com.smartWaste.project.model.MaterialPrice;
import com.smartWaste.project.model.WasteCategory;
import com.smartWaste.project.repository.MaterialPriceRepository;
import com.smartWaste.project.repository.WasteCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Seeds the database with default data on application startup.
 * Runs once after the application context is ready and Hibernate has applied schema updates.
 */
@Component
@RequiredArgsConstructor
public class DatabaseInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseInitializer.class);

    private final MaterialPriceRepository materialPriceRepository;
    private final WasteCategoryRepository wasteCategoryRepository;

    // ── Default category metadata (icon + color) ──────────────────────────────
    private static final Map<String, String[]> CATEGORY_META = Map.ofEntries(
        Map.entry("Plastic",     new String[]{"♻️",  "#3b82f6"}),
        Map.entry("Metal",       new String[]{"🔩",  "#ef4444"}),
        Map.entry("Glass",       new String[]{"🍾",  "#8b5cf6"}),
        Map.entry("Paper",       new String[]{"📄",  "#f59e0b"}),
        Map.entry("Cardboard",   new String[]{"📦",  "#f59e0b"}),
        Map.entry("Electronics", new String[]{"⚡",  "#06b6d4"}),
        Map.entry("Batteries",   new String[]{"🔋",  "#06b6d4"}),
        Map.entry("Organic",     new String[]{"🌿",  "#10b981"}),
        Map.entry("Textile",     new String[]{"👕",  "#ec4899"})
    );

    /** Default prices used only when no material_price rows exist */
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

    @Override
    public void run(ApplicationArguments args) {
        seedMaterialPrices();
        seedWasteCategories();
    }

    // ── material_price seeding (kept for backward-compat) ─────────────────────
    private void seedMaterialPrices() {
        try {
            long count = materialPriceRepository.count();
            if (count == 0) {
                log.info("[DatabaseInitializer] Seeding default material_price rows");
                for (Map.Entry<String, Double> entry : DEFAULT_PRICES.entrySet()) {
                    MaterialPrice mp = new MaterialPrice();
                    mp.setMaterialName(entry.getKey());
                    mp.setPricePerKg(entry.getValue());
                    mp.setActive(true);
                    materialPriceRepository.save(mp);
                }
                log.info("[DatabaseInitializer] Seeded {} material_price rows", DEFAULT_PRICES.size());
            }
        } catch (Exception e) {
            log.error("[DatabaseInitializer] Failed to seed material_price: {}", e.getMessage(), e);
        }
    }

    // ── waste_category seeding ────────────────────────────────────────────────
    /**
     * Populates the waste_category table.
     *
     * Strategy:
     *  1. If the table already has rows → skip (admin has configured it).
     *  2. Otherwise: copy prices from material_price (preserving any customisations),
     *     falling back to hardcoded defaults for anything that is missing.
     */
    private void seedWasteCategories() {
        try {
            long count = wasteCategoryRepository.count();
            if (count > 0) {
                log.info("[DatabaseInitializer] waste_category already has {} rows — skipping seed", count);
                return;
            }

            log.info("[DatabaseInitializer] waste_category is empty — seeding from material_price / defaults");

            // Build a price-lookup from existing material_price rows
            Map<String, Double> existingPrices = new java.util.HashMap<>(DEFAULT_PRICES);
            List<MaterialPrice> mpRows = materialPriceRepository.findAll();
            for (MaterialPrice mp : mpRows) {
                if (Boolean.TRUE.equals(mp.getActive()) && mp.getPricePerKg() != null) {
                    existingPrices.put(mp.getMaterialName(), mp.getPricePerKg());
                }
            }

            for (Map.Entry<String, String[]> entry : CATEGORY_META.entrySet()) {
                String name    = entry.getKey();
                String icon    = entry.getValue()[0];
                String color   = entry.getValue()[1];
                double price   = existingPrices.getOrDefault(name, DEFAULT_PRICES.getOrDefault(name, 200.0));

                WasteCategory cat = new WasteCategory();
                cat.setName(name);
                cat.setIcon(icon);
                cat.setColor(color);
                cat.setPricePerKg(price);
                cat.setActive(true);
                wasteCategoryRepository.save(cat);
                log.info("[DatabaseInitializer] Seeded waste_category: {} @ {} CFA/kg", name, price);
            }

            // Also seed any extra categories that exist in material_price but not in CATEGORY_META
            for (MaterialPrice mp : mpRows) {
                if (Boolean.TRUE.equals(mp.getActive())
                        && !CATEGORY_META.containsKey(mp.getMaterialName())) {
                    Optional<WasteCategory> existing = wasteCategoryRepository.findByName(mp.getMaterialName());
                    if (existing.isEmpty()) {
                        WasteCategory cat = new WasteCategory();
                        cat.setName(mp.getMaterialName());
                        cat.setIcon("🗑️");
                        cat.setColor("#6b7280");
                        cat.setPricePerKg(mp.getPricePerKg());
                        cat.setActive(true);
                        wasteCategoryRepository.save(cat);
                        log.info("[DatabaseInitializer] Seeded extra waste_category: {} @ {} CFA/kg",
                                mp.getMaterialName(), mp.getPricePerKg());
                    }
                }
            }

            log.info("[DatabaseInitializer] waste_category seeding complete");
        } catch (Exception e) {
            log.error("[DatabaseInitializer] Failed to seed waste_category: {}", e.getMessage(), e);
        }
    }
}
