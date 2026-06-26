package com.smartWaste.project.controller;

import com.smartWaste.project.model.RolePermission;
import com.smartWaste.project.repository.RolePermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/role-permissions")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class RolePermissionController {

    private final RolePermissionRepository rolePermissionRepository;

    // ── GET /api/role-permissions ────────────────────────────────────────────
    /**
     * Returns all role permissions grouped by role.
     * Response:
     * [
     *   { "role": "Citizen", "permissions": [ { "id", "permissionKey", "label", "enabled" }, ... ] },
     *   ...
     * ]
     */
    @GetMapping
    public ResponseEntity<?> getAllPermissions() {
        try {
            ensureDefaults();
            List<RolePermission> all = rolePermissionRepository.findAllByOrderByRoleAscIdAsc();

            // Preserve intended role order
            List<String> ROLE_ORDER = List.of("Citizen", "Collector", "Supervisor", "Administrator");
            Map<String, List<Map<String, Object>>> grouped = new LinkedHashMap<>();
            for (String role : ROLE_ORDER) grouped.put(role, new ArrayList<>());

            for (RolePermission rp : all) {
                grouped.computeIfAbsent(rp.getRole(), k -> new ArrayList<>())
                       .add(toMap(rp));
            }

            List<Map<String, Object>> result = new ArrayList<>();
            for (Map.Entry<String, List<Map<String, Object>>> entry : grouped.entrySet()) {
                if (!entry.getValue().isEmpty()) {
                    Map<String, Object> group = new LinkedHashMap<>();
                    group.put("role", entry.getKey());
                    group.put("permissions", entry.getValue());
                    result.add(group);
                }
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving role permissions: " + e.getMessage()));
        }
    }

    // ── POST /api/role-permissions ───────────────────────────────────────────
    /**
     * Batch-update enabled/disabled state for all role permissions.
     * Body: [ { "permissionKey": "submit-report", "enabled": true }, ... ]
     */
    @PostMapping
    public ResponseEntity<?> savePermissions(@RequestBody List<Map<String, Object>> payload) {
        try {
            for (Map<String, Object> item : payload) {
                String key = stringVal(item.get("permissionKey"));
                if (key == null || key.isBlank()) continue;

                boolean enabled = boolVal(item.get("enabled"), true);
                rolePermissionRepository.findByPermissionKey(key).ifPresent(rp -> {
                    rp.setEnabled(enabled);
                    rolePermissionRepository.save(rp);
                });
            }
            return ResponseEntity.ok(Map.of("message", "Role permissions saved successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error saving role permissions: " + e.getMessage()));
        }
    }

    // ── Defaults ─────────────────────────────────────────────────────────────
    private void ensureDefaults() {
        if (rolePermissionRepository.count() > 0) return;

        List<RolePermission> defaults = List.of(
            // Citizen
            rp("Citizen",       "submit-report",          "Submit waste reports",           true),
            rp("Citizen",       "view-reports",           "View own reports",               true),
            rp("Citizen",       "request-ecopoints",      "Request eco points",             true),
            rp("Citizen",       "view-leaderboard",       "View leaderboard",               true),
            // Collector
            rp("Collector",     "view-tasks",             "View assigned tasks",            true),
            rp("Collector",     "update-status",          "Update collection status",       true),
            rp("Collector",     "mark-complete",          "Mark tasks as completed",        true),
            rp("Collector",     "view-routes",            "View collection routes",         true),
            // Supervisor
            rp("Supervisor",    "assign-tasks",           "Assign tasks to collectors",     true),
            rp("Supervisor",    "view-district-reports",  "View district reports",          true),
            rp("Supervisor",    "manage-collectors",      "Manage collector accounts",      true),
            rp("Supervisor",    "override-assignments",   "Override task assignments",      true),
            // Administrator
            rp("Administrator", "full-access",            "Full system access",             true),
            rp("Administrator", "user-management",        "User management",                true),
            rp("Administrator", "system-settings",        "System settings",                true),
            rp("Administrator", "analytics",              "View analytics",                 true)
        );
        rolePermissionRepository.saveAll(defaults);
    }

    private RolePermission rp(String role, String key, String label, boolean enabled) {
        RolePermission r = new RolePermission();
        r.setRole(role);
        r.setPermissionKey(key);
        r.setLabel(label);
        r.setEnabled(enabled);
        return r;
    }

    private Map<String, Object> toMap(RolePermission rp) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",            rp.getId());
        m.put("permissionKey", rp.getPermissionKey());
        m.put("label",         rp.getLabel());
        m.put("enabled",       rp.getEnabled());
        return m;
    }

    private String stringVal(Object v) { return v == null ? null : v.toString(); }
    private boolean boolVal(Object v, boolean fallback) {
        if (v instanceof Boolean b) return b;
        return fallback;
    }
}
