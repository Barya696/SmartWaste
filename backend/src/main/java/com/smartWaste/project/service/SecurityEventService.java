package com.smartWaste.project.service;

import com.smartWaste.project.model.SecurityEvent;
import com.smartWaste.project.repository.SecurityEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class SecurityEventService {

    public static final String FAILED_LOGIN = "FAILED_LOGIN";
    public static final String FAILED_SIGNUP = "FAILED_SIGNUP";
    public static final String BLOCKED_LOGIN = "BLOCKED_LOGIN";
    public static final String SERVER_ERROR = "SERVER_ERROR";

    private final SecurityEventRepository securityEventRepository;

    public void record(String eventType, String message, String email) {
        SecurityEvent event = new SecurityEvent();
        event.setEventType(eventType);
        event.setMessage(message);
        event.setEmail(email);
        securityEventRepository.save(event);
    }
}
