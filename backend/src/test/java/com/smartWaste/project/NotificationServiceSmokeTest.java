package com.smartWaste.project;

import com.smartWaste.project.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class NotificationServiceSmokeTest {

    @Autowired
    private NotificationService notificationService;

    @Test
    void syncNotificationsForCitizenUser() {
        notificationService.syncAndGetForUser(4L);
        notificationService.getUnreadCount(4L);
    }
}
