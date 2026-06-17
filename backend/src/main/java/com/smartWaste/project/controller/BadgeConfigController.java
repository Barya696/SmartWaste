package com.smartWaste.project.controller;

import com.smartWaste.project.model.BadgeConfig;
import com.smartWaste.project.model.EcoPointsConfig;
import com.smartWaste.project.repository.BadgeConfigRepository;
import com.smartWaste.project.repository.EcoPointsConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/badge-config")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class BadgeConfigController {

    private final BadgeConfigRepository badgeConfigRepository;
    private final EcoPointsConfigRepository ecoPointsConfigRepository;

    private static final int DEFAULT_POINTS_PER_COMPENSATION = 50;

    @GetMapping
    public ResponseEntity<?> getBadgeConfig() {
        try {
            ensureDefaults();
            int pointsPerCompensation = resolvePointsPerCompensation();
            List<Map<String, Object>> badges = badgeConfigRepository.findAllByOrderBySortOrderAsc()
                    .stream()
                    .map(this::toBadgeMap)
                    .toList();
            return ResponseEntity.ok(Map.of(
                    "pointsPerCompensation", pointsPerCompensation,
                    "badges", badges
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving badge config: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> saveBadgeConfig(@RequestBody Map<String, Object> body) {
        try {
            Object pointsObj = body.get("pointsPerCompensation");
            if (pointsObj != null) {
                int points = ((Number) pointsObj).intValue();
                if (points < 0) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Points per compensation must be zero or positive"));
                }
                savePointsPerCompensation(points);
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> badges = (List<Map<String, Object>>) body.get("badges");
            if (badges != null) {
                for (Map<String, Object> badgeData : badges) {
                    upsertBadge(badgeData);
                }
            }

            return ResponseEntity.ok(Map.of("message", "Badge configuration saved successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error saving badge config: " + e.getMessage()));
        }
    }

    private void ensureDefaults() {
        if (badgeConfigRepository.count() == 0) {
            seedDefaultBadges();
        }
        if (ecoPointsConfigRepository.findByConfigKey(EcoPointsConfig.POINTS_PER_COMPENSATION).isEmpty()) {
            EcoPointsConfig cfg = new EcoPointsConfig();
            cfg.setConfigKey(EcoPointsConfig.POINTS_PER_COMPENSATION);
            cfg.setConfigValue(DEFAULT_POINTS_PER_COMPENSATION);
            ecoPointsConfigRepository.save(cfg);
        }
    }

    private void seedDefaultBadges() {
        List<BadgeConfig> defaults = List.of(
                badge("first-reporter", "First Reporter", "🎯",
                        "Submitted your first report", "1 report",
                        "REPORTS_SUBMITTED", 1, 10, "#1cb97a", 1),
                badge("eco-warrior", "Eco Warrior", "🌍",
                        "Submit 10 waste reports", "10 reports",
                        "REPORTS_SUBMITTED", 10, 25, "#10b981", 2),
                badge("recycling-champion", "Recycling Champion", "♻️",
                        "Recycle 100kg of waste", "100 kg recycled",
                        "WEIGHT_RECYCLED_KG", 100, 100, "#3b82f6", 3),
                badge("community-leader", "Community Leader", "👑",
                        "Help clean 5 neighborhoods", "5 neighborhoods",
                        "DISTRICTS_HELPED", 5, 50, "#f59e0b", 4),
                badge("green-hero", "Green Hero", "🦸",
                        "Earn 1000 eco points", "1000 points",
                        "ECO_POINTS", 1000, 0, "#8b5cf6", 5),
                badge("sustainability-star", "Sustainability Star", "⭐",
                        "Active for 30 consecutive days", "30-day streak",
                        "ACTIVE_STREAK_DAYS", 30, 75, "#ec4899", 6)
        );
        badgeConfigRepository.saveAll(defaults);
    }

    private BadgeConfig badge(
            String key, String name, String icon, String description, String criteriaLabel,
            String criteriaType, int threshold, int pointsReward, String color, int sortOrder) {
        BadgeConfig b = new BadgeConfig();
        b.setBadgeKey(key);
        b.setName(name);
        b.setIcon(icon);
        b.setDescription(description);
        b.setCriteriaLabel(criteriaLabel);
        b.setCriteriaType(criteriaType);
        b.setCriteriaThreshold(threshold);
        b.setPointsReward(pointsReward);
        b.setColor(color);
        b.setActive(true);
        b.setSortOrder(sortOrder);
        return b;
    }

    private int resolvePointsPerCompensation() {
        return ecoPointsConfigRepository.findByConfigKey(EcoPointsConfig.POINTS_PER_COMPENSATION)
                .map(EcoPointsConfig::getConfigValue)
                .orElse(DEFAULT_POINTS_PER_COMPENSATION);
    }

    private void savePointsPerCompensation(int points) {
        EcoPointsConfig cfg = ecoPointsConfigRepository
                .findByConfigKey(EcoPointsConfig.POINTS_PER_COMPENSATION)
                .orElseGet(() -> {
                    EcoPointsConfig created = new EcoPointsConfig();
                    created.setConfigKey(EcoPointsConfig.POINTS_PER_COMPENSATION);
                    return created;
                });
        cfg.setConfigValue(points);
        ecoPointsConfigRepository.save(cfg);
    }

    private void upsertBadge(Map<String, Object> data) {
        String badgeKey = stringVal(data.get("badgeKey"));
        if (badgeKey == null || badgeKey.isBlank()) {
            return;
        }

        BadgeConfig badge = badgeConfigRepository.findByBadgeKey(badgeKey)
                .orElseGet(() -> {
                    BadgeConfig created = new BadgeConfig();
                    created.setBadgeKey(badgeKey);
                    return created;
                });

        if (data.containsKey("name")) badge.setName(stringVal(data.get("name")));
        if (data.containsKey("icon")) badge.setIcon(stringVal(data.get("icon")));
        if (data.containsKey("description")) badge.setDescription(stringVal(data.get("description")));
        if (data.containsKey("criteriaLabel")) badge.setCriteriaLabel(stringVal(data.get("criteriaLabel")));
        if (data.containsKey("criteriaType")) badge.setCriteriaType(stringVal(data.get("criteriaType")));
        if (data.containsKey("criteriaThreshold")) {
            badge.setCriteriaThreshold(intVal(data.get("criteriaThreshold"), badge.getCriteriaThreshold()));
        }
        if (data.containsKey("pointsReward")) {
            badge.setPointsReward(intVal(data.get("pointsReward"), badge.getPointsReward()));
        }
        if (data.containsKey("color")) badge.setColor(stringVal(data.get("color")));
        if (data.containsKey("active")) badge.setActive(boolVal(data.get("active"), true));
        if (data.containsKey("sortOrder")) {
            badge.setSortOrder(intVal(data.get("sortOrder"), badge.getSortOrder()));
        }

        badgeConfigRepository.save(badge);
    }

    private Map<String, Object> toBadgeMap(BadgeConfig badge) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", badge.getId());
        map.put("badgeKey", badge.getBadgeKey());
        map.put("name", badge.getName());
        map.put("icon", badge.getIcon());
        map.put("description", badge.getDescription());
        map.put("criteriaLabel", badge.getCriteriaLabel());
        map.put("criteriaType", badge.getCriteriaType());
        map.put("criteriaThreshold", badge.getCriteriaThreshold());
        map.put("pointsReward", badge.getPointsReward());
        map.put("color", badge.getColor());
        map.put("active", badge.getActive());
        map.put("sortOrder", badge.getSortOrder());
        return map;
    }

    private String stringVal(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private int intVal(Object value, int fallback) {
        if (value instanceof Number n) return n.intValue();
        return fallback;
    }

    private boolean boolVal(Object value, boolean fallback) {
        if (value instanceof Boolean b) return b;
        return fallback;
    }
}
