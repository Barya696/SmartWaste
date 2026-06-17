package com.smartWaste.project.controller;

import com.smartWaste.project.model.AppNotification;
import com.smartWaste.project.model.Users;
import com.smartWaste.project.repository.UsersRepository;
import com.smartWaste.project.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class NotificationController {

    private final NotificationService notificationService;
    private final UsersRepository usersRepository;

    @GetMapping
    public ResponseEntity<?> getMyNotifications(Authentication auth) {
        try {
            Long userId = resolveUserId(auth);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Not authenticated"));
            }

            List<AppNotification> notifications = notificationService.syncAndGetForUser(userId);
            List<Map<String, Object>> payload = notifications.stream()
                    .map(this::toResponse)
                    .toList();
            return ResponseEntity.ok(payload);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to load notifications: " + e.getMessage()));
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication auth) {
        try {
            Long userId = resolveUserId(auth);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Not authenticated"));
            }
            long count = notificationService.getUnreadCount(userId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to load unread count: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id, Authentication auth) {
        try {
            Long userId = resolveUserId(auth);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Not authenticated"));
            }
            notificationService.markRead(userId, id);
            return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to mark notification: " + e.getMessage()));
        }
    }

    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllRead(Authentication auth) {
        try {
            Long userId = resolveUserId(auth);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Not authenticated"));
            }
            notificationService.markAllRead(userId);
            return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to mark notifications: " + e.getMessage()));
        }
    }

    private Map<String, Object> toResponse(AppNotification notification) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", String.valueOf(notification.getId()));
        map.put("title", notification.getTitle());
        map.put("message", notification.getMessage());
        map.put("type", notification.getType().name().toLowerCase());
        map.put("category", NotificationService.resolveCategory(notification.getSourceKey()));
        map.put("read", notification.isRead());
        LocalDateTime eventAt = notification.getEventAt();
        map.put("createdAt", eventAt != null ? eventAt.toString() : notification.getCreatedAt().toString());
        map.put("time", formatRelativeTime(eventAt != null ? eventAt : notification.getCreatedAt()));
        return map;
    }

    private String formatRelativeTime(LocalDateTime time) {
        Duration diff = Duration.between(time, LocalDateTime.now());
        long mins = diff.toMinutes();
        if (mins < 1) return "Just now";
        if (mins < 60) return mins + "m ago";
        long hrs = diff.toHours();
        if (hrs < 24) return hrs + "h ago";
        long days = diff.toDays();
        return days + "d ago";
    }

    private Long resolveUserId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return null;
        String principal = auth.getName();
        Optional<Users> byEmail = usersRepository.findByEmail(principal);
        if (byEmail.isPresent()) {
            return byEmail.get().getId();
        }
        return usersRepository.findByUsername(principal).map(Users::getId).orElse(null);
    }
}
