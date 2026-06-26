package com.smartWaste.project.controller;

import com.smartWaste.project.dto.*;
import com.smartWaste.project.model.Users;
import com.smartWaste.project.model.PasswordReset;
import com.smartWaste.project.repository.UsersRepository;
import com.smartWaste.project.repository.PasswordResetRepository;
import com.smartWaste.project.service.EmailService;
import com.smartWaste.project.service.SecurityEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.ServletException;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final UsersRepository usersRepository;
    private final PasswordResetRepository passwordResetRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuthenticationManager authenticationManager;
    private final SecurityEventService securityEventService;
    
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest loginRequest,
            HttpServletRequest request,
            HttpSession session
    ) {
        try {
            System.out.println("\n========== LOGIN REQUEST ==========");
            System.out.println("Email: " + loginRequest.getEmail());
            System.out.println("Session ID (before auth): " + session.getId());
            
            var user = usersRepository.findByEmail(loginRequest.getEmail());
            
            if (user.isEmpty() || !passwordEncoder.matches(loginRequest.getPassword(), user.get().getPassword())) {
                System.out.println("❌ Login FAILED: Invalid email or password");
                securityEventService.record(
                        SecurityEventService.FAILED_LOGIN,
                        "Invalid email or password",
                        loginRequest.getEmail());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Invalid email or password"));
            }
            
            Users foundUser = user.get();
            System.out.println("✅ User found: " + foundUser.getEmail());
            System.out.println("User role: " + foundUser.getRole());
            System.out.println("User department: " + foundUser.getDepartment());
            
            // Check if user is blocked
            if (foundUser.getIsBlocked() != null && foundUser.getIsBlocked()) {
                System.out.println("❌ Login FAILED: User account is blocked");
                securityEventService.record(
                        SecurityEventService.BLOCKED_LOGIN,
                        "Blocked account attempted to sign in",
                        loginRequest.getEmail());
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Your account has been blocked. Please contact support."));
            }
            
            // ✅ Manually authenticate and create session
            try {
                System.out.println("Attempting manual authentication with AuthenticationManager...");
                
                // Create authentication token
                Authentication authToken = new UsernamePasswordAuthenticationToken(
                    loginRequest.getEmail(),
                    loginRequest.getPassword()
                );
                
                // Authenticate
                Authentication authentication = authenticationManager.authenticate(authToken);
                System.out.println("✅ Authentication successful");
                
                // Set authentication in SecurityContextHolder
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                // Manually save SecurityContext to session (required for JSESSIONID)
                HttpSessionSecurityContextRepository repo = new HttpSessionSecurityContextRepository();
                repo.saveContext(SecurityContextHolder.getContext(), request, null);
                
                System.out.println("✅ SecurityContext saved to session");
                System.out.println("Session ID (after auth): " + session.getId());
                System.out.println("Authorities: " + authentication.getAuthorities());
                System.out.println("Principal: " + authentication.getPrincipal());
                
            } catch (Exception e) {
                System.out.println("❌ Manual authentication FAILED: " + e.getMessage());
                e.printStackTrace();
                securityEventService.record(
                        SecurityEventService.SERVER_ERROR,
                        "Authentication failed: " + e.getMessage(),
                        loginRequest.getEmail());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Authentication failed: " + e.getMessage()));
            }
            
            System.out.println("✅ Login successful!");
            System.out.println("===================================\n");
            
            // Record successful login event
            securityEventService.record(
                    SecurityEventService.SUCCESSFUL_LOGIN,
                    "User successfully logged in",
                    loginRequest.getEmail());
            
            return ResponseEntity.ok(foundUser);
        } catch (Exception e) {
            System.out.println("❌ Login exception: " + e.getMessage());
            e.printStackTrace();
            securityEventService.record(
                    SecurityEventService.SERVER_ERROR,
                    "Login exception: " + e.getMessage(),
                    loginRequest.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("Invalid email or password"));
        }
    }
    
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpSession session, Authentication auth) {
        System.out.println("\n========== CHECK /me ENDPOINT ==========");
        if (auth == null || !auth.isAuthenticated()) {
            System.out.println("❌ No authentication found");
            System.out.println("Session ID: " + session.getId());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("Not authenticated"));
        }
        System.out.println("✅ User authenticated: " + auth.getName());
        System.out.println("Authorities: " + auth.getAuthorities());
        System.out.println("Session ID: " + session.getId());
        System.out.println("========================================\n");
        return ResponseEntity.ok(Map.of(
            "user", auth.getName(),
            "roles", auth.getAuthorities(),
            "sessionId", session.getId(),
            "authenticated", auth.isAuthenticated()
        ));
    }
    
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest signupRequest) {
        try {
            // Check if email already exists
            if (usersRepository.findByEmail(signupRequest.getEmail()).isPresent()) {
                securityEventService.record(
                        SecurityEventService.FAILED_SIGNUP,
                        "Signup attempted with an already registered email",
                        signupRequest.getEmail());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Email already registered"));
            }
            
            // Create new user with CITIZEN role
            Users newUser = new Users();
            newUser.setFirstName(signupRequest.getFirstName());
            newUser.setLastName(signupRequest.getLastName());
            newUser.setEmail(signupRequest.getEmail());
            newUser.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
            newUser.setPhoneNumber(signupRequest.getPhoneNumber());
            newUser.setRole(Users.UserRole.CITIZEN);
            newUser.setIsBlocked(false);
            
            // Generate username from email
            String username = signupRequest.getEmail().split("@")[0];
            newUser.setUsername(username);
            
            Users savedUser = usersRepository.save(newUser);
            
            // Record successful signup event
            securityEventService.record(
                    SecurityEventService.SUCCESSFUL_SIGNUP,
                    "User successfully signed up",
                    signupRequest.getEmail());
                    
            return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
        } catch (Exception e) {
            securityEventService.record(
                    SecurityEventService.FAILED_SIGNUP,
                    "Signup failed: " + e.getMessage(),
                    signupRequest.getEmail());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("Signup failed: " + e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            // Check if user exists
            Optional<Users> user = usersRepository.findByEmail(request.getEmail());
            if (user.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Email not found"));
            }
            
            // Generate verification code (6 digits)
            String code = String.format("%06d", (int)(Math.random() * 1000000));
            
            // Delete any existing password reset records for this email
            Optional<PasswordReset> existingReset = passwordResetRepository.findByEmail(request.getEmail());
            existingReset.ifPresent(passwordResetRepository::delete);
            
            // Create new password reset record
            PasswordReset passwordReset = new PasswordReset();
            passwordReset.setEmail(request.getEmail());
            passwordReset.setCode(code);
            passwordReset.setIsUsed(false);
            passwordResetRepository.save(passwordReset);
            
            // Send verification code via email
            emailService.sendVerificationCode(request.getEmail(), code);
            
            return ResponseEntity.ok(new ErrorResponse("Verification code sent to your email"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to process forgot password: " + e.getMessage()));
        }
    }
    
    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody VerifyCodeRequest request) {
        try {
            Optional<PasswordReset> passwordReset = passwordResetRepository.findByEmailAndCode(request.getEmail(), request.getCode());
            
            if (passwordReset.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Invalid verification code"));
            }
            
            PasswordReset reset = passwordReset.get();
            
            // Check if code is expired
            if (LocalDateTime.now().isAfter(reset.getExpiresAt())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Verification code expired"));
            }
            
            // Check if code is already used
            if (reset.getIsUsed()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Verification code already used"));
            }
            
            return ResponseEntity.ok(new ErrorResponse("Code verified successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to verify code: " + e.getMessage()));
        }
    }
    
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            Optional<PasswordReset> passwordReset = passwordResetRepository.findByEmailAndCode(request.getEmail(), request.getCode());
            
            if (passwordReset.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Invalid verification code"));
            }
            
            PasswordReset reset = passwordReset.get();
            
            // Check if code is expired
            if (LocalDateTime.now().isAfter(reset.getExpiresAt())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Verification code expired"));
            }
            
            // Check if code is already used
            if (reset.getIsUsed()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Verification code already used"));
            }
            
            // Find user and update password
            Optional<Users> user = usersRepository.findByEmail(request.getEmail());
            if (user.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("User not found"));
            }
            
            Users foundUser = user.get();
            foundUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
            usersRepository.save(foundUser);
            
            // Mark reset code as used
            reset.setIsUsed(true);
            passwordResetRepository.save(reset);
            
            return ResponseEntity.ok(new ErrorResponse("Password reset successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to reset password: " + e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, Authentication auth) {
        try {
            String email = auth != null ? auth.getName() : "unknown";
            
            // Invalidate session
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            
            // Clear security context
            SecurityContextHolder.clearContext();
            
            // Record logout event
            if (!"unknown".equals(email)) {
                securityEventService.record(
                        SecurityEventService.USER_LOGOUT,
                        "User successfully logged out",
                        email);
            }
            
            return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Logout failed: " + e.getMessage()));
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<Users> validateToken() {
        // This endpoint can be used to validate the user's session
        // For now, we'll keep it simple
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    
    public static class ErrorResponse {
        public String message;
        
        public ErrorResponse(String message) {
            this.message = message;
        }
    }
}
