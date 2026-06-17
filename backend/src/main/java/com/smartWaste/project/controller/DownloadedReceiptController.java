package com.smartWaste.project.controller;

import com.smartWaste.project.dto.DownloadedReceiptRequest;
import com.smartWaste.project.model.DownloadedReceipt;
import com.smartWaste.project.model.Users;
import com.smartWaste.project.repository.UsersRepository;
import com.smartWaste.project.service.DownloadedReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/receipts")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class DownloadedReceiptController {

    private final DownloadedReceiptService downloadedReceiptService;
    private final UsersRepository usersRepository;

    @GetMapping
    public ResponseEntity<List<DownloadedReceipt>> getAllReceipts() {
        return ResponseEntity.ok(downloadedReceiptService.getAllReceipts());
    }

    @GetMapping("/partner/{partnerId}")
    public ResponseEntity<List<DownloadedReceipt>> getReceiptsByPartner(@PathVariable Long partnerId) {
        return ResponseEntity.ok(downloadedReceiptService.getReceiptsByPartner(partnerId));
    }

    @PostMapping
    public ResponseEntity<?> createReceipt(
            @RequestBody DownloadedReceiptRequest request,
            Authentication auth) {
        try {
            Long supervisorId = resolveSupervisorId(auth);
            DownloadedReceipt saved = downloadedReceiptService.createReceipt(request, supervisorId);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to save receipt: " + e.getMessage()));
        }
    }

    private Long resolveSupervisorId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        Optional<Users> user = usersRepository.findByEmail(auth.getName());
        return user.map(Users::getId).orElse(null);
    }
}
