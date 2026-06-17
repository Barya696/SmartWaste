package com.smartWaste.project.controller;

import com.smartWaste.project.model.Partner;
import com.smartWaste.project.model.Users;
import com.smartWaste.project.service.PartnerService;
import com.smartWaste.project.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/partners")
@RequiredArgsConstructor
public class PartnerController {
    
    private final PartnerService partnerService;
    private final UsersRepository usersRepository;
    
    /**
     * Create a new partner
     */
    @PostMapping
    public ResponseEntity<?> createPartner(@RequestBody Partner partner, Authentication auth) {
        try {
            System.out.println("\n========== CREATE PARTNER REQUEST ==========");
            System.out.println("Authentication: " + auth);
            System.out.println("Is Authenticated: " + (auth != null && auth.isAuthenticated()));
            if (auth == null || !auth.isAuthenticated()) {
                System.out.println("❌ Request not authenticated");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("User must be authenticated to create partner"));
            }
            System.out.println("Partner data: " + partner);
            System.out.println("Department: " + partner.getDepartment());
            
            // Extract supervisorId from authenticated user
            String userEmail = auth.getName();
            System.out.println("Authenticated user email: " + userEmail);
            Optional<Users> optionalUser = usersRepository.findByEmail(userEmail);
            if (optionalUser.isEmpty()) {
                System.out.println("❌ User not found in database: " + userEmail);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("User not found"));
            }
            Long supervisorId = optionalUser.get().getId();
            System.out.println("✅ Supervisor ID: " + supervisorId);
            
            Partner createdPartner = partnerService.createPartner(partner, supervisorId);
            System.out.println("✅ Partner created: " + createdPartner.getId());
            System.out.println("======================================\n");
            return ResponseEntity.status(HttpStatus.CREATED).body(createdPartner);
        } catch (IllegalArgumentException e) {
            System.out.println("❌ Bad Request: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            System.out.println("❌ Server Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to create partner: " + e.getMessage()));
        }
    }
    
    /**
     * Update an existing partner
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePartner(@PathVariable Long id, @RequestBody Partner partnerDetails) {
        try {
            Partner updatedPartner = partnerService.updatePartner(id, partnerDetails);
            return ResponseEntity.ok(updatedPartner);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to update partner: " + e.getMessage()));
        }
    }
    
    /**
     * Get partner by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getPartnerById(@PathVariable Long id) {
        try {
            Partner partner = partnerService.getPartnerById(id);
            return ResponseEntity.ok(partner);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Get partner by partner code
     */
    @GetMapping("/code/{partnerCode}")
    public ResponseEntity<?> getPartnerByCode(@PathVariable String partnerCode) {
        try {
            Partner partner = partnerService.getPartnerByCode(partnerCode);
            return ResponseEntity.ok(partner);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Get all partners by department
     */
    @GetMapping("/department/{department}")
    public ResponseEntity<?> getPartnersByDepartment(
            @PathVariable String department,
            Authentication authentication
    ) {
        try {
            // Debug: Log authentication info
            System.out.println("========== /api/partners/department/{" + department + "} ==========");
            System.out.println("Authentication: " + authentication);
            System.out.println("Is Authenticated: " + (authentication != null && authentication.isAuthenticated()));
            if (authentication != null) {
                System.out.println("Principal: " + authentication.getPrincipal());
                System.out.println("Authorities: " + authentication.getAuthorities());
                System.out.println("Details: " + authentication.getDetails());
            }
            System.out.println("Department requested: " + department);
            System.out.println("===========================================================");
            
            List<Partner> partners = partnerService.getPartnersByDepartment(department);
            return ResponseEntity.ok(partners);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to fetch partners: " + e.getMessage()));
        }
    }
    
    /**
     * Get all active partners by department
     */
    @GetMapping("/department/{department}/active")
    public ResponseEntity<?> getActivePartnersByDepartment(@PathVariable String department) {
        try {
            List<Partner> partners = partnerService.getActivePartnersByDepartment(department);
            return ResponseEntity.ok(partners);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to fetch active partners: " + e.getMessage()));
        }
    }
    
    /**
     * Get all partners by category
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<?> getPartnersByCategory(@PathVariable String category) {
        try {
            List<Partner> partners = partnerService.getPartnersByCategory(category);
            return ResponseEntity.ok(partners);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to fetch partners: " + e.getMessage()));
        }
    }
    
    /**
     * Get all partners created by a specific supervisor
     */
    @GetMapping("/supervisor/{supervisorId}")
    public ResponseEntity<?> getPartnersByCreator(@PathVariable Long supervisorId) {
        try {
            List<Partner> partners = partnerService.getPartnersByCreator(supervisorId);
            return ResponseEntity.ok(partners);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to fetch partners: " + e.getMessage()));
        }
    }
    
    /**
     * Get all partners
     */
    @GetMapping
    public ResponseEntity<?> getAllPartners() {
        try {
            List<Partner> partners = partnerService.getAllPartners();
            return ResponseEntity.ok(partners);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to fetch partners: " + e.getMessage()));
        }
    }
    
    /**
     * Delete a partner
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePartner(@PathVariable Long id) {
        try {
            partnerService.deletePartner(id);
            return ResponseEntity.ok(new MessageResponse("Partner deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to delete partner: " + e.getMessage()));
        }
    }
    
    /**
     * Error response class
     */
    static class ErrorResponse {
        public String error;
        public ErrorResponse(String error) {
            this.error = error;
        }
    }
    
    /**
     * Message response class
     */
    static class MessageResponse {
        public String message;
        public MessageResponse(String message) {
            this.message = message;
        }
    }
}
