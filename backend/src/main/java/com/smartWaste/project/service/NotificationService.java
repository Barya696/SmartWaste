package com.smartWaste.project.service;

import com.smartWaste.project.model.*;
import com.smartWaste.project.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final AppNotificationRepository notificationRepository;
    private final UsersRepository usersRepository;
    private final ReportWasteRepository reportWasteRepository;
    private final AssignCollectorRepository assignCollectorRepository;
    private final CompensationRepository compensationRepository;
    private final SecurityEventRepository securityEventRepository;

    private record NotificationDraft(
            String sourceKey,
            String category,
            String title,
            String message,
            AppNotification.NotificationType type,
            LocalDateTime eventAt
    ) {}

    public List<AppNotification> syncAndGetForUser(Long userId) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<NotificationDraft> drafts = buildDrafts(user);
        Set<String> activeKeys = new HashSet<>();

        for (NotificationDraft draft : drafts) {
            activeKeys.add(draft.sourceKey());
            upsert(userId, draft);
        }

        if (!activeKeys.isEmpty()) {
            notificationRepository.deleteByUserIdAndSourceKeyNotIn(userId, activeKeys);
        }

        return notificationRepository.findByUserIdOrderByEventAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        syncAndGetForUser(userId);
        return notificationRepository.countUnreadByUserId(userId);
    }

    public void markRead(Long userId, Long notificationId) {
        AppNotification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public void markAllRead(Long userId) {
        List<AppNotification> notifications = notificationRepository.findByUserIdOrderByEventAtDesc(userId);
        for (AppNotification n : notifications) {
            n.setRead(true);
        }
        notificationRepository.saveAll(notifications);
    }

    public static String resolveCategory(String sourceKey) {
        if (sourceKey == null) return "General";
        if (sourceKey.startsWith("citizen-assigned-")) return "Assigned";
        if (sourceKey.startsWith("citizen-recycled-")) return "Recycled";
        if (sourceKey.startsWith("citizen-compensated-")) return "Compensated";
        if (sourceKey.startsWith("collector-task-")) return "Assigned task";
        if (sourceKey.startsWith("collector-compensated-")) return "Compensated";
        if (sourceKey.startsWith("waste-report-")) return "Submitted waste report";
        if (sourceKey.startsWith("waste-resubmit-")) return "Resubmission";
        if (sourceKey.startsWith("recycling-waiting-")) return "Collected waste waiting for recycling";
        if (sourceKey.startsWith("admin-security-")) return "Security alert";
        return "General";
    }

    private void upsert(Long userId, NotificationDraft draft) {
        AppNotification notification = notificationRepository
                .findByUserIdAndSourceKey(userId, draft.sourceKey())
                .orElseGet(() -> {
                    AppNotification created = new AppNotification();
                    created.setUserId(userId);
                    created.setSourceKey(draft.sourceKey());
                    created.setRead(false);
                    return created;
                });

        notification.setTitle(draft.title());
        notification.setMessage(draft.message());
        notification.setType(draft.type());
        notification.setEventAt(draft.eventAt());
        notificationRepository.save(notification);
    }

    private List<NotificationDraft> buildDrafts(Users user) {
        if (user.getRole() == null) {
            return List.of();
        }
        return switch (user.getRole()) {
            case CITIZEN -> buildCitizenDrafts(user.getId());
            case COLLECTOR -> buildCollectorDrafts(user.getId());
            case SUPERVISOR -> buildSupervisorDrafts(user);
            case ADMIN -> buildAdminDrafts();
        };
    }

    private List<NotificationDraft> buildCitizenDrafts(Long userId) {
        List<NotificationDraft> drafts = new ArrayList<>();
        List<ReportWaste> reports = reportWasteRepository.findByUserIdOrderByCreatedAtDesc(userId);

        for (ReportWaste report : reports) {
            List<AssignCollector> assignments = assignCollectorRepository.findByReportId(report.getId());
            for (AssignCollector assignment : assignments) {
                AssignCollector.AssignmentStatus status = assignment.getAssignmentStatus();

                if (status == AssignCollector.AssignmentStatus.PENDING
                        || status == AssignCollector.AssignmentStatus.ACCEPTED
                        || status == AssignCollector.AssignmentStatus.IN_PROGRESS) {
                    drafts.add(new NotificationDraft(
                            "citizen-assigned-" + assignment.getId(),
                            "Assigned",
                            "Collector assigned",
                            "A collector was assigned to your report " + report.getTrackingNumber()
                                    + " in " + report.getDistrict() + ".",
                            AppNotification.NotificationType.ACTION,
                            eventTime(assignment.getUpdatedAt(), assignment.getCreatedAt())
                    ));
                }

                if (status == AssignCollector.AssignmentStatus.RECYCLED) {
                    drafts.add(new NotificationDraft(
                            "citizen-recycled-" + assignment.getId(),
                            "Recycled",
                            "Waste recycled",
                            "Your report " + report.getTrackingNumber() + " at "
                                    + report.getLocation() + " was sent for recycling.",
                            AppNotification.NotificationType.SUCCESS,
                            eventTime(assignment.getUpdatedAt(), assignment.getCreatedAt())
                    ));
                }
            }
        }

        List<Compensation> compensations = compensationRepository.findByCitizenId(userId);
        for (Compensation comp : compensations) {
            double amount = comp.getCitizenAmount() != null ? comp.getCitizenAmount() : 0.0;
            drafts.add(new NotificationDraft(
                    "citizen-compensated-" + comp.getId(),
                    "Compensated",
                    "Compensation received",
                    "You received " + Math.round(amount) + " XAF for recycled materials.",
                    AppNotification.NotificationType.SUCCESS,
                    eventTime(comp.getCompensatedAt(), comp.getCreatedAt())
            ));
        }

        return drafts;
    }

    private List<NotificationDraft> buildCollectorDrafts(Long userId) {
        List<NotificationDraft> drafts = new ArrayList<>();
        List<AssignCollector> assignments = assignCollectorRepository.findByCollectorId(userId);

        for (AssignCollector assignment : assignments) {
            AssignCollector.AssignmentStatus status = assignment.getAssignmentStatus();
            if (status == AssignCollector.AssignmentStatus.PENDING
                    || status == AssignCollector.AssignmentStatus.ACCEPTED
                    || status == AssignCollector.AssignmentStatus.IN_PROGRESS) {
                drafts.add(new NotificationDraft(
                        "collector-task-" + assignment.getId(),
                        "Assigned task",
                        "New collection task",
                        "Assignment #" + assignment.getId() + " is ready for collection.",
                        status == AssignCollector.AssignmentStatus.PENDING
                                ? AppNotification.NotificationType.ACTION
                                : AppNotification.NotificationType.INFO,
                        eventTime(assignment.getUpdatedAt(), assignment.getCreatedAt())
                ));
            }
        }

        List<Compensation> compensations = compensationRepository.findByCollectorId(userId);
        for (Compensation comp : compensations) {
            double amount = comp.getCollectorAmount() != null ? comp.getCollectorAmount() : 0.0;
            drafts.add(new NotificationDraft(
                    "collector-compensated-" + comp.getId(),
                    "Compensated",
                    "Compensation received",
                    "You earned " + Math.round(amount) + " XAF for assignment #"
                            + comp.getAssignmentId() + ".",
                    AppNotification.NotificationType.SUCCESS,
                    eventTime(comp.getCompensatedAt(), comp.getCreatedAt())
            ));
        }

        return drafts;
    }

    private List<NotificationDraft> buildSupervisorDrafts(Users user) {
        if (user.getDepartment() == Users.Department.RECYCLING_OPERATIONS) {
            return buildRecyclingSupervisorDrafts();
        }
        return buildWasteSupervisorDrafts();
    }

    private List<NotificationDraft> buildWasteSupervisorDrafts() {
        List<NotificationDraft> drafts = new ArrayList<>();
        List<ReportWaste> pending = reportWasteRepository.findByStatus("pending");

        int count = 0;
        for (ReportWaste report : pending) {
            if (count >= 15) break;

            if (report.getLastResubmittedAt() != null) {
                drafts.add(new NotificationDraft(
                        "waste-resubmit-" + report.getId(),
                        "Resubmission",
                        "Report resubmitted",
                        report.getTrackingNumber() + " was resubmitted in " + report.getDistrict()
                                + " — " + report.getLocation() + ".",
                        AppNotification.NotificationType.WARNING,
                        eventTime(report.getLastResubmittedAt(), report.getUpdatedAt())
                ));
            } else {
                drafts.add(new NotificationDraft(
                        "waste-report-" + report.getId(),
                        "Submitted waste report",
                        "New waste report",
                        report.getCategory() + " reported in " + report.getDistrict()
                                + " — " + report.getLocation() + ".",
                        AppNotification.NotificationType.ACTION,
                        report.getCreatedAt()
                ));
            }
            count++;
        }

        return drafts;
    }

    private List<NotificationDraft> buildRecyclingSupervisorDrafts() {
        List<NotificationDraft> drafts = new ArrayList<>();
        List<AssignCollector> waiting = assignCollectorRepository.findByAssignmentStatus(
                AssignCollector.AssignmentStatus.COMPLETED);

        int count = 0;
        for (AssignCollector assignment : waiting) {
            if (count >= 15) break;
            ReportWaste report = assignment.getWasteReport();
            String tracking = report != null ? report.getTrackingNumber() : "Report #" + assignment.getReportId();
            String location = report != null
                    ? report.getDistrict() + " — " + report.getLocation()
                    : "Assignment #" + assignment.getId();

            drafts.add(new NotificationDraft(
                    "recycling-waiting-" + assignment.getId(),
                    "Collected waste waiting for recycling",
                    "Waste ready for recycling",
                    tracking + " was collected and is waiting to be assigned to a recycling partner (" + location + ").",
                    AppNotification.NotificationType.ACTION,
                    eventTime(assignment.getUpdatedAt(), assignment.getCreatedAt())
            ));
            count++;
        }

        return drafts;
    }

    private List<NotificationDraft> buildAdminDrafts() {
        List<NotificationDraft> drafts = new ArrayList<>();
        List<SecurityEvent> events = securityEventRepository.findTop30ByOrderByCreatedAtDesc();

        for (SecurityEvent event : events) {
            drafts.add(new NotificationDraft(
                    "admin-security-" + event.getId(),
                    "Security alert",
                    securityEventTitle(event.getEventType()),
                    securityEventMessage(event),
                    securityEventType(event.getEventType()),
                    event.getCreatedAt()
            ));
        }

        return drafts;
    }

    private String securityEventTitle(String eventType) {
        return switch (eventType) {
            case SecurityEventService.FAILED_LOGIN -> "Failed login attempt";
            case SecurityEventService.FAILED_SIGNUP -> "Failed signup attempt";
            case SecurityEventService.BLOCKED_LOGIN -> "Blocked account login attempt";
            case SecurityEventService.SERVER_ERROR -> "Server error";
            default -> "Security event";
        };
    }

    private String securityEventMessage(SecurityEvent event) {
        String email = event.getEmail() != null && !event.getEmail().isBlank()
                ? event.getEmail()
                : "unknown user";
        if (event.getMessage() != null && !event.getMessage().isBlank()) {
            return event.getMessage() + " (" + email + ")";
        }
        return "Event recorded for " + email + ".";
    }

    private AppNotification.NotificationType securityEventType(String eventType) {
        return switch (eventType) {
            case SecurityEventService.SERVER_ERROR -> AppNotification.NotificationType.WARNING;
            case SecurityEventService.BLOCKED_LOGIN -> AppNotification.NotificationType.WARNING;
            default -> AppNotification.NotificationType.INFO;
        };
    }

    private LocalDateTime eventTime(LocalDateTime primary, LocalDateTime fallback) {
        return primary != null ? primary : fallback;
    }
}
