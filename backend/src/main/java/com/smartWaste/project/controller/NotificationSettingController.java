package com.smartWaste.project.controller;

import com.smartWaste.project.model.NotificationSetting;
import com.smartWaste.project.repository.NotificationSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/notification-settings")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class NotificationSettingController {

    private final NotificationSettingRepository notificationSettingRepository;

    // ── GET /api/notification-settings ──────────────────────────────────────
    /**
     * Returns all notification settings grouped by category.
     * Response:
     * [
     *   { "category": "Reports", "settings": [ { "id", "settingKey", "label", "enabled" }, ... ] },
     *   ...
     * ]
     */
    @GetMapping
    public ResponseEntity<?> getAllSettings() {
        try {
            ensureDefaults();
            List<NotificationSetting> all = notificationSettingRepository.findAllByOrderByCategoryAscIdAsc();

            // Group by category
            Map<String, List<Map<String, Object>>> grouped = new LinkedHashMap<>();
            for (NotificationSetting ns : all) {
                grouped.computeIfAbsent(ns.getCategory(), k -> new ArrayList<>())
                       .add(toMap(ns));
            }

            List<Map<String, Object>> result = new ArrayList<>();
            for (Map.Entry<String, List<Map<String, Object>>> entry : grouped.entrySet()) {
                Map<String, Object> group = new LinkedHashMap<>();
                group.put("category", entry.getKey());
                group.put("settings", entry.getValue());
                result.add(group);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving notification settings: " + e.getMessage()));
        }
    }

    // ── POST /api/notification-settings ─────────────────────────────────────
    /**
     * Batch-update enabled/disabled state for all notification settings.
     * Body: [ { "settingKey": "new-report", "enabled": true }, ... ]
     */
    @PostMapping
    public ResponseEntity<?> saveSettings(@RequestBody List<Map<String, Object>> payload) {
        try {
            for (Map<String, Object> item : payload) {
                String key = stringVal(item.get("settingKey"));
                if (key == null || key.isBlank()) continue;

                boolean enabled = boolVal(item.get("enabled"), true);
                notificationSettingRepository.findBySettingKey(key).ifPresent(ns -> {
                    ns.setEnabled(enabled);
                    notificationSettingRepository.save(ns);
                });
            }
            return ResponseEntity.ok(Map.of("message", "Notification settings saved successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error saving notification settings: " + e.getMessage()));
        }
    }

    // ── Defaults ─────────────────────────────────────────────────────────────
    private void ensureDefaults() {
        if (notificationSettingRepository.count() > 0) return;

        List<NotificationSetting> defaults = List.of(
            ns("Reports",     "new-report",          "New waste report submitted",     true),
            ns("Reports",     "report-assigned",     "Report assigned to collector",   true),
            ns("Reports",     "report-completed",    "Report marked as completed",     true),
            ns("Collections", "collection-scheduled","Collection scheduled",           true),
            ns("Collections", "collection-started",  "Collection started",             false),
            ns("Collections", "collection-completed","Collection completed",           true),
            ns("System",      "user-registered",     "New user registration",          true),
            ns("System",      "system-alert",        "System alerts and warnings",     true),
            ns("System",      "maintenance",         "Scheduled maintenance",          true)
        );
        notificationSettingRepository.saveAll(defaults);
    }

    private NotificationSetting ns(String category, String key, String label, boolean enabled) {
        NotificationSetting s = new NotificationSetting();
        s.setCategory(category);
        s.setSettingKey(key);
        s.setLabel(label);
        s.setEnabled(enabled);
        return s;
    }

    private Map<String, Object> toMap(NotificationSetting ns) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",         ns.getId());
        m.put("settingKey", ns.getSettingKey());
        m.put("label",      ns.getLabel());
        m.put("enabled",    ns.getEnabled());
        return m;
    }

    private String stringVal(Object v) { return v == null ? null : v.toString(); }
    private boolean boolVal(Object v, boolean fallback) {
        if (v instanceof Boolean b) return b;
        return fallback;
    }
}
