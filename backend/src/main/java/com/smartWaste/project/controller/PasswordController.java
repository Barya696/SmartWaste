package com.smartWaste.project.controller;

import com.smartWaste.project.model.Users;
import com.smartWaste.project.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/password")
@RequiredArgsConstructor
public class PasswordController {
    
    private final UsersRepository usersRepository;
    private final PasswordEncoder passwordEncoder;
    
    @PostMapping("/hash-and-update")
    public ResponseEntity<?> hashAndUpdatePassword(
            @RequestParam String email,
            @RequestParam String plainPassword) {
        try {
            var user = usersRepository.findByEmail(email);
            
            if (user.isEmpty()) {
                return ResponseEntity.status(404)
                    .body(new ErrorResponse("User not found"));
            }
            
            Users u = user.get();
            u.setPassword(passwordEncoder.encode(plainPassword));
            usersRepository.save(u);
            
            return ResponseEntity.ok(new SuccessResponse("Password updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new ErrorResponse("Error: " + e.getMessage()));
        }
    }
    
    public static class SuccessResponse {
        public String message;
        public SuccessResponse(String message) {
            this.message = message;
        }
    }
    
    public static class ErrorResponse {
        public String message;
        public ErrorResponse(String message) {
            this.message = message;
        }
    }
}
