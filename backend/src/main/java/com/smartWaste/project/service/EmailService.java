package com.smartWaste.project.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    public void sendVerificationCode(String email, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("baryaelimelec@gmail.com");
            message.setTo(email);
            message.setSubject("SmartWaste - Password Reset Code");
            message.setText(buildVerificationEmailBody(code));
            
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send verification code: " + e.getMessage());
        }
    }
    
    private String buildVerificationEmailBody(String code) {
        return "Hello,\n\n" +
                "Your password reset verification code is:\n\n" +
                code + "\n\n" +
                "This code will expire in 15 minutes.\n" +
                "If you did not request a password reset, please ignore this email.\n\n" +
                "Best regards,\n" +
                "SmartWaste Team";
    }
}
